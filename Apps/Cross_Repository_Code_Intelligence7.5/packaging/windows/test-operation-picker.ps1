[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Setup,

  [Parameter(Mandatory = $true)]
  [string]$EnvironmentPrefix,

  [ValidateSet('de', 'en')]
  [string]$Locale = 'de',

  [Parameter(Mandatory = $true)]
  [string]$ScreenshotBase,

  [string]$TestParent = 'C:\t'
)

$ErrorActionPreference = 'Stop'
$setupPath = [IO.Path]::GetFullPath($Setup)
$testParentPath = [IO.Path]::GetFullPath($TestParent).TrimEnd('\')
$testRoot = Join-Path $testParentPath (
  'setup-picker-' + [Guid]::NewGuid().ToString('N'))
$programRoot = Join-Path $testRoot 'program'
$dataRoot = Join-Path $testRoot 'data'
$screenshotPrefix = [IO.Path]::GetFullPath($ScreenshotBase)
$notInstalledScreenshot = $screenshotPrefix + '-not-installed.png'
$installedScreenshot = $screenshotPrefix + '-installed.png'
$setupProcess = $null

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class SetupPickerNative
{
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr window, out RECT rectangle);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr window, IntPtr device, uint flags);

    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
'@

function Set-TestEnvironment {
  param([bool]$Enabled)

  $valueMap = if ($Enabled) {
    @{
      ($EnvironmentPrefix + '_INSTALL_ROOT') = $programRoot
      ($EnvironmentPrefix + '_DATA_ROOT') = $dataRoot
      ($EnvironmentPrefix + '_NO_SHORTCUTS') = '1'
      ($EnvironmentPrefix + '_NO_LAUNCH') = '1'
      ($EnvironmentPrefix + '_NO_BROWSER') = '1'
    }
  } else {
    @{
      ($EnvironmentPrefix + '_INSTALL_ROOT') = $null
      ($EnvironmentPrefix + '_DATA_ROOT') = $null
      ($EnvironmentPrefix + '_NO_SHORTCUTS') = $null
      ($EnvironmentPrefix + '_NO_LAUNCH') = $null
      ($EnvironmentPrefix + '_NO_BROWSER') = $null
    }
  }

  foreach ($entry in $valueMap.GetEnumerator()) {
    [Environment]::SetEnvironmentVariable(
      $entry.Key,
      $entry.Value,
      [EnvironmentVariableTarget]::Process)
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
    throw "Setup failed with exit code $($process.ExitCode): $Parameters"
  }
}

function Open-OperationPicker {
  $script:setupProcess = Start-Process -FilePath $setupPath -PassThru
  $processCondition =
    New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ProcessIdProperty,
      $script:setupProcess.Id)
  $windowCondition =
    New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
      [System.Windows.Automation.ControlType]::Window)
  $condition =
    New-Object System.Windows.Automation.AndCondition(
      $processCondition,
      $windowCondition)

  for ($attempt = 0; $attempt -lt 80; $attempt++) {
    Start-Sleep -Milliseconds 250
    $windows =
      [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
        [System.Windows.Automation.TreeScope]::Children,
        $condition)
    for ($index = 0; $index -lt $windows.Count; $index++) {
      $candidate = $windows.Item($index)
      $buttonCondition =
        New-Object System.Windows.Automation.PropertyCondition(
          [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
          [System.Windows.Automation.ControlType]::Button)
      $buttons = $candidate.FindAll(
        [System.Windows.Automation.TreeScope]::Descendants,
        $buttonCondition)
      $installChoice = $null
      for ($buttonIndex = 0; $buttonIndex -lt $buttons.Count; $buttonIndex++) {
        if (
          $buttons.Item($buttonIndex).Current.Name -match
            '^(Erstinstallation|First-time installation)$'
        ) {
          $installChoice = $buttons.Item($buttonIndex)
          break
        }
      }
      if ($installChoice) {
        $walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
        $current = $installChoice
        while ($current) {
          if (
            $current.Current.ControlType -eq
              [System.Windows.Automation.ControlType]::Window -and
            $current.Current.NativeWindowHandle -ne 0
          ) {
            return $current
          }
          $current = $walker.GetParent($current)
        }
      }
    }
  }
  throw 'The operation picker did not appear.'
}

