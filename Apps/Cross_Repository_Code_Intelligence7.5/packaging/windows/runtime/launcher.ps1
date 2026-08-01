$ErrorActionPreference = 'Stop'

$programRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$runtime = Join-Path $programRoot 'runtime\bun.exe'
$apiEntry = Join-Path $programRoot 'api\main.js'
$webRoot = Join-Path $programRoot 'web\apps\web'
$webEntry = Join-Path $webRoot 'server.js'
$dataRoot = if ($env:CRCI_DATA_ROOT) {
  $env:CRCI_DATA_ROOT
} else {
  Join-Path $env:LOCALAPPDATA 'CRCI Research OS'
}
$runRoot = Join-Path $dataRoot 'run'
$webPort = if ($env:CRCI_WEB_PORT) { [int]$env:CRCI_WEB_PORT } else { 3100 }
$apiPort = if ($env:CRCI_API_PORT) { [int]$env:CRCI_API_PORT } else { 4101 }
$appUrl = "http://127.0.0.1:$webPort"
$apiHealthUrl = "http://127.0.0.1:$apiPort/api/health"
$oauthConfiguration = Join-Path $programRoot 'google-oauth.json'

function Test-Endpoint {
  param([Parameter(Mandatory = $true)][string]$Uri)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  } catch {
    return $false
  }
}

function Start-HiddenBun {
  param(
    [Parameter(Mandatory = $true)][string]$EntryPoint,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory,
    [Parameter(Mandatory = $true)][hashtable]$Environment
  )

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $runtime
  $startInfo.Arguments = '"' + $EntryPoint + '"'
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

  foreach ($entry in $Environment.GetEnumerator()) {
    $startInfo.EnvironmentVariables[$entry.Key] = [string]$entry.Value
  }

  return [System.Diagnostics.Process]::Start($startInfo)
}

function Wait-ForEndpoint {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    if (Test-Endpoint -Uri $Uri) {
      return $true
    }
    Start-Sleep -Milliseconds 300
  } while ((Get-Date) -lt $deadline)

  return $false
}

try {
  if (-not (Test-Path -LiteralPath $runtime) -or
      -not (Test-Path -LiteralPath $apiEntry) -or
      -not (Test-Path -LiteralPath $webEntry)) {
    throw 'Die Installation ist unvollstaendig. Bitte fuehren Sie Study Tracker Setup erneut aus.'
  }

  New-Item -ItemType Directory -Force -Path $runRoot | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $dataRoot 'data') | Out-Null

  if (-not (Test-Endpoint -Uri $apiHealthUrl)) {
    $apiEnvironment = @{
      PORT = [string]$apiPort
      WEB_ORIGIN = $appUrl
      STATE_DATA_DIR = (Join-Path $dataRoot 'data')
      STUDY_SUITE_PROFILE_DIRECTORY = (Join-Path $env:APPDATA 'Study Suite')
      STUDY_SUITE_AI_DIRECTORY = $(if ($env:STUDY_SUITE_AI_DIRECTORY) {
          $env:STUDY_SUITE_AI_DIRECTORY
        } else {
          Join-Path $env:APPDATA 'Study Suite'
        })
      NODE_ENV = 'production'
    }
    if (Test-Path -LiteralPath $oauthConfiguration -PathType Leaf) {
      $oauth = Get-Content -Raw -LiteralPath $oauthConfiguration | ConvertFrom-Json
      if (-not [string]::IsNullOrWhiteSpace([string]$oauth.clientId)) {
        $apiEnvironment.GOOGLE_CALENDAR_CLIENT_ID = [string]$oauth.clientId
      }
      if (-not [string]::IsNullOrWhiteSpace([string]$oauth.clientSecret)) {
        $apiEnvironment.GOOGLE_CALENDAR_CLIENT_SECRET = [string]$oauth.clientSecret
      }
      if (-not [string]::IsNullOrWhiteSpace([string]$oauth.redirectUri)) {
        $apiEnvironment.GOOGLE_CALENDAR_REDIRECT_URI = [string]$oauth.redirectUri
      }
    }
    if (-not $apiEnvironment.ContainsKey('GOOGLE_CALENDAR_REDIRECT_URI')) {
      $apiEnvironment.GOOGLE_CALENDAR_REDIRECT_URI =
        "http://127.0.0.1:$apiPort/api/google-calendar/callback"
    }
    $apiProcess = Start-HiddenBun `
      -EntryPoint $apiEntry `
      -WorkingDirectory (Split-Path -Parent $apiEntry) `
      -Environment $apiEnvironment
    Set-Content -LiteralPath (Join-Path $runRoot 'api.pid') -Value $apiProcess.Id -Encoding Ascii
  }

  if (-not (Wait-ForEndpoint -Uri $apiHealthUrl -TimeoutSeconds 45)) {
    throw 'Der lokale Study-Tracker-Dienst konnte nicht gestartet werden. Bitte starte Study Tracker erneut oder repariere die Installation.'
  }

  if (-not (Test-Endpoint -Uri $appUrl)) {
    $webProcess = Start-HiddenBun `
      -EntryPoint $webEntry `
      -WorkingDirectory $webRoot `
      -Environment @{
        PORT = [string]$webPort
        HOSTNAME = '127.0.0.1'
        NODE_ENV = 'production'
      }
    Set-Content -LiteralPath (Join-Path $runRoot 'web.pid') -Value $webProcess.Id -Encoding Ascii
  }

  if (-not (Wait-ForEndpoint -Uri $appUrl -TimeoutSeconds 45)) {
    throw 'Study Tracker konnte nicht gestartet werden. Bitte installieren Sie die Anwendung erneut.'
  }

  if ($env:CRCI_NO_BROWSER -ne '1') {
    Start-Process $appUrl
  }
} catch {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show(
    $_.Exception.Message,
    'Study Tracker',
    [System.Windows.MessageBoxButton]::OK,
    [System.Windows.MessageBoxImage]::Error
  ) | Out-Null
}
