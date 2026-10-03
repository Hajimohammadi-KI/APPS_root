[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Setup,
  [string]$Version = '27.3.18',
  [ValidateRange(90, 600)][int]$RuntimeTimeoutSeconds = 240
)

$ErrorActionPreference = 'Stop'
$readerPort = 4332
$webPort = 3201
$apiPort = 4201
$projectRoot = Split-Path -Parent $PSScriptRoot
$readerProject = Resolve-Path (Join-Path $projectRoot '..\..\Apps-For-Integeration\Reader-PDF-App')
$runRoot = Join-Path 'D:\APPS_root\artifacts\installed-reader-cycle' (
  'English-' + $Version + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' +
  [Guid]::NewGuid().ToString('N').Substring(0, 8)
)
$installRoot = Join-Path $runRoot 'InstallRoot'
$dataRoot = Join-Path $runRoot 'DataRoot'
$runtimeRoaming = Join-Path $runRoot 'Runtime\Roaming'
$runtimeLocal = Join-Path $runRoot 'Runtime\Local'
$readerImportRoot = Join-Path $runtimeRoaming 'English Grammar Automaticity\PDF Reader Imports'
$installedExecutable = Join-Path $installRoot 'English Grammar Automaticity.exe'
$resultPath = Join-Path $runRoot 'result.json'
$desktopProcess = $null

function Assert-True {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { throw $Message }
}

function Wait-PortsClosed {
  foreach ($port in @($webPort, $apiPort, $readerPort)) {
    for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
      if (-not (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)) { break }
      Start-Sleep -Milliseconds 250
    }
    Assert-True (-not (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)) (
      "Port $port is occupied; installed Reader evidence would be ambiguous."
    )
  }
}

function Invoke-Setup {
  param([string]$Operation)
  $process = Start-Process -FilePath $Setup -ArgumentList $Operation -PassThru -Wait -WindowStyle Hidden
  Assert-True ($process.ExitCode -eq 0) "$Operation failed with exit code $($process.ExitCode)."
}

function Start-InstalledDesktop {
  return Start-Process `
    -FilePath $installedExecutable `
    -Environment @{
      APPDATA = $runtimeRoaming
      LOCALAPPDATA = $runtimeLocal
      ELECTRON_RUN_AS_NODE = $null
      ENGLISH_GRAMMAR_USER_DATA_ROOT = (Join-Path $runtimeRoaming 'English Grammar Automaticity')
    } `
    -PassThru `
    -WindowStyle Hidden
}

function Stop-InstalledDesktop {
  param($Process)
  if ($Process -and -not $Process.HasExited) {
    & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
  }
  Wait-PortsClosed
}

function Wait-ReaderHealth {
  param($Process, [string]$Stage)
  $lastError = 'not attempted'
  $deadline = [DateTime]::UtcNow.AddSeconds($RuntimeTimeoutSeconds)
  while ([DateTime]::UtcNow -lt $deadline) {
    if ($Process.HasExited) {
      throw "$Stage desktop exited before Reader became ready (exit code $($Process.ExitCode))."
    }
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:$readerPort/api/health" -TimeoutSec 1
      if (
        $health.service -eq 'research-pdf-studio' -and
        $health.ready -eq $true -and
        $health.contractVersion -eq 1 -and
        $health.version -eq $Version -and
        $health.storageBoundary -eq 'browser-local' -and
        $health.localPdfImport -eq 'loopback-only'
      ) {
        return $health
      }
      $lastError = 'Health JSON did not match the exact Reader contract.'
    } catch {
      $lastError = $_.Exception.Message
    }
    Start-Sleep -Milliseconds 500
  }
  throw "$Stage Reader health timed out. Last error: $lastError"
}

foreach ($path in @($Setup, $readerProject)) {
  Assert-True (Test-Path -LiteralPath $path) "Required path is missing: $path"
}
$payload = [IO.Path]::ChangeExtension($Setup, '.payload.zip')
Assert-True (Test-Path -LiteralPath $payload -PathType Leaf) "Setup payload is missing: $payload"

[IO.Directory]::CreateDirectory($dataRoot) | Out-Null
[IO.Directory]::CreateDirectory($runtimeRoaming) | Out-Null
[IO.Directory]::CreateDirectory($runtimeLocal) | Out-Null

