[CmdletBinding()]
param(
  [int]$WebPort = 3101,
  [int]$ApiPort = 4101,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$bun = (Get-Command bun.exe -ErrorAction Stop).Source
$webUrl = "http://127.0.0.1:$WebPort"
$apiUrl = "http://127.0.0.1:$ApiPort/api"
$dataRoot = Join-Path $env:TEMP (
  'crci-preview-' + [Guid]::NewGuid().ToString('N'))

foreach ($port in @($WebPort, $ApiPort)) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    throw "Preview port $port is already in use."
  }
}

New-Item -ItemType Directory -Path $dataRoot | Out-Null

$env:PORT = [string]$ApiPort
$env:WEB_ORIGIN = $webUrl
$env:STATE_DATA_DIR = $dataRoot
$apiProcess = Start-Process `
  -FilePath $bun `
  -ArgumentList @('run', 'dev') `
  -WorkingDirectory (Join-Path $repositoryRoot 'apps\api') `
  -WindowStyle Hidden `
  -PassThru

$env:NEXT_PUBLIC_API_URL = $apiUrl
$webProcess = Start-Process `
  -FilePath $bun `
  -ArgumentList @(
    'x',
    'next',
    'dev',
    '--hostname',
    '127.0.0.1',
    '--port',
    [string]$WebPort
  ) `
  -WorkingDirectory (Join-Path $repositoryRoot 'apps\web') `
  -WindowStyle Hidden `
  -PassThru

$apiReady = $false
$webReady = $false
for ($attempt = 0; $attempt -lt 90; $attempt++) {
  Start-Sleep -Milliseconds 400
  try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -TimeoutSec 2
    $apiReady = [bool]$health.ok
  } catch {
    $apiReady = $false
  }
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $webUrl -TimeoutSec 2
    $webReady = $response.StatusCode -eq 200
  } catch {
    $webReady = $false
  }
  if ($apiReady -and $webReady) {
    break
  }
}

if (-not ($apiReady -and $webReady)) {
  foreach ($process in @($apiProcess, $webProcess)) {
    if (-not $process.HasExited) {
      Stop-Process -Id $process.Id -Force
    }
  }
  throw 'The CRCI preview did not become ready.'
}

if (-not $NoBrowser) {
  Start-Process $webUrl
}

[pscustomobject]@{
  webUrl = $webUrl
  apiUrl = $apiUrl
  apiPid = $apiProcess.Id
  webPid = $webProcess.Id
  dataRoot = $dataRoot
} | ConvertTo-Json
