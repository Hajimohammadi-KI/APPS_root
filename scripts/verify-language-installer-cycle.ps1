[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Product,
  [Parameter(Mandatory = $true)][string]$EnvironmentPrefix,
  [Parameter(Mandatory = $true)][string]$CurrentSetup,
  [Parameter(Mandatory = $true)][string]$PreviousSetup,
  [Parameter(Mandatory = $true)][string]$CurrentVersion,
  [Parameter(Mandatory = $true)][string]$PreviousVersion,
  [Parameter(Mandatory = $true)][string]$MainExecutable,
  [Parameter(Mandatory = $true)][int]$WebPort,
  [Parameter(Mandatory = $true)][int]$ApiPort,
  [string]$ApiHealthPath = '/api/health',
  [Parameter(Mandatory = $true)][string]$ExpectedText,
  [ValidateRange(90, 600)][int]$RuntimeTimeoutSeconds = 180,
  [switch]$SkipRuntimeChecks,
  [string]$RuntimeBlocker = ''
)

$ErrorActionPreference = 'Stop'
$runtimeSessionRoot = Join-Path 'D:\APPS_root\artifacts\desktop-runtime' (([Guid]::NewGuid().ToString('N').Substring(0, 8)) + '-shared')

if ($SkipRuntimeChecks -and [string]::IsNullOrWhiteSpace($RuntimeBlocker)) {
  throw 'RuntimeBlocker is required when SkipRuntimeChecks is used.'
}

function Assert-True {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { throw $Message }
}

