$ErrorActionPreference = 'Stop'
$starterRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverFile = Join-Path $starterRoot 'server.mjs'
$starterUrl = 'http://127.0.0.1:4300'

function Test-StarterReady {
  try {
    $health = Invoke-RestMethod -Uri "$starterUrl/api/health" -TimeoutSec 1
    $status = Invoke-RestMethod -Uri "$starterUrl/api/status" -TimeoutSec 4
    return $health.status -eq 'ok' -and
      $null -ne $status.english -and
      $null -ne $status.german -and
      $null -ne $status.tracker -and
      $null -ne $status.settings -and
      $null -ne $status.pdf
  }
  catch {
    return $false
  }
}

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

$alreadyRunning = Test-StarterReady
if (-not $alreadyRunning) {
  $listener = Get-NetTCPConnection -LocalPort 4300 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
    if ($owner -and $owner.CommandLine -and $owner.CommandLine -match [regex]::Escape($serverFile)) {
      Stop-Process -Id $listener.OwningProcess -Force
      Start-Sleep -Milliseconds 500
    }
    else {
      throw "Port 4300 is already used by another program (PID $($listener.OwningProcess))."
    }
  }

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
      if (Test-StarterReady) { $ready = $true; break }
    } catch { }
  }
  if (-not $ready) { throw 'The App Starter could not start. Check Apps\Starter-App\logs\starter.error.log.' }
}

Start-Process $starterUrl

