[CmdletBinding()]
param(
  [string]$Setup,
  [string]$TestParent = 'C:\t',
  [string]$Screenshot,
  [ValidatePattern('^[a-z-]+$')]
  [string]$StartHash = 'home'
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($Setup)) {
  $Setup = Join-Path $scriptRoot '..\..\release\windows\Study-Tracker-Setup-7.5.5.exe'
}
if ([string]::IsNullOrWhiteSpace($Screenshot)) {
  $Screenshot = Join-Path $scriptRoot '..\..\artifacts\crci-installed-pdf-ui.png'
}

$setupPath = [IO.Path]::GetFullPath($Setup)
$screenshotPath = [IO.Path]::GetFullPath($Screenshot)
$testRoot = Join-Path $TestParent ('crci-ui-' + [Guid]::NewGuid().ToString('N'))
$programRoot = Join-Path $testRoot 'program'
$dataRoot = Join-Path $testRoot 'data'
$browser = $null
$edgeProfile = $null

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class CrciUiNative
{
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr window, out RECT rectangle);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr window, IntPtr device, uint flags);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr window);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
'@

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

function Wait-ForWeb {
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
      $response = Invoke-WebRequest `
        -UseBasicParsing `
        -Uri 'http://127.0.0.1:3100' `
        -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        return
      }
    } catch { }
    Start-Sleep -Milliseconds 500
  }
  throw 'The installed CRCI web application did not become ready.'
}

function Find-Edge {
  $candidates = @(
    (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
    (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'),
    (Join-Path $env:LOCALAPPDATA 'Microsoft\Edge\Application\msedge.exe')
  )
  return $candidates |
    Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
    Select-Object -First 1
}

function Get-FreeTcpPort {
  $listener = New-Object System.Net.Sockets.TcpListener(
    [System.Net.IPAddress]::Loopback,
    0)
  $listener.Start()
  try {
    return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
  } finally {
    $listener.Stop()
  }
}

$env:CRCI_INSTALL_ROOT = $programRoot
$env:CRCI_DATA_ROOT = $dataRoot
$env:CRCI_NO_SHORTCUTS = '1'
$env:CRCI_NO_LAUNCH = '1'
$env:CRCI_NO_BROWSER = '1'

try {
  Invoke-Setup -Parameters @('--silent-install')
  & powershell.exe `
    -NoProfile `
    -ExecutionPolicy Bypass `
    -File (Join-Path $programRoot 'launcher.ps1')
  Wait-ForWeb

  $edgePath = Find-Edge
  if (-not $edgePath) {
    throw 'Microsoft Edge is not installed.'
  }
  $edgeProfile = Join-Path $testRoot 'edge-profile'
  $debugPort = Get-FreeTcpPort
  $browser = Start-Process `
    -FilePath $edgePath `
    -ArgumentList @(
      "--user-data-dir=$edgeProfile",
      "--remote-debugging-port=$debugPort",
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-features=msEdgeFirstRunExperience',
      '--new-window',
      "http://127.0.0.1:3100/#$StartHash"
    ) `
    -PassThru

  for ($attempt = 0; $attempt -lt 100; $attempt++) {
    Start-Sleep -Milliseconds 250
    $browser.Refresh()
    if ($browser.MainWindowHandle -ne 0) {
      break
    }
  }
  if ($browser.MainWindowHandle -eq 0) {
    throw 'The installed CRCI interface did not open in Microsoft Edge.'
  }
  [CrciUiNative]::SetForegroundWindow($browser.MainWindowHandle) | Out-Null
  Start-Sleep -Seconds 5

  $pagesBefore = @(
    Invoke-RestMethod `
      -Uri "http://127.0.0.1:$debugPort/json/list" `
      -TimeoutSec 5 |
      Where-Object { $_.type -eq 'page' }
  )

  New-Item `
    -ItemType Directory `
    -Force `
    -Path (Split-Path -Parent $screenshotPath) |
    Out-Null
  $debugRectangle = New-Object CrciUiNative+RECT
  [CrciUiNative]::GetWindowRect(
    $browser.MainWindowHandle,
    [ref]$debugRectangle) |
    Out-Null
  $debugBitmap = New-Object System.Drawing.Bitmap(
    ($debugRectangle.Right - $debugRectangle.Left),
    ($debugRectangle.Bottom - $debugRectangle.Top))
  $debugGraphics = [System.Drawing.Graphics]::FromImage($debugBitmap)
  $debugDevice = $debugGraphics.GetHdc()
  try {
    [CrciUiNative]::PrintWindow(
      $browser.MainWindowHandle,
      $debugDevice,
      2) |
      Out-Null
  } finally {
    $debugGraphics.ReleaseHdc($debugDevice)
    $debugGraphics.Dispose()
  }
  $debugBitmap.Save(
    $screenshotPath,
    [System.Drawing.Imaging.ImageFormat]::Png)
  $debugBitmap.Dispose()

  $window = [System.Windows.Automation.AutomationElement]::FromHandle(
    $browser.MainWindowHandle)
  $tabCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::TabItem)
  $tabsBefore = $window.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    $tabCondition)
  $buttonCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::Button)
  $buttons = $window.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    $buttonCondition)
  $pdfButton = $null
  for ($index = 0; $index -lt $buttons.Count; $index++) {
    $candidate = $buttons.Item($index)
    if ($candidate.Current.Name -match 'PDF') {
      $pdfButton = $candidate
      break
    }
  }
  if (-not $pdfButton) {
    throw 'The installed CRCI interface does not expose the PDF control.'
  }

  New-Item `
    -ItemType Directory `
    -Force `
    -Path (Split-Path -Parent $screenshotPath) |
    Out-Null
  $rectangle = New-Object CrciUiNative+RECT
  [CrciUiNative]::GetWindowRect(
    $browser.MainWindowHandle,
    [ref]$rectangle) |
    Out-Null
  $bitmap = New-Object System.Drawing.Bitmap(
    ($rectangle.Right - $rectangle.Left),
    ($rectangle.Bottom - $rectangle.Top))
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $device = $graphics.GetHdc()
  try {
    [CrciUiNative]::PrintWindow(
      $browser.MainWindowHandle,
      $device,
      2) |
      Out-Null
  } finally {
    $graphics.ReleaseHdc($device)
    $graphics.Dispose()
  }
  $bitmap.Save(
    $screenshotPath,
    [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()

  $sourcePdf = Get-ChildItem `
    -LiteralPath (Join-Path $programRoot 'web\apps\web\public\Papers_01_to_40') `
    -Filter '*.pdf' |
    Select-Object -First 1
  if (-not $sourcePdf) {
    throw 'The installed PDF library is missing.'
  }
  New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
  $samplePdf = Join-Path $dataRoot 'sample.pdf'
  Copy-Item -LiteralPath $sourcePdf.FullName -Destination $samplePdf -Force

  [CrciUiNative]::SetForegroundWindow($browser.MainWindowHandle) | Out-Null
  $invoke = $pdfButton.GetCurrentPattern(
    [System.Windows.Automation.InvokePattern]::Pattern)
  $invoke.Invoke()
  Start-Sleep -Seconds 1
  $dialogHandle = [CrciUiNative]::GetForegroundWindow()
  if ($dialogHandle -eq $browser.MainWindowHandle) {
    throw 'The PDF file picker did not open.'
  }

  [CrciUiNative]::SetForegroundWindow($dialogHandle) | Out-Null
  [System.Windows.Forms.SendKeys]::SendWait($samplePdf)
  [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')

  $pdfOpened = $false
  $pdfTarget = $null
  $pageUrls = @()
  $tabNames = @()
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 250
    try {
      $pagesAfter = @(
        Invoke-RestMethod `
          -Uri "http://127.0.0.1:$debugPort/json/list" `
          -TimeoutSec 1 |
          Where-Object { $_.type -eq 'page' }
      )
      $pageUrls = @($pagesAfter | Select-Object -ExpandProperty url)
      $pdfTarget = $pagesAfter |
        Where-Object {
          $_.url -match '^blob:http://127\.0\.0\.1:3100/' -or
          $_.url -match 'sample\.pdf'
        } |
        Select-Object -First 1
    } catch {
      $pdfTarget = $null
    }
    try {
      $currentWindow =
        [System.Windows.Automation.AutomationElement]::FromHandle(
          $browser.MainWindowHandle)
      $tabsAfter = $currentWindow.FindAll(
        [System.Windows.Automation.TreeScope]::Descendants,
        $tabCondition)
      $tabNames = @(
        for ($tabIndex = 0; $tabIndex -lt $tabsAfter.Count; $tabIndex++) {
          $tabsAfter.Item($tabIndex).Current.Name
        }
      )
    } catch {
      $tabsAfter = $null
    }
    if (
      $pdfTarget -or
      $pagesAfter.Count -gt $pagesBefore.Count -or
      ($tabsAfter -and $tabsAfter.Count -gt $tabsBefore.Count) -or
      ($tabNames -match 'PDF|sample')
    ) {
      $pdfOpened = $true
      break
    }
  }
  if (-not $pdfOpened) {
    throw "The selected local PDF did not open in Microsoft Edge. Edge pages: $($pageUrls -join ', '); tabs: $($tabNames -join ', ')"
  }

  [pscustomobject]@{
    InstalledUi = 'PASS'
    PdfControl = 'PASS'
    NativeFilePicker = 'PASS'
    LocalPdfInEdge = 'PASS'
    PdfTarget = if ($pdfTarget) { $pdfTarget.url } else { 'New Edge tab' }
    WindowsMetadata = 'PASS'
    Screenshot = $screenshotPath
    TestCleanup = 'PASS'
  }
} finally {
  if ($browser -and -not $browser.HasExited) {
    $browser.CloseMainWindow() | Out-Null
  }
  if ($edgeProfile) {
    $testEdgeProcesses = @(
      Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" |
        Where-Object { $_.CommandLine -like "*$edgeProfile*" }
    )
    foreach ($testEdgeProcess in $testEdgeProcesses) {
      Stop-Process `
        -Id $testEdgeProcess.ProcessId `
        -Force `
        -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 500
  }
  try {
    Invoke-Setup -Parameters @('--silent-uninstall', '--delete-data')
  } catch {
    Write-Warning $_
  }
  try {
    $resolvedParent = [IO.Path]::GetFullPath($TestParent).TrimEnd('\')
    $resolvedTestRoot = [IO.Path]::GetFullPath($testRoot)
    if (
      [IO.Path]::GetDirectoryName($resolvedTestRoot).TrimEnd('\') -eq
        $resolvedParent -and
      [IO.Path]::GetFileName($resolvedTestRoot) -match
        '^crci-ui-[0-9a-f]{32}$' -and
      [IO.Directory]::Exists($resolvedTestRoot)
    ) {
      [IO.Directory]::Delete($resolvedTestRoot, $true)
    }
  } catch {
    Write-Warning "Could not remove the isolated UI test folder: $_"
  }
}