$environmentNames = @(
  'ENGLISH_GRAMMAR_INSTALL_ROOT',
  'ENGLISH_GRAMMAR_DATA_ROOT',
  'ENGLISH_GRAMMAR_NO_SHORTCUTS',
  'ENGLISH_GRAMMAR_NO_LAUNCH',
  'ENGLISH_GRAMMAR_USER_DATA_ROOT',
  'READER_EXTERNAL_BASE_URL',
  'READER_IMPORT_ROOT',
  'READER_EXPECTED_VERSION'
)
$previousEnvironment = @{}
foreach ($name in $environmentNames) {
  $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

try {
  Wait-PortsClosed
  [Environment]::SetEnvironmentVariable('ENGLISH_GRAMMAR_INSTALL_ROOT', $installRoot, 'Process')
  [Environment]::SetEnvironmentVariable('ENGLISH_GRAMMAR_DATA_ROOT', $dataRoot, 'Process')
  [Environment]::SetEnvironmentVariable('ENGLISH_GRAMMAR_NO_SHORTCUTS', '1', 'Process')
  [Environment]::SetEnvironmentVariable('ENGLISH_GRAMMAR_NO_LAUNCH', '1', 'Process')

  Write-Host '[installed-reader] Fresh install'
  Invoke-Setup '--silent-install'
  Assert-True (Test-Path -LiteralPath $installedExecutable -PathType Leaf) 'Installed executable is missing.'

  Write-Host '[installed-reader] Start installed desktop and exact Reader health'
  $desktopProcess = Start-InstalledDesktop
  $freshHealth = Wait-ReaderHealth $desktopProcess 'fresh-install'
  Assert-True (Test-Path -LiteralPath $readerImportRoot -PathType Container) 'Reader import root was not created.'

  Write-Host '[installed-reader] Real PDF render, selection, marks, export, reload, and tablet checks'
  [Environment]::SetEnvironmentVariable('READER_EXTERNAL_BASE_URL', "http://127.0.0.1:$readerPort", 'Process')
  [Environment]::SetEnvironmentVariable('READER_IMPORT_ROOT', $readerImportRoot, 'Process')
  [Environment]::SetEnvironmentVariable('READER_EXPECTED_VERSION', $Version, 'Process')
  Push-Location $readerProject
  try {
    & bunx playwright test tests/e2e/reader-lifecycle.spec.ts
    Assert-True ($LASTEXITCODE -eq 0) "Installed Reader browser checks failed with exit code $LASTEXITCODE."
  } finally {
    Pop-Location
  }

  $fixtureHash = (Get-FileHash -LiteralPath (Join-Path $readerProject 'tests\fixtures\reader-smoke.pdf') -Algorithm SHA256).Hash
  $importedPdf = Join-Path $readerImportRoot ($fixtureHash.ToLowerInvariant() + '.pdf')
  Assert-True (Test-Path -LiteralPath $importedPdf -PathType Leaf) 'Browser check did not import the real PDF fixture.'
  $importedHash = (Get-FileHash -LiteralPath $importedPdf -Algorithm SHA256).Hash
  Assert-True ($importedHash -eq $fixtureHash) 'Imported PDF bytes changed.'

  Stop-InstalledDesktop $desktopProcess
  $desktopProcess = $null

  Write-Host '[installed-reader] Repair and restart'
  Invoke-Setup '--silent-repair'
  Assert-True ((Get-FileHash -LiteralPath $importedPdf -Algorithm SHA256).Hash -eq $importedHash) 'Repair changed Reader data.'
  $desktopProcess = Start-InstalledDesktop
  $repairedHealth = Wait-ReaderHealth $desktopProcess 'post-repair'
  $pdfResponse = Invoke-WebRequest `
    -Uri "http://127.0.0.1:$readerPort/api/local-pdf?id=$($fixtureHash.ToLowerInvariant())" `
    -UseBasicParsing `
    -TimeoutSec 5
  Assert-True ($pdfResponse.StatusCode -eq 200) 'Repaired Reader did not serve the imported PDF.'

  Stop-InstalledDesktop $desktopProcess
  $desktopProcess = $null

  Write-Host '[installed-reader] Uninstall while preserving Reader data'
  Invoke-Setup '--silent-uninstall'
  Assert-True (-not (Test-Path -LiteralPath $installedExecutable)) 'Uninstall left the executable behind.'
  Assert-True ((Get-FileHash -LiteralPath $importedPdf -Algorithm SHA256).Hash -eq $importedHash) 'Uninstall changed Reader data.'

  $result = [ordered]@{
    product = 'English Grammar Automaticity'
    version = $Version
    runRoot = $runRoot
    install = 'VERIFIED'
    exactReaderHealth = 'VERIFIED'
    realPdfLifecycle = 'VERIFIED'
    tabletResponsive = 'VERIFIED at 800x1280'
    repairRestart = 'VERIFIED'
    uninstallPreservedReaderData = 'VERIFIED'
    readerPort = $readerPort
    pdfSha256 = $fixtureHash
    setupSha256 = (Get-FileHash -LiteralPath $Setup -Algorithm SHA256).Hash
    payloadSha256 = (Get-FileHash -LiteralPath $payload -Algorithm SHA256).Hash
    freshHealth = $freshHealth
    repairedHealth = $repairedHealth
  }
  $result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $resultPath -Encoding utf8
  $result | ConvertTo-Json -Depth 6
} finally {
  if ($desktopProcess) {
    Stop-InstalledDesktop $desktopProcess
  }
  foreach ($name in $environmentNames) {
    [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
  }
}
