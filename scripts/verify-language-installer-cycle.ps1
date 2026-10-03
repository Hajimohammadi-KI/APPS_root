param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('English', 'German')]
  [string]$Product,

  [Parameter(Mandatory = $true)]
  [string]$SetupPath,

  # Optional previous artifact exercises a real version upgrade without
  # launching the previous executable or using the normal learner profile.
  [string]$PreviousSetupPath,

  [string]$ExpectedVersion,

  # Conservative cold-start ceiling. The verified 1 September root cause was
  # not extraction time: Electron inherited ELECTRON_RUN_AS_NODE by presence
  # and exited with code 134 before serving HTTP. Removing that environment
  # entry around Start-Process fixed the exact current artifacts; the fresh
  # isolated runs answered in 1.768s (English) and 7.400s (German). Keep a
  # larger ceiling for slower disks/antivirus while the per-contract evidence
  # below still records attempts, last errors, process exit, and elapsed time.
  [int]$StartupTimeoutSeconds = 180,

  # Use the ordinary desktop launch path when redirected Windows stream handles
  # interfere with Electron startup. The HTTP and payload checks are identical.
  [switch]$DirectStartup
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-SetupAction {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Action,
    [string]$Executable = $script:ResolvedSetupPath
  )

  $process = Start-Process `
    -FilePath $Executable `
    -ArgumentList "--silent-$Action" `
    -Wait `
    -PassThru `
    -WindowStyle Hidden
  if ($process.ExitCode -ne 0) {
    throw "Installer action '$Action' exited with code $($process.ExitCode)."
  }
}

function Wait-ForHttpContracts {
  param(
    [Parameter(Mandatory = $true)]
    [array]$Contracts,

    [Parameter(Mandatory = $true)]
    [datetime]$Deadline,

    [Parameter(Mandatory = $true)]
    [System.Diagnostics.Process]$DesktopProcess
  )

  $startedAt = Get-Date
  $states = @(
    foreach ($contract in $Contracts) {
      [ordered]@{
        name = [string]$contract.Name
        url = [string]$contract.Url
        validator = [scriptblock]$contract.Validator
        ready = $false
        attempts = 0
        lastStatus = $null
        lastError = $null
        satisfiedAtMs = $null
      }
    }
  )

  do {
    foreach ($state in $states) {
      if ($state.ready) {
        continue
      }

      $state.attempts += 1
      try {
        $response = Invoke-WebRequest -Uri $state.url -UseBasicParsing -TimeoutSec 3
        $state.lastStatus = [int]$response.StatusCode
        if ($response.StatusCode -eq 200 -and (& $state.validator $response)) {
          $state.ready = $true
          $state.lastError = $null
          $state.satisfiedAtMs = [int][Math]::Round(
            ((Get-Date) - $startedAt).TotalMilliseconds
          )
        } else {
          $state.lastError = 'HTTP response did not satisfy the expected contract.'
        }
      } catch {
        # Startup is asynchronous; retain the last transient failure as evidence.
        $state.lastError = $_.Exception.Message
      }
    }

    $allReady = @($states | Where-Object { -not $_.ready }).Count -eq 0
    $DesktopProcess.Refresh()
    if ($allReady -or $DesktopProcess.HasExited) {
      break
    }
    Start-Sleep -Milliseconds 750
  } while ((Get-Date) -lt $Deadline)

  $checks = @(
    foreach ($state in $states) {
      [ordered]@{
        name = $state.name
        url = $state.url
        ready = $state.ready
        attempts = $state.attempts
        lastStatus = $state.lastStatus
        lastError = $state.lastError
        satisfiedAtMs = $state.satisfiedAtMs
      }
    }
  )
  $DesktopProcess.Refresh()
  return [ordered]@{
    ready = @($states | Where-Object { -not $_.ready }).Count -eq 0
    elapsedMs = [int][Math]::Round(((Get-Date) - $startedAt).TotalMilliseconds)
    processExited = $DesktopProcess.HasExited
    processExitCode = if ($DesktopProcess.HasExited) { $DesktopProcess.ExitCode } else { $null }
    checks = $checks
  }
}

function Stop-IsolatedProductProcesses {
  param(
    [Parameter(Mandatory = $true)]
    [string]$InstallRoot
  )

  $resolvedRoot = [IO.Path]::GetFullPath($InstallRoot).TrimEnd('\') + '\'
  Get-Process | Where-Object {
    $executablePath = $_.Path
    -not [string]::IsNullOrWhiteSpace($executablePath) -and
    $executablePath.StartsWith($resolvedRoot, [StringComparison]::OrdinalIgnoreCase)
  } | ForEach-Object {
    # Only processes whose executable lives inside this unique evidence root
    # are stopped; existing user installations remain outside the target.
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  }
}

$profiles = @{
  English = @{
    Prefix = 'ENGLISH_GRAMMAR'
    Configuration = 'Apps\English\English-Automaticity\distribution\windows-modern\setup.config.json'
    MainExecutable = 'English Grammar Automaticity.exe'
    WebUrl = 'http://127.0.0.1:3202/'
    ApiUrl = 'http://127.0.0.1:4201/api/health'
    CurriculumLanguage = 'en'
    WebValidator = { param($response) $response.Content -match 'dir="ltr"' }
    ApiValidator = {
      param($response)
      $json = $response.Content | ConvertFrom-Json
      $json.service -eq 'grammar-automaticity-api' -and $json.status -eq 'ok'
    }
  }
  German = @{
    Prefix = 'DEUTSCHFLOW'
    Configuration = 'Apps\Deutsch-Automaticity\distribution\windows-modern\setup.config.json'
    MainExecutable = 'DeutschFlow.exe'
    WebUrl = 'http://127.0.0.1:3210/'
    ApiUrl = 'http://127.0.0.1:4210/api/v1/health'
    CurriculumLanguage = 'de'
    WebValidator = { param($response) $response.Content -match 'dir="ltr"' }
    ApiValidator = {
      param($response)
      $json = $response.Content | ConvertFrom-Json
      $json.service -eq 'grammar-api' -and $json.status -eq 'ok'
    }
  }
}

$profile = $profiles[$Product]
$script:ResolvedSetupPath = [IO.Path]::GetFullPath($SetupPath)
if (-not (Test-Path -LiteralPath $script:ResolvedSetupPath -PathType Leaf)) {
  throw "Setup executable not found: $script:ResolvedSetupPath"
}
$payloadPath = [IO.Path]::ChangeExtension($script:ResolvedSetupPath, '.payload.zip')
if (-not (Test-Path -LiteralPath $payloadPath -PathType Leaf)) {
  throw "Companion payload not found: $payloadPath"
}

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$sourceConfiguration = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $workspaceRoot $profile.Configuration) | ConvertFrom-Json
function Get-CurriculumTextHash {
  param([string]$Text)
  $algorithm = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($algorithm.ComputeHash([Text.Encoding]::UTF8.GetBytes($Text.Replace("`r`n", "`n"))))).Replace('-', '').ToLowerInvariant() }
  finally { $algorithm.Dispose() }
}
$configurationDirectory = Split-Path -Parent (Join-Path $workspaceRoot $profile.Configuration)
$sourceCurriculumPath = [IO.Path]::GetFullPath((Join-Path $configurationDirectory ("..\..\apps\web\public\learning-core\curriculum-" + $profile.CurriculumLanguage + '.json')))
$sourceCurriculumText = Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceCurriculumPath
$sourceCurriculum = $sourceCurriculumText | ConvertFrom-Json
$curriculumSha256 = Get-CurriculumTextHash $sourceCurriculumText
$releaseVersion = if ([string]::IsNullOrWhiteSpace($ExpectedVersion)) { [string]$sourceConfiguration.version } else { $ExpectedVersion }

