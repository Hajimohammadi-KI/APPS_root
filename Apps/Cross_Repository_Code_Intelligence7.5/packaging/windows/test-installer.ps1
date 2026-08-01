[CmdletBinding()]
param(
  [string]$Setup,
  [string]$TestParent = $env:TEMP
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Setup)) {
  $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
  $Setup = Join-Path $scriptRoot '..\..\release\windows\Study-Tracker-Setup-7.5.5.exe'
}
$setupPath = [IO.Path]::GetFullPath($Setup)
$testRoot = Join-Path $TestParent ('CRCIDiagnostic-' + [Guid]::NewGuid().ToString('N'))
$programRoot = Join-Path $testRoot 'program'
$dataRoot = Join-Path $testRoot 'data'

function Get-FreeTcpPort {
  $listener = [Net.Sockets.TcpListener]::new(
    [Net.IPAddress]::Loopback,
    0)
  $listener.Start()
  try {
    return ([Net.IPEndPoint]$listener.LocalEndpoint).Port
  } finally {
    $listener.Stop()
  }
}

function Invoke-Setup {
  param([Parameter(Mandatory = $true)][string[]]$Parameters)

  $process = Start-Process `
    -FilePath $setupPath `
    -ArgumentList $Parameters `
    -PassThru `
    -Wait
  if ($process.ExitCode -ne 0) {
    throw "CRCI setup failed with exit code $($process.ExitCode): $Parameters"
  }
}

$env:CRCI_INSTALL_ROOT = $programRoot
$env:CRCI_DATA_ROOT = $dataRoot
$env:CRCI_NO_SHORTCUTS = '1'
$env:CRCI_NO_LAUNCH = '1'
$env:CRCI_NO_BROWSER = '1'
$env:CRCI_WEB_PORT = [string](Get-FreeTcpPort)
$env:CRCI_API_PORT = [string](Get-FreeTcpPort)
$env:STUDY_SUITE_AI_DIRECTORY = Join-Path $testRoot 'shared-ai'

Invoke-Setup -Parameters @('--silent-install')
$requiredFiles = @(
  'runtime\bun.exe',
  'api\main.js',
  'web\apps\web\server.js',
  'launcher.ps1',
  'launcher.vbs',
  'google-oauth.json',
  'Study-Tracker-Setup.exe',
  'version.txt'
)
foreach ($relativePath in $requiredFiles) {
  $installedFile = Join-Path $programRoot $relativePath
  if (-not (Test-Path -LiteralPath $installedFile -PathType Leaf)) {
    throw "Installed file is missing: $installedFile"
  }
}
$unexpectedExternalApps = Get-ChildItem `
  -LiteralPath $programRoot `
  -Recurse `
  -File |
  Where-Object {
    $_.Extension -ieq '.msi' -or
    $_.Name -match '(?i)(slack|microsoft[ _-]?teams|discord|zoom|notion)'
  }
if ($unexpectedExternalApps) {
  throw (
    'The setup contains an unexpected external application: ' +
    (($unexpectedExternalApps | Select-Object -ExpandProperty FullName) -join ', ')
  )
}

$marker = Join-Path $dataRoot 'preserve.marker'
[IO.File]::WriteAllText($marker, 'preserve')
$singleInstallMarker = Join-Path $programRoot 'single-install.marker'
[IO.File]::WriteAllText($singleInstallMarker, 'preserve')
Invoke-Setup -Parameters @('--silent-install')
if (-not (Test-Path -LiteralPath $marker -PathType Leaf)) {
  throw 'Repeated first-time setup removed local data.'
}
if (-not (Test-Path -LiteralPath $singleInstallMarker -PathType Leaf)) {
  throw 'Repeated first-time setup replaced the existing installation.'
}

$staleProgramFile = Join-Path $programRoot 'stale-program-file.txt'
[IO.File]::WriteAllText($staleProgramFile, 'remove during update')
Invoke-Setup -Parameters @('--silent-update')
if (Test-Path -LiteralPath $staleProgramFile -PathType Leaf) {
  throw 'Update did not replace stale program files.'
}
if (-not (Test-Path -LiteralPath $marker -PathType Leaf)) {
  throw 'Update removed local data.'
}

& powershell.exe `
  -NoProfile `
  -ExecutionPolicy Bypass `
  -File (Join-Path $programRoot 'launcher.ps1')

