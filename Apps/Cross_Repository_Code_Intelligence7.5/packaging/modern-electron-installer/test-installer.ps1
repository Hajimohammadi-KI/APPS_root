[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Setup,
  [Parameter(Mandatory = $true)][string]$Executable,
  [Parameter(Mandatory = $true)][string]$EnvironmentPrefix,
  [Parameter(Mandatory = $true)][string]$TestParent
)

$ErrorActionPreference = 'Stop'
$testRoot = Join-Path $TestParent ('lifecycle-' + [Guid]::NewGuid().ToString('N'))
$installRoot = Join-Path $testRoot 'program'
$dataRoot = Join-Path $testRoot 'data'

function Invoke-Setup {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  $process = Start-Process `
    -FilePath $Setup `
    -ArgumentList $Arguments `
    -PassThru `
    -Wait
  if ($process.ExitCode -ne 0) {
    throw "Setup failed with exit code $($process.ExitCode): $Arguments"
  }
}

function Stop-TestAppProcesses {
  $root = [IO.Path]::GetFullPath($installRoot).TrimEnd('\') + '\'
  foreach ($process in Get-Process) {
    try {
      $path = [IO.Path]::GetFullPath($process.MainModule.FileName)
      if ($path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
      }
    } catch {
      # Protected, unrelated, and already-exited processes are safe to ignore.
    }
  }
  Start-Sleep -Milliseconds 500
}

[Environment]::SetEnvironmentVariable(
  $EnvironmentPrefix + '_INSTALL_ROOT',
  $installRoot,
  'Process')
[Environment]::SetEnvironmentVariable(
  $EnvironmentPrefix + '_DATA_ROOT',
  $dataRoot,
  'Process')
[Environment]::SetEnvironmentVariable(
  $EnvironmentPrefix + '_NO_SHORTCUTS',
  '1',
  'Process')
[Environment]::SetEnvironmentVariable(
  $EnvironmentPrefix + '_NO_LAUNCH',
  '1',
  'Process')

Invoke-Setup -Arguments @('--silent-install')
$installedExecutable = Join-Path $installRoot $Executable
if (-not (Test-Path -LiteralPath $installedExecutable -PathType Leaf)) {
  throw "Application executable was not installed: $installedExecutable"
}
$installedSetup = Join-Path $installRoot ([IO.Path]::GetFileName($Setup))
if (-not (Test-Path -LiteralPath $installedSetup -PathType Leaf)) {
  throw "Installed setup manager is missing: $installedSetup"
}

$marker = Join-Path $dataRoot 'update-preservation.marker'
[IO.File]::WriteAllText($marker, 'preserve-me')
Invoke-Setup -Arguments @('--silent-install')
if (-not (Test-Path -LiteralPath $marker -PathType Leaf)) {
  throw 'Reinstall/update removed learning data.'
}

$previousAppData = $env:APPDATA
$previousRunAsNode = $env:ELECTRON_RUN_AS_NODE
try {
  $env:APPDATA = $dataRoot
  $env:ELECTRON_RUN_AS_NODE = $null
  $app = Start-Process -FilePath $installedExecutable -PassThru
  $opened = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    Start-Sleep -Milliseconds 250
    $app.Refresh()
    if ($app.HasExited) {
      break
    }
    if ($app.MainWindowHandle -ne 0) {
      $opened = $true
      break
    }
  }
  if (-not $opened) {
    throw 'The installed desktop application did not open a window.'
  }
} finally {
  Stop-TestAppProcesses
  $env:APPDATA = $previousAppData
  $env:ELECTRON_RUN_AS_NODE = $previousRunAsNode
}

Invoke-Setup -Arguments @('--silent-uninstall')
if (Test-Path -LiteralPath $installRoot) {
  throw 'Program files remain after uninstall.'
}
if (-not (Test-Path -LiteralPath $marker -PathType Leaf)) {
  throw 'Default uninstall removed learning data.'
}

Invoke-Setup -Arguments @('--silent-install')
[IO.File]::WriteAllText((Join-Path $dataRoot 'delete.marker'), 'delete-me')
Invoke-Setup -Arguments @('--silent-uninstall', '--delete-data')
if (Test-Path -LiteralPath $installRoot) {
  throw 'Program files remain after delete-data uninstall.'
}
if (Test-Path -LiteralPath $dataRoot) {
  throw 'Learning data remains after delete-data uninstall.'
}

[pscustomobject]@{
  Setup = [IO.Path]::GetFileName($Setup)
  Install = 'PASS'
  ReinstallPreservesData = 'PASS'
  Launch = 'PASS'
  UninstallPreservesData = 'PASS'
  DeleteDataUninstall = 'PASS'
  TestRoot = $testRoot
}