# Busy canonical ports can otherwise make an old source server look like a
# successfully started isolated install. Check before any installation action.
foreach ($endpoint in @([Uri]$profile.WebUrl, [Uri]$profile.ApiUrl)) {
  $client = [Net.Sockets.TcpClient]::new()
  $occupied = $false
  try {
    $connect = $client.ConnectAsync($endpoint.Host, $endpoint.Port)
    if ($connect.Wait(750)) { $occupied = $client.Connected }
  } catch {
    $occupied = $false
  } finally {
    $client.Dispose()
  }
  if ($occupied) { throw "Port $($endpoint.Port) is occupied. Stop only the verified app server before isolated lifecycle verification." }
}
$resolvedPreviousSetup = $null
if (-not [string]::IsNullOrWhiteSpace($PreviousSetupPath)) {
  $resolvedPreviousSetup = [IO.Path]::GetFullPath($PreviousSetupPath)
  if (-not (Test-Path -LiteralPath $resolvedPreviousSetup -PathType Leaf) -or
      -not (Test-Path -LiteralPath ([IO.Path]::ChangeExtension($resolvedPreviousSetup, '.payload.zip')) -PathType Leaf)) {
    throw 'Previous setup and its companion payload must both exist.'
  }
}
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$evidenceRoot = Join-Path $workspaceRoot "artifacts\installer-cycle\$Product-$stamp-$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
$installRoot = Join-Path $evidenceRoot 'install'
$dataRoot = Join-Path $evidenceRoot 'data'
New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null