function Get-Choice {
  param(
    [Parameter(Mandatory = $true)]
    [System.Windows.Automation.AutomationElement]$Picker,

    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $nameCondition =
    New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::NameProperty,
      $Name)
  return $Picker.FindFirst(
    [System.Windows.Automation.TreeScope]::Descendants,
    $nameCondition)
}

function Save-WindowScreenshot {
  param(
    [Parameter(Mandatory = $true)]
    [System.Windows.Automation.AutomationElement]$Window,

    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $handle = [IntPtr]$Window.Current.NativeWindowHandle
  $rectangle = New-Object SetupPickerNative+RECT
  [SetupPickerNative]::GetWindowRect($handle, [ref]$rectangle) | Out-Null
  $width = $rectangle.Right - $rectangle.Left
  $height = $rectangle.Bottom - $rectangle.Top
  if ($width -le 0 -or $height -le 0) {
    throw 'The operation picker has invalid window dimensions.'
  }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Path) |
    Out-Null
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $device = $graphics.GetHdc()
  try {
    [SetupPickerNative]::PrintWindow($handle, $device, 2) | Out-Null
  } finally {
    $graphics.ReleaseHdc($device)
    $graphics.Dispose()
  }
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Close-OperationPicker {
  param(
    [Parameter(Mandatory = $true)]
    [System.Windows.Automation.AutomationElement]$Picker
  )

  try {
    $windowPattern = $Picker.GetCurrentPattern(
      [System.Windows.Automation.WindowPattern]::Pattern)
    $windowPattern.Close()
  } catch {
    if ($script:setupProcess -and -not $script:setupProcess.HasExited) {
      Stop-Process -Id $script:setupProcess.Id -Force
    }
  }
  if ($script:setupProcess) {
    $script:setupProcess.WaitForExit(5000) | Out-Null
    if (-not $script:setupProcess.HasExited) {
      Stop-Process -Id $script:setupProcess.Id -Force
    }
  }
}

function Test-SelectedAction {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ChoiceName,

    [Parameter(Mandatory = $true)]
    [string]$ExpectedActionName
  )

  $picker = Open-OperationPicker
  $choice = Get-Choice -Picker $picker -Name $ChoiceName
  if (-not $choice -or -not $choice.Current.IsEnabled) {
    throw "The setup choice is not available: $ChoiceName"
  }
  $invoke = $choice.GetCurrentPattern(
    [System.Windows.Automation.InvokePattern]::Pattern)
  $invoke.Invoke()

  $processCondition =
    New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ProcessIdProperty,
      $script:setupProcess.Id)
  $nameCondition =
    New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::NameProperty,
      $ExpectedActionName)
  $action = $null
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 250
    $windows =
      [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
        [System.Windows.Automation.TreeScope]::Children,
        $processCondition)
    for ($index = 0; $index -lt $windows.Count; $index++) {
      $action = $windows.Item($index).FindFirst(
        [System.Windows.Automation.TreeScope]::Descendants,
        $nameCondition)
      if ($action) {
        break
      }
    }
    if ($action) {
      break
    }
  }
  if (-not $action -or -not $action.Current.IsEnabled) {
    throw "Selecting '$ChoiceName' did not route to '$ExpectedActionName'."
  }

  if (-not $script:setupProcess.HasExited) {
    Stop-Process -Id $script:setupProcess.Id -Force
    $script:setupProcess.WaitForExit(5000) | Out-Null
  }
}