function Invoke-Setup {
  param([string]$Setup, [string]$Operation)
  Write-Host "[$Product] $Operation via $([IO.Path]::GetFileName($Setup))"
  $setupProcess = Start-Process `
    -FilePath $Setup `
    -ArgumentList $Operation `
    -PassThru `
    -Wait `
    -WindowStyle Hidden
  if ($setupProcess.ExitCode -ne 0) {
    throw "$Operation failed with exit code $($setupProcess.ExitCode)."
  }
}

function Wait-ForPortsToClose {
  foreach ($port in @($WebPort, $ApiPort)) {
    for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
      $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
      if (-not $listener) { break }
      Start-Sleep -Milliseconds 250
    }
    Assert-True (-not (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)) "Port $port is already occupied; runtime evidence would be ambiguous."
  }
}

function Test-InstalledRuntime {
  param([string]$Stage, [string]$Executable)
  Wait-ForPortsToClose
  # Keep one isolated user environment for both launches in this lifecycle.
  # This mirrors a real update/repair: the first launch cold-extracts the current
  # payload, and the second launch revalidates the installed executable while
  # retaining the user's extraction cache. A new cold extraction per stage can
  # be stalled by Windows antivirus scanning and is not normal app behavior.
  $runtimeRoot = $runtimeSessionRoot
  $runtimeRoaming = Join-Path $runtimeRoot 'Roaming'
  $runtimeLocal = Join-Path $runtimeRoot 'Local'
  [IO.Directory]::CreateDirectory($runtimeRoaming) | Out-Null
  [IO.Directory]::CreateDirectory($runtimeLocal) | Out-Null

  $previousAppData = $env:APPDATA
  $previousLocalAppData = $env:LOCALAPPDATA
  $electronRunAsNodeWasPresent = Test-Path Env:ELECTRON_RUN_AS_NODE
  $previousElectronRunAsNode = if ($electronRunAsNodeWasPresent) { $env:ELECTRON_RUN_AS_NODE } else { $null }
  $env:APPDATA = $runtimeRoaming
  $env:LOCALAPPDATA = $runtimeLocal
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

  $process = $null
  try {
    # Launch the installed executable directly with a clean Electron environment.
    # A nested PowerShell wrapper proved unreliable for first-run extraction of
    # the German payload even though the same executable started directly.
    $process = Start-Process `
      -FilePath $Executable `
      -Environment @{
        APPDATA = $runtimeRoaming
        LOCALAPPDATA = $runtimeLocal
        ELECTRON_RUN_AS_NODE = $null
      } `
      -PassThru `
      -WindowStyle Hidden
    $webResponse = $null
    $apiResponse = $null
    $webError = 'not attempted'
    $apiError = 'not attempted'
    # Cold extraction of the embedded desktop payload can exceed 90 seconds on
    # Windows when Defender scans a freshly repaired installation.
    $deadline = [DateTime]::UtcNow.AddSeconds($RuntimeTimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
      if ($process.HasExited) {
        throw "$Stage desktop process exited before the local services became ready (exit code $($process.ExitCode))."
      }
      if ($null -eq $webResponse) {
        try {
          $candidate = Invoke-WebRequest -Uri "http://127.0.0.1:$WebPort/" -UseBasicParsing -TimeoutSec 1
          if ($candidate.StatusCode -eq 200) { $webResponse = $candidate }
        } catch {
          $webError = $_.Exception.Message
        }
      }
      if ($null -eq $apiResponse) {
        try {
          $candidate = Invoke-WebRequest -Uri "http://127.0.0.1:$ApiPort$ApiHealthPath" -UseBasicParsing -TimeoutSec 1
          if ($candidate.StatusCode -eq 200) { $apiResponse = $candidate }
        } catch {
          $apiError = $_.Exception.Message
        }
      }
      if ($null -ne $webResponse -and $null -ne $apiResponse) { break }
      Start-Sleep -Milliseconds 500
    }
    Assert-True ($null -ne $webResponse) "$Stage startup never returned a web response. Last error: $webError"
    Assert-True ($null -ne $apiResponse) "$Stage startup never returned an API response. Last error: $apiError"
    Assert-True ($webResponse.StatusCode -eq 200) "$Stage web status was $($webResponse.StatusCode)."
    Assert-True ($apiResponse.StatusCode -eq 200) "$Stage API status was $($apiResponse.StatusCode)."
    Assert-True ($webResponse.Content -match [regex]::Escape($ExpectedText)) "$Stage web response did not contain '$ExpectedText'."
    return [ordered]@{
      stage = $Stage
      runtimeRoot = $runtimeRoot
      webStatus = $webResponse.StatusCode
      apiStatus = $apiResponse.StatusCode
      apiHealthPath = $ApiHealthPath
      expectedTextFound = $true
    }
  } finally {
    if ($process -and -not $process.HasExited) {
      & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
    }
    $env:APPDATA = $previousAppData
    $env:LOCALAPPDATA = $previousLocalAppData
    if ($electronRunAsNodeWasPresent) {
      $env:ELECTRON_RUN_AS_NODE = $previousElectronRunAsNode
    } else {
      Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    }
    Wait-ForPortsToClose
  }
}

foreach ($path in @($CurrentSetup, $PreviousSetup)) {
  Assert-True (Test-Path -LiteralPath $path -PathType Leaf) "Setup file is missing: $path"
  $payload = [IO.Path]::ChangeExtension($path, '.payload.zip')
  Assert-True (Test-Path -LiteralPath $payload -PathType Leaf) "Setup payload is missing: $payload"
}

$safeName = $Product -replace '[^A-Za-z0-9_.-]', '-'
$runRoot = Join-Path 'D:\APPS_root\artifacts\installer-cycle' ("$safeName-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
$installRoot = Join-Path $runRoot 'InstallRoot'
$dataRoot = Join-Path $runRoot 'DataRoot'
[IO.Directory]::CreateDirectory($runRoot) | Out-Null
[IO.Directory]::CreateDirectory($dataRoot) | Out-Null

[Environment]::SetEnvironmentVariable("${EnvironmentPrefix}_INSTALL_ROOT", $installRoot, 'Process')
[Environment]::SetEnvironmentVariable("${EnvironmentPrefix}_DATA_ROOT", $dataRoot, 'Process')
[Environment]::SetEnvironmentVariable("${EnvironmentPrefix}_NO_SHORTCUTS", '1', 'Process')
[Environment]::SetEnvironmentVariable("${EnvironmentPrefix}_NO_LAUNCH", '1', 'Process')

$installedExecutable = Join-Path $installRoot $MainExecutable
$versionFile = Join-Path $installRoot 'version.txt'
$markerFile = Join-Path $dataRoot 'synthetic-learner-state.json'
$runtimeChecks = @()

Invoke-Setup $CurrentSetup '--silent-install'
Assert-True (Test-Path -LiteralPath $installedExecutable -PathType Leaf) 'Fresh install did not create the main executable.'
Assert-True (([IO.File]::ReadAllText($versionFile)).Trim() -eq $CurrentVersion) 'Fresh install version does not match.'
[IO.File]::WriteAllText($markerFile, '{"learner":"installer-cycle","progress":37,"note":"preserve exactly"}', [Text.UTF8Encoding]::new($false))
$freshMarkerHash = (Get-FileHash -LiteralPath $markerFile -Algorithm SHA256).Hash
if (-not $SkipRuntimeChecks) {
  $runtimeChecks += Test-InstalledRuntime 'fresh-install' $installedExecutable
}

Invoke-Setup $CurrentSetup '--silent-uninstall'
Assert-True (-not (Test-Path -LiteralPath $installedExecutable)) 'Silent uninstall left the main executable behind.'
Assert-True ((Get-FileHash -LiteralPath $markerFile -Algorithm SHA256).Hash -eq $freshMarkerHash) 'Uninstall changed or removed learner data.'

Invoke-Setup $PreviousSetup '--silent-install'
Assert-True (([IO.File]::ReadAllText($versionFile)).Trim() -eq $PreviousVersion) 'Previous-version install did not report the expected version.'
$updateMarkerHash = (Get-FileHash -LiteralPath $markerFile -Algorithm SHA256).Hash

Invoke-Setup $CurrentSetup '--silent-update'
Assert-True (([IO.File]::ReadAllText($versionFile)).Trim() -eq $CurrentVersion) 'Update did not install the current version.'
Assert-True ((Get-FileHash -LiteralPath $markerFile -Algorithm SHA256).Hash -eq $updateMarkerHash) 'Update changed learner data.'

[IO.File]::WriteAllText($versionFile, 'corrupted-version', [Text.UTF8Encoding]::new($false))
Invoke-Setup $CurrentSetup '--silent-repair'
Assert-True (([IO.File]::ReadAllText($versionFile)).Trim() -eq $CurrentVersion) 'Repair did not restore the corrupted version marker.'
Assert-True ((Get-FileHash -LiteralPath $markerFile -Algorithm SHA256).Hash -eq $updateMarkerHash) 'Repair changed learner data.'
if (-not $SkipRuntimeChecks) {
  $runtimeChecks += Test-InstalledRuntime 'post-update-repair' $installedExecutable
}

Invoke-Setup $CurrentSetup '--silent-uninstall'
Assert-True (-not (Test-Path -LiteralPath $installedExecutable)) 'Final uninstall left the main executable behind.'
Assert-True ((Get-FileHash -LiteralPath $markerFile -Algorithm SHA256).Hash -eq $updateMarkerHash) 'Final uninstall changed learner data.'

[ordered]@{
  product = $Product
  runRoot = $runRoot
  freshInstall = 'VERIFIED'
  startup = if ($SkipRuntimeChecks) { "BLOCKED: $RuntimeBlocker" } else { 'VERIFIED' }
  update = "$PreviousVersion -> $CurrentVersion VERIFIED"
  repair = 'VERIFIED after deliberate version marker corruption'
  uninstallPreservedData = 'VERIFIED'
  userDataSha256 = $updateMarkerHash
  runtimeChecks = $runtimeChecks
} | ConvertTo-Json -Depth 6