$learnerDataPath = Join-Path $dataRoot 'synthetic-learner-data.json'
$learnerData = '{"purpose":"installer-preservation-check","containsRealLearnerData":false}'
[IO.File]::WriteAllText($learnerDataPath, $learnerData, [Text.UTF8Encoding]::new($false))
$learnerDataHash = (Get-FileHash -LiteralPath $learnerDataPath -Algorithm SHA256).Hash

$prefix = [string]$profile.Prefix
[Environment]::SetEnvironmentVariable("${prefix}_INSTALL_ROOT", $installRoot, 'Process')
[Environment]::SetEnvironmentVariable("${prefix}_DATA_ROOT", $dataRoot, 'Process')
[Environment]::SetEnvironmentVariable("${prefix}_USER_DATA_ROOT", $dataRoot, 'Process')
[Environment]::SetEnvironmentVariable("${prefix}_NO_SHORTCUTS", '1', 'Process')
[Environment]::SetEnvironmentVariable("${prefix}_NO_LAUNCH", '1', 'Process')
[Environment]::SetEnvironmentVariable("${prefix}_DISABLE_UPDATE_CHECK", '1', 'Process')

$report = [ordered]@{
  product = $Product
  version = $releaseVersion
  previousSetupPath = $resolvedPreviousSetup
  previousVersion = $null
  previousInstall = 'not-run'
  upgrade = 'not-run'
  setupPath = $script:ResolvedSetupPath
  setupSha256 = (Get-FileHash -LiteralPath $script:ResolvedSetupPath -Algorithm SHA256).Hash
  payloadSha256 = (Get-FileHash -LiteralPath $payloadPath -Algorithm SHA256).Hash
  signature = (Get-AuthenticodeSignature -FilePath $script:ResolvedSetupPath).Status.ToString()
  evidenceRoot = $evidenceRoot
  install = 'not-run'
  startup = 'not-run'
  transformerOrigin = 'not-run'
  startupError = $null
  startupElapsedMs = $null
  startupProcessExited = $null
  startupProcessExitCode = $null
  startupContracts = @()
  startupStdoutPath = $null
  startupStderrPath = $null
  startupMode = $(if ($DirectStartup) { 'direct-no-redirection' } else { 'captured-streams' })
  update = 'not-run'
  repair = 'not-run'
  repairedPayloadFiles = @()
  uninstall = 'not-run'
  learnerDataPreserved = $false
  preservationScope = 'Synthetic file marker in the isolated data directory; browser/IndexedDB restore is a separate check.'
  browserDataRestore = 'not-run'
  error = $null
}

