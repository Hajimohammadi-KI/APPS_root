[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Setup,
  [Parameter(Mandatory = $true)][string]$Executable,
  [Parameter(Mandatory = $true)][string]$EnvironmentPrefix,
  [Parameter(Mandatory = $true)][string]$Pdf,
  [Parameter(Mandatory = $true)][string]$ProductName,
  [Parameter(Mandatory = $true)][string]$TestParent
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$testRoot = Join-Path $TestParent ('pdf-' + [Guid]::NewGuid().ToString('N'))
$installRoot = Join-Path $testRoot 'program'
$dataRoot = Join-Path $testRoot 'data'

function Invoke-Setup {
  param([Parameter(Mandatory = $true)][string[]]$Parameters)

  $process = Start-Process `
    -FilePath $Setup `
    -ArgumentList $Parameters `
    -PassThru `
    -Wait
  if ($process.ExitCode -ne 0) {
    throw "Setup failed with exit code $($process.ExitCode): $Parameters"
  }
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

$previousAppData = $env:APPDATA
$previousRunAsNode = $env:ELECTRON_RUN_AS_NODE
$previousPdfPath = $env:DESKTOP_PDF_AUTOMATION_PATH
$app = $null
$edgeWindow = $null

try {
  Invoke-Setup -Parameters @('--silent-install')
  $installedExecutable = Join-Path $installRoot $Executable
  if (-not (Test-Path -LiteralPath $installedExecutable -PathType Leaf)) {
    throw "Installed executable is missing: $installedExecutable"
  }

  $beforeEdgeWindows = @(
    Get-Process msedge -ErrorAction SilentlyContinue |
      Where-Object { $_.MainWindowHandle -ne 0 } |
      Select-Object -ExpandProperty MainWindowHandle
  )

  $env:APPDATA = $dataRoot
  $env:ELECTRON_RUN_AS_NODE = $null
  $env:DESKTOP_PDF_AUTOMATION_PATH = $Pdf
  $app = Start-Process -FilePath $installedExecutable -PassThru
  for ($attempt = 0; $attempt -lt 80; $attempt++) {
    Start-Sleep -Milliseconds 250
    $app.Refresh()
    if ($app.HasExited) {
      break
    }
    if ($app.MainWindowHandle -ne 0) {
      break
    }
  }
  if ($app.HasExited -or $app.MainWindowHandle -eq 0) {
    throw "$ProductName did not open."
  }

  Start-Sleep -Seconds 2
  $window = [System.Windows.Automation.AutomationElement]::FromHandle(
    $app.MainWindowHandle)
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
    throw "$ProductName does not expose the PDF control."
  }

  $invoke = $pdfButton.GetCurrentPattern(
    [System.Windows.Automation.InvokePattern]::Pattern)
  $invoke.Invoke()

  for ($attempt = 0; $attempt -lt 100; $attempt++) {
    Start-Sleep -Milliseconds 250
    $edgeWindow = Get-Process msedge -ErrorAction SilentlyContinue |
      Where-Object {
        $_.MainWindowHandle -ne 0 -and
        $beforeEdgeWindows -notcontains $_.MainWindowHandle
      } |
      Select-Object -First 1
    if ($edgeWindow) {
      break
    }
  }
  if (-not $edgeWindow) {
    throw "$ProductName did not open the selected PDF in Microsoft Edge."
  }

  [pscustomobject]@{
    Product = $ProductName
    InstalledPayload = 'PASS'
    PdfControl = 'PASS'
    PathValidation = 'PASS'
    MicrosoftEdge = 'PASS'
    File = [IO.Path]::GetFileName($Pdf)
  }
} finally {
  if ($edgeWindow) {
    $edgeWindow.CloseMainWindow() | Out-Null
  }
  if ($app -and -not $app.HasExited) {
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
  }
  $env:APPDATA = $previousAppData
  $env:ELECTRON_RUN_AS_NODE = $previousRunAsNode
  $env:DESKTOP_PDF_AUTOMATION_PATH = $previousPdfPath
  try {
    Invoke-Setup -Parameters @('--silent-uninstall', '--delete-data')
  } catch {
    Write-Warning $_
  }
}
