$ErrorActionPreference = 'Stop'
$starterRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverFile = Join-Path $starterRoot 'server.mjs'
$starterUrl = 'http://127.0.0.1:4300'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show(
    'Node.js is required to run the local apps. It is already used by these projects, but Windows cannot find it in PATH.',
    'App Starter',
    'OK',
    'Error'
  ) | Out-Null
  exit 1
}

$alreadyRunning = Get-NetTCPConnection -LocalPort 4300 -State Listen -ErrorAction SilentlyContinue
if (-not $alreadyRunning) {
  $logRoot = Join-Path $starterRoot 'logs'
  New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
  Start-Process -FilePath (Get-Command node).Source `
    -ArgumentList @($serverFile) `
    -WorkingDirectory $starterRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logRoot 'starter.out.log') `
    -RedirectStandardError (Join-Path $logRoot 'starter.error.log')

  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 250
    try {
      $response = Invoke-WebRequest -Uri "$starterUrl/api/status" -UseBasicParsing -TimeoutSec 1
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
  }
  if (-not $ready) { throw 'The App Starter could not start. Check Apps\Starter-App\logs\starter.error.log.' }
}

Start-Process $starterUrl