try {
  if ($resolvedPreviousSetup) {
    Invoke-SetupAction -Action 'install' -Executable $resolvedPreviousSetup
    $previousVersionPath = Join-Path $installRoot 'version.txt'
    if (-not (Test-Path -LiteralPath $previousVersionPath -PathType Leaf)) { throw 'Previous install has no version marker.' }
    $report.previousVersion = (Get-Content -Raw -LiteralPath $previousVersionPath).Trim()
    if ($report.previousVersion -eq $releaseVersion) { throw 'Previous artifact must have a different version for the upgrade check.' }
    $report.previousInstall = 'verified'
    Invoke-SetupAction -Action 'update'
    if ((Get-Content -Raw -LiteralPath $previousVersionPath).Trim() -ne $releaseVersion) { throw 'Upgrade did not write the expected version.' }
    if ((Get-FileHash -LiteralPath $learnerDataPath -Algorithm SHA256).Hash -ne $learnerDataHash) { throw 'Upgrade changed the preservation marker.' }
    $report.upgrade = 'verified'
    Invoke-SetupAction -Action 'uninstall'
    if (Test-Path -LiteralPath $installRoot) { throw 'Upgrade test left the isolated installation root behind.' }
  }
  Invoke-SetupAction -Action 'install'
  $mainExecutable = Join-Path $installRoot ([string]$profile.MainExecutable)
  $versionPath = Join-Path $installRoot 'version.txt'
  if (-not (Test-Path -LiteralPath $mainExecutable -PathType Leaf)) {
    throw "Installed executable is missing: $mainExecutable"
  }
  if ((Get-Content -Raw -LiteralPath $versionPath).Trim() -ne $releaseVersion) {
    throw 'Fresh-install version marker does not match the expected version.'
  }
  $report.install = 'verified'

  try {
    [Environment]::SetEnvironmentVariable("${prefix}_NO_LAUNCH", $null, 'Process')
    $hadElectronRunAsNode = Test-Path Env:ELECTRON_RUN_AS_NODE
    $electronRunAsNode = if ($hadElectronRunAsNode) {
      [string]$env:ELECTRON_RUN_AS_NODE
    } else {
      $null
    }
    # PowerShell's Start-Process can retain an Env: provider entry that was
    # cleared only through Environment.SetEnvironmentVariable(). Electron
    # treats ELECTRON_RUN_AS_NODE as enabled by presence, even with an empty
    # value, then aborts because the packaged app has no Node snapshot.
    Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    try {
      $startupStdoutPath = Join-Path $evidenceRoot 'startup.stdout.log'
      $startupStderrPath = Join-Path $evidenceRoot 'startup.stderr.log'
      $launch = @{ FilePath=$mainExecutable; WorkingDirectory=$installRoot; WindowStyle='Hidden'; PassThru=$true }
      if (-not $DirectStartup) {
        $launch.RedirectStandardOutput=$startupStdoutPath
        $launch.RedirectStandardError=$startupStderrPath
        $report.startupStdoutPath=$startupStdoutPath
        $report.startupStderrPath=$startupStderrPath
      }
      $desktopProcess = Start-Process @launch
    } finally {
      if ($hadElectronRunAsNode) {
        Set-Item Env:ELECTRON_RUN_AS_NODE $electronRunAsNode
      } else {
        Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
      }
    }
    $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
    $startupResult = Wait-ForHttpContracts `
      -Contracts @(
        @{ Name = 'web'; Url = [string]$profile.WebUrl; Validator = $profile.WebValidator },
        @{ Name = 'api'; Url = [string]$profile.ApiUrl; Validator = $profile.ApiValidator },
        @{ Name = 'practice'; Url = ([string]$profile.WebUrl + 'practice'); Validator = { param($response) $response.Content -match 'id="practice-root"' -and $response.Content -match '/learning-core/practice.js' } },
        @{ Name = 'practice-runtime'; Url = ([string]$profile.WebUrl + 'learning-core/practice.js'); Validator = { param($response) $response.Content.Length -gt 20000 -and $response.Content -match 'automaticity:v2:' } },
        @{ Name = 'curriculum'; Url = ([string]$profile.WebUrl + 'learning-core/curriculum-' + $profile.CurriculumLanguage + '.json'); Validator = { param($response) $catalog = $response.Content | ConvertFrom-Json; $catalog.language -eq $profile.CurriculumLanguage -and $catalog.units.Count -eq $sourceCurriculum.units.Count -and (Get-CurriculumTextHash $response.Content) -eq $curriculumSha256 } }
      ) `
      -Deadline $deadline `
      -DesktopProcess $desktopProcess
    $report.startupElapsedMs = $startupResult.elapsedMs
    $report.startupProcessExited = $startupResult.processExited
    $report.startupProcessExitCode = $startupResult.processExitCode
    $report.startupContracts = $startupResult.checks
    $report.sourceCurriculumSha256 = $curriculumSha256
    $report.sourceCurriculumUnits = $sourceCurriculum.units.Count
    if (-not $startupResult.ready) {
      $failedContracts = @(
        $startupResult.checks |
          Where-Object { -not $_.ready } |
          ForEach-Object { "$($_.name): $($_.lastError)" }
      ) -join '; '
      throw "Installed application did not satisfy its HTTP readiness contracts. $failedContracts"
    }
    $appOrigin = ([string]$profile.WebUrl).TrimEnd('/')
    $modelEndpoint = $appOrigin + '/api/automaticity/transformer'
    $capabilities = Invoke-RestMethod -Uri $modelEndpoint -TimeoutSec 5
    if ($capabilities.enabled -ne $false -or @($capabilities.approvals).Count -ne 0) { throw 'Isolated installation unexpectedly enabled model assessment.' }
    $modelResponse = Invoke-WebRequest -Uri $modelEndpoint -Method Post -Headers @{Origin=$appOrigin} -ContentType 'application/json' -Body '{}' -UseBasicParsing -TimeoutSec 5
    if ($modelResponse.StatusCode -ne 200 -or ($modelResponse.Content | ConvertFrom-Json).reason -ne 'no_qualified_scope') { throw 'Valid app-origin request did not return the disabled assessment fallback.' }
    $unrelatedStatus = $null
    try { $unrelatedResponse=Invoke-WebRequest -Uri $modelEndpoint -Method Post -Headers @{Origin='https://unrelated.example'} -ContentType 'application/json' -Body '{}' -UseBasicParsing -TimeoutSec 5; $unrelatedStatus=[int]$unrelatedResponse.StatusCode } catch { if ($_.Exception.Response) { $unrelatedStatus=[int]$_.Exception.Response.StatusCode } else { throw } }
    if ($unrelatedStatus -ne 403) { throw 'Unrelated request origin was not rejected.' }
    $report.transformerOrigin = 'verified'
    Start-Sleep -Seconds 2
    $desktopProcess.Refresh()
    if ($desktopProcess.HasExited) {
      $report.startupProcessExited = $true
      $report.startupProcessExitCode = $desktopProcess.ExitCode
      throw "Installed desktop process exited after HTTP readiness with code $($desktopProcess.ExitCode)."
    }
    $report.startup = 'verified'
  } catch {
    # Preserve the exact startup failure while continuing update/repair checks.
    $report.startup = 'blocked'
    $report.startupError = $_.Exception.Message
  } finally {
    Stop-IsolatedProductProcesses -InstallRoot $installRoot
    [Environment]::SetEnvironmentVariable("${prefix}_NO_LAUNCH", '1', 'Process')
  }

  Invoke-SetupAction -Action 'update'
  if ((Get-Content -Raw -LiteralPath $versionPath).Trim() -ne $releaseVersion) {
    throw 'Update version marker does not match the expected version.'
  }
  $report.update = 'verified'

  $repairHashes = @{}
  foreach ($relativePayload in @('resources\local-app\api\main.js', 'resources\local-app\web.sha256')) {
    $repairPath = [IO.Path]::GetFullPath((Join-Path $installRoot $relativePayload))
    $installPrefix = [IO.Path]::GetFullPath($installRoot).TrimEnd('\') + '\'
    if (-not $repairPath.StartsWith($installPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Repair fixture escaped its isolated installation.' }
    if (-not (Test-Path -LiteralPath $repairPath -PathType Leaf)) { throw "Repair fixture is missing: $relativePayload" }
    $repairHashes[$relativePayload] = (Get-FileHash -LiteralPath $repairPath -Algorithm SHA256).Hash
    [IO.File]::WriteAllText($repairPath, 'corrupted-for-repair-check', [Text.UTF8Encoding]::new($false))
  }
  [IO.File]::WriteAllText($versionPath, 'corrupted-for-repair-check', [Text.UTF8Encoding]::new($false))
  Invoke-SetupAction -Action 'repair'
  if ((Get-Content -Raw -LiteralPath $versionPath).Trim() -ne $releaseVersion) {
    throw 'Repair did not restore the version marker.'
  }
  foreach ($relativePayload in $repairHashes.Keys) {
    if ((Get-FileHash -LiteralPath (Join-Path $installRoot $relativePayload) -Algorithm SHA256).Hash -ne $repairHashes[$relativePayload]) {
      throw "Repair did not restore the payload hash: $relativePayload"
    }
  }
  $report.repairedPayloadFiles = @($repairHashes.Keys | Sort-Object)
  $report.repair = 'verified'

  Invoke-SetupAction -Action 'uninstall'
  if (Test-Path -LiteralPath $installRoot) {
    throw 'Uninstall left the isolated installation root behind.'
  }
  $report.uninstall = 'verified'
  $report.learnerDataPreserved =
    (Test-Path -LiteralPath $learnerDataPath -PathType Leaf) -and
    ((Get-FileHash -LiteralPath $learnerDataPath -Algorithm SHA256).Hash -eq $learnerDataHash)
  if (-not $report.learnerDataPreserved) {
    throw 'Synthetic learner data was not preserved across the lifecycle.'
  }
} catch {
  $report.error = $_.Exception.Message
} finally {
  Stop-IsolatedProductProcesses -InstallRoot $installRoot
  New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null
  $reportPath = Join-Path $evidenceRoot 'report.json'
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
  Write-Output ($report | ConvertTo-Json -Depth 8)
}

if ($null -ne $report.error) {
  exit 1
}
if ($report.startup -ne 'verified') {
  exit 2
}
