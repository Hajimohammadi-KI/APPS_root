$ErrorActionPreference = 'Stop'

$workspace = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $workspace 'artifacts\release-runtime'
$node = (Get-Command node.exe -ErrorAction Stop).Source
$bun = (Get-Command bun.exe -ErrorAction Stop).Source
$pwsh = (Get-Command pwsh.exe -ErrorAction Stop).Source
$serviceRunner = Join-Path $workspace 'scripts\run-language-service.ps1'
$logRoot = Join-Path $runtimeRoot 'lan-logs'
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
$lanHost = '0.0.0.0'
$publicHost = '192.168.178.24'

function Get-LatestRuntime([string]$prefix) {
  $runtime = Get-ChildItem -LiteralPath $runtimeRoot -Directory |
    Where-Object { $_.Name.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase) } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $runtime) {
    throw "No release runtime matching '$prefix' was found under $runtimeRoot."
  }

  $receipt = Join-Path $runtime.FullName 'receipt.json'
  $webEntry = Join-Path $runtime.FullName 'web\apps\web\server.js'
  $apiEntry = Join-Path $runtime.FullName 'api\main.js'
  if (-not (Test-Path -LiteralPath $receipt) -or -not (Test-Path -LiteralPath $webEntry) -or -not (Test-Path -LiteralPath $apiEntry)) {
    throw "Runtime $($runtime.Name) is incomplete. Expected receipt.json, web server.js, and api main.js."
  }

  [pscustomobject]@{
    Name = $runtime.Name
    Root = $runtime.FullName
    WebEntry = $webEntry
    WebWorkingDirectory = Split-Path -Parent $webEntry
    ApiEntry = $apiEntry
    ApiWorkingDirectory = Split-Path -Parent $apiEntry
  }
}

function Get-Listener([int]$port) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Start-ServiceProcess {
  param(
    [string]$Name,
    [string]$RuntimePath,
    [string]$Entry,
    [string]$WorkingDirectory,
    [int]$Port,
    [hashtable]$Environment
  )

  $listener = Get-Listener $Port
  if ($listener) {
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
    if ($owner -and $owner.CommandLine -and $owner.CommandLine.IndexOf($Entry, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
      return [int]$listener.OwningProcess
    }
    throw "Port $Port is already used by another process (PID $($listener.OwningProcess)); refusing to replace it."
  }

  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $quote = { param([string]$value) '"' + $value.Replace('"', '\"') + '"' }
  $stdoutPath = Join-Path $logRoot (($Name -replace '[^A-Za-z0-9]+', '-').ToLowerInvariant() + '.out.log')
  $stderrPath = Join-Path $logRoot (($Name -replace '[^A-Za-z0-9]+', '-').ToLowerInvariant() + '.error.log')
  $startInfo.FileName = $pwsh
  $startInfo.Arguments = '-NoProfile -ExecutionPolicy Bypass -File ' + (& $quote $serviceRunner) +
    ' -RuntimePath ' + (& $quote $RuntimePath) +
    ' -Entry ' + (& $quote $Entry) +
    ' -WorkingDirectory ' + (& $quote $WorkingDirectory) +
    ' -StdoutPath ' + (& $quote $stdoutPath) +
    ' -StderrPath ' + (& $quote $stderrPath)
  $startInfo.WorkingDirectory = $workspace
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  foreach ($key in $Environment.Keys) {
    $startInfo.Environment[$key] = [string]$Environment[$key]
  }

  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  if (-not $process.Start()) {
    throw "Could not start $Name."
  }
  return $process.Id
}

function Wait-Http([string]$url, [int]$timeoutSeconds = 20) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      if ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 500) {
        return [int]$response.StatusCode
      }
    } catch { }
    Start-Sleep -Milliseconds 250
  } while ((Get-Date) -lt $deadline)
  throw "Timed out waiting for $url."
}

$english = Get-LatestRuntime 'en-'
$german = Get-LatestRuntime 'de-'
$cors = "http://${publicHost}:3203,http://${publicHost}:3211"
$services = @(
  [pscustomobject]@{ Name = 'English API'; RuntimePath = $bun; Entry = $english.ApiEntry; WorkingDirectory = $english.ApiWorkingDirectory; Port = 4201; Health = 'http://127.0.0.1:4201/api/health'; Environment = @{ HOST = $lanHost; PORT = 4201; CORS_ORIGINS = $cors } },
  [pscustomobject]@{ Name = 'DeutschFlow API'; RuntimePath = $bun; Entry = $german.ApiEntry; WorkingDirectory = $german.ApiWorkingDirectory; Port = 4210; Health = 'http://127.0.0.1:4210/api/v1/health'; Environment = @{ API_PORT = 4210; WEB_ORIGINS = $cors } },
  [pscustomobject]@{ Name = 'English Automaticity'; RuntimePath = $node; Entry = $english.WebEntry; WorkingDirectory = $english.WebWorkingDirectory; Port = 3203; Health = 'http://127.0.0.1:3203/'; Environment = @{ HOSTNAME = $lanHost; PORT = 3203 } },
  [pscustomobject]@{ Name = 'DeutschFlow'; RuntimePath = $node; Entry = $german.WebEntry; WorkingDirectory = $german.WebWorkingDirectory; Port = 3211; Health = 'http://127.0.0.1:3211/'; Environment = @{ HOSTNAME = $lanHost; PORT = 3211 } }
)

$started = foreach ($service in $services) {
  $processId = Start-ServiceProcess -Name $service.Name -RuntimePath $service.RuntimePath -Entry $service.Entry -WorkingDirectory $service.WorkingDirectory -Port $service.Port -Environment $service.Environment
  $status = Wait-Http $service.Health
  [pscustomobject]@{ Service = $service.Name; Port = $service.Port; PID = $processId; HTTP = $status }
}

Write-Output "Language LAN services are ready at ${publicHost}:"
Write-Output "  English Automaticity: http://${publicHost}:3203/ ($($english.Name))"
Write-Output "  DeutschFlow:         http://${publicHost}:3211/ ($($german.Name))"
$started | Format-Table -AutoSize