$installName = if ($Locale -eq 'de') {
  'Erstinstallation'
} else {
  'First-time installation'
}
$updateName = if ($Locale -eq 'de') { 'Aktualisieren' } else { 'Update' }
$repairName = if ($Locale -eq 'de') { 'Reparieren' } else { 'Repair' }
$uninstallName = if ($Locale -eq 'de') {
  'Deinstallieren'
} else {
  'Uninstall'
}
$installActionName = if ($Locale -eq 'de') {
  'Jetzt installieren'
} else {
  'Install now'
}
$updateActionName = if ($Locale -eq 'de') {
  'Update ausführen'
} else {
  'Run update'
}
$repairActionName = if ($Locale -eq 'de') {
  'Reparatur ausführen'
} else {
  'Run repair'
}
$uninstallActionName = if ($Locale -eq 'de') {
  'Deinstallation prüfen'
} else {
  'Review uninstall'
}

Set-TestEnvironment -Enabled $true
try {
  $picker = Open-OperationPicker
  $install = Get-Choice -Picker $picker -Name $installName
  $update = Get-Choice -Picker $picker -Name $updateName
  $repair = Get-Choice -Picker $picker -Name $repairName
  $uninstall = Get-Choice -Picker $picker -Name $uninstallName
  if (-not ($install -and $update -and $repair -and $uninstall)) {
    throw 'The operation picker does not expose all four setup actions.'
  }
  if (
    -not $install.Current.IsEnabled -or
    $update.Current.IsEnabled -or
    $repair.Current.IsEnabled -or
    $uninstall.Current.IsEnabled
  ) {
    throw 'The first-time operation availability is incorrect.'
  }
  Save-WindowScreenshot -Window $picker -Path $notInstalledScreenshot
  Close-OperationPicker -Picker $picker
  Test-SelectedAction `
    -ChoiceName $installName `
    -ExpectedActionName $installActionName

  Invoke-Setup -Parameters @('--silent-install')

  $picker = Open-OperationPicker
  $install = Get-Choice -Picker $picker -Name $installName
  $update = Get-Choice -Picker $picker -Name $updateName
  $repair = Get-Choice -Picker $picker -Name $repairName
  $uninstall = Get-Choice -Picker $picker -Name $uninstallName
  if (
    $install.Current.IsEnabled -or
    -not $update.Current.IsEnabled -or
    -not $repair.Current.IsEnabled -or
    -not $uninstall.Current.IsEnabled
  ) {
    throw 'The installed operation availability is incorrect.'
  }
  Save-WindowScreenshot -Window $picker -Path $installedScreenshot
  Close-OperationPicker -Picker $picker
  Test-SelectedAction `
    -ChoiceName $updateName `
    -ExpectedActionName $updateActionName
  Test-SelectedAction `
    -ChoiceName $repairName `
    -ExpectedActionName $repairActionName
  Test-SelectedAction `
    -ChoiceName $uninstallName `
    -ExpectedActionName $uninstallActionName

  Invoke-Setup -Parameters @('--silent-uninstall', '--delete-data')

  [pscustomobject]@{
    Setup = [IO.Path]::GetFileName($setupPath)
    FirstInstallChoice = 'PASS'
    UpdateChoice = 'PASS'
    RepairChoice = 'PASS'
    UninstallChoice = 'PASS'
    OperationRouting = 'PASS'
    NotInstalledScreenshot = $notInstalledScreenshot
    InstalledScreenshot = $installedScreenshot
  }
} finally {
  if ($setupProcess -and -not $setupProcess.HasExited) {
    Stop-Process -Id $setupProcess.Id -Force -ErrorAction SilentlyContinue
  }
  if (Test-Path -LiteralPath $programRoot) {
    try {
      Invoke-Setup -Parameters @('--silent-uninstall', '--delete-data')
    } catch {
      Write-Warning $_
    }
  }
  Set-TestEnvironment -Enabled $false

  $resolvedTestRoot = [IO.Path]::GetFullPath($testRoot)
  if (
    [IO.Path]::GetDirectoryName($resolvedTestRoot).TrimEnd('\') -eq
      $testParentPath -and
    [IO.Path]::GetFileName($resolvedTestRoot) -match
      '^setup-picker-[0-9a-f]{32}$' -and
    [IO.Directory]::Exists($resolvedTestRoot)
  ) {
    [IO.Directory]::Delete($resolvedTestRoot, $true)
  }
}
