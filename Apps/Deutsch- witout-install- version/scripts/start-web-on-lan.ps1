param(
  [int]$WebPort = 3211,
  [int]$ApiPort = 4210
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogRoot = Join-Path $ProjectRoot 'runtime-logs'
$WebEntry = Join-Path $ProjectRoot 'apps\web\.next\standalone\apps\web\server.js'
$ApiEntry = Join-Path $ProjectRoot 'apps\api\dist\main.js'

New-Item -ItemType Directory -Force -Path $LogRoot | Out-Null
if (-not (Test-Path -LiteralPath $WebEntry) -or -not (Test-Path -LiteralPath $ApiEntry)) {
  throw 'Compiled web/API files are missing. Build the app before using the LAN launcher.'
}

function Test-ListeningPort([int]$Port) {
  return $null -ne (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

if (-not (Test-ListeningPort $ApiPort)) {
  Start-Process -FilePath 'bun.exe' `
    -ArgumentList @('run', '--cwd', 'apps/api', 'start') `
    -WorkingDirectory $ProjectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogRoot 'deutsch-lan-api.log') `
    -RedirectStandardError (Join-Path $LogRoot 'deutsch-lan-api.err.log')
}

if (-not (Test-ListeningPort $WebPort)) {
  Start-Process -FilePath 'node.exe' `
    -ArgumentList @('scripts/start-standalone.mjs', '--port', "$WebPort", '--hostname', '0.0.0.0') `
    -WorkingDirectory $ProjectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $LogRoot 'deutsch-lan-web.log') `
    -RedirectStandardError (Join-Path $LogRoot 'deutsch-lan-web.err.log')
}

Start-Sleep -Seconds 4
$LocalUrl = "http://127.0.0.1:$WebPort/"
try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri $LocalUrl -TimeoutSec 10
  if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }
} catch {
  throw "DeutschFlow web app did not start correctly. Check $LogRoot. $($_.Exception.Message)"
}

$LanAddress = Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
  ForEach-Object { $_.IPv4Address.IPAddress } |
  Select-Object -First 1

Write-Host ''
Write-Host "Windows: $LocalUrl" -ForegroundColor Green
if ($LanAddress) {
  Write-Host "Android-Tablet (gleiches WLAN): http://${LanAddress}:$WebPort/" -ForegroundColor Cyan
} else {
  Write-Warning 'Keine aktive private IPv4-Adresse gefunden. Windows-Zugriff bleibt verfügbar.'
}
Write-Host 'Falls das Tablet nicht verbindet, Node.js im Windows-Firewallprofil Privat zulassen.'
Start-Process $LocalUrl