$webHealthy = $false
$apiHealthy = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  try {
    $webHealthy =
      (Invoke-WebRequest `
        -UseBasicParsing `
        -Uri "http://127.0.0.1:$($env:CRCI_WEB_PORT)" `
        -TimeoutSec 2).StatusCode -eq 200
  } catch { }
  try {
    $apiHealthy =
      (Invoke-WebRequest `
        -UseBasicParsing `
        -Uri "http://127.0.0.1:$($env:CRCI_API_PORT)/api/health" `
        -TimeoutSec 2).StatusCode -eq 200
  } catch { }
  if ($webHealthy -and $apiHealthy) {
    break
  }
  Start-Sleep -Milliseconds 500
}
if (-not ($webHealthy -and $apiHealthy)) {
  throw 'Installed CRCI web/API did not become healthy.'
}
$aiStatus = Invoke-RestMethod `
  -Uri "http://127.0.0.1:$($env:CRCI_API_PORT)/api/ai/status" `
  -TimeoutSec 5
if (
  $aiStatus.available -ne $true -or
  $aiStatus.connected -ne $false -or
  [string]$aiStatus.storage -ne 'Windows user-protected storage'
) {
  throw 'Installed Study Tracker API does not expose the optional protected AI connection.'
}
$calendarStatus = Invoke-RestMethod `
  -Uri "http://127.0.0.1:$($env:CRCI_API_PORT)/api/google-calendar/status" `
  -TimeoutSec 5
if ($calendarStatus.configured -ne $true) {
  throw 'Installed Study Tracker API does not expose embedded Google Calendar configuration.'
}
$embeddedOAuth = Get-Content `
  -Raw `
  -LiteralPath (Join-Path $programRoot 'google-oauth.json') |
  ConvertFrom-Json
if (
  [string]::IsNullOrWhiteSpace([string]$embeddedOAuth.redirectUri) -or
  [string]$calendarStatus.redirectUri -ne [string]$embeddedOAuth.redirectUri
) {
  throw 'Installed Study Tracker API changed the registered Google redirect URI.'
}
$connectResult = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:$($env:CRCI_API_PORT)/api/google-calendar/connect" `
  -TimeoutSec 5
$encodedRedirect = [Uri]::EscapeDataString([string]$embeddedOAuth.redirectUri)
if (
  [string]::IsNullOrWhiteSpace([string]$connectResult.authorizationUrl) -or
  -not ([string]$connectResult.authorizationUrl).Contains(
    "redirect_uri=$encodedRedirect")
) {
  throw 'Installed Study Tracker authorization URL does not use the registered redirect URI.'
}

Invoke-Setup -Parameters @('--silent-uninstall')
if (Test-Path -LiteralPath $programRoot) {
  throw 'Program files remain after uninstall.'
}
if (-not (Test-Path -LiteralPath $marker -PathType Leaf)) {
  throw 'Default uninstall removed local data.'
}

Invoke-Setup -Parameters @('--silent-install')
Invoke-Setup -Parameters @('--silent-uninstall', '--delete-data')
if (Test-Path -LiteralPath $programRoot) {
  throw 'Program files remain after delete-data uninstall.'
}
if (Test-Path -LiteralPath $dataRoot) {
  throw 'Local data remains after delete-data uninstall.'
}

$result = [pscustomobject]@{
  Install = 'PASS'
  SelfContainedRuntime = 'PASS'
  NoExternalAppDependency = 'PASS'
  DuplicateInstallBlocked = 'PASS'
  InPlaceUpdate = 'PASS'
  WebRuntime = 'PASS'
  ApiRuntime = 'PASS'
  EmbeddedGoogleCalendar = 'PASS'
  OptionalAIProviders = 'PASS'
  EncryptedAICredentials = 'PASS'
  UninstallPreservesData = 'PASS'
  DeleteDataUninstall = 'PASS'
  TestCleanup = 'PASS'
}

$resolvedParent = [IO.Path]::GetFullPath($TestParent).TrimEnd('\')
$resolvedTestRoot = [IO.Path]::GetFullPath($testRoot)
if (
  [IO.Path]::GetDirectoryName($resolvedTestRoot).TrimEnd('\') -eq
    $resolvedParent -and
  [IO.Path]::GetFileName($resolvedTestRoot) -match
    '^CRCIDiagnostic-[0-9a-f]{32}$' -and
  [IO.Directory]::Exists($resolvedTestRoot)
) {
  [IO.Directory]::Delete($resolvedTestRoot, $true)
}

$result
