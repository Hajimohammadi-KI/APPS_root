param(
  [ValidateSet("Menu", "Install", "Update", "Repair", "Uninstall")][string]$Action = "Menu",
  [switch]$NoDialogs,
  [switch]$AssumeYes,
  [string]$ScriptRoot = "",
  [string]$InstallRootOverride = "",
  [string]$DataRootOverride = "",
  [switch]$SkipShortcuts
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms

$AppName = "Research PDF Studio"
$EffectiveScriptRoot = if ([string]::IsNullOrWhiteSpace($ScriptRoot)) { $PSScriptRoot } else { $ScriptRoot }
$SourceRoot = [IO.Path]::GetFullPath((Join-Path $EffectiveScriptRoot ".."))
$InstallRoot = if ([string]::IsNullOrWhiteSpace($InstallRootOverride)) { Join-Path $env:LOCALAPPDATA "ResearchPDFStudio" } else { [IO.Path]::GetFullPath($InstallRootOverride) }
$DataRoot = if ([string]::IsNullOrWhiteSpace($DataRootOverride)) { Join-Path ([Environment]::GetFolderPath("ApplicationData")) "Research PDF Studio" } else { [IO.Path]::GetFullPath($DataRootOverride) }
$RegistryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\ResearchPDFStudio"
$Programs = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\Research PDF Studio"
$DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Research PDF Studio.lnk"

function Show-Info([string]$Message) {
  if ($NoDialogs) { Write-Host $Message; return }
  [void][Windows.Forms.MessageBox]::Show($Message, $AppName, [Windows.Forms.MessageBoxButtons]::OK, [Windows.Forms.MessageBoxIcon]::Information)
}
function Confirm([string]$Message) {
  if ($AssumeYes) { return $true }
  if ($NoDialogs) { return $false }
  return [Windows.Forms.MessageBox]::Show($Message, $AppName, [Windows.Forms.MessageBoxButtons]::YesNo, [Windows.Forms.MessageBoxIcon]::Question) -eq [Windows.Forms.DialogResult]::Yes
}
function Get-Version([string]$Root) {
  $marker = Join-Path $Root "version.txt"
  if (Test-Path -LiteralPath $marker -PathType Leaf) { return (Get-Content -LiteralPath $marker -Raw -Encoding UTF8).Trim() }
  $packagePath = Join-Path $Root "package.json"
  if (Test-Path -LiteralPath $packagePath -PathType Leaf) { return [string](Get-Content -LiteralPath $packagePath -Raw -Encoding UTF8 | ConvertFrom-Json).version }
  return $null
}
function Convert-Version([string]$Value) { return [Version]([Regex]::Match($Value, '^\d+\.\d+\.\d+').Value) }
function Test-Installed { return (Test-Path -LiteralPath (Join-Path $InstallRoot "runtime\bun.exe") -PathType Leaf) -and (Test-Path -LiteralPath (Join-Path $InstallRoot "dist\server\index.js") -PathType Leaf) }
function Stop-App {
  $root = [IO.Path]::GetFullPath($InstallRoot).TrimEnd('\') + '\'
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ExecutablePath -and ([IO.Path]::GetFullPath($_.ExecutablePath)).StartsWith($root, [StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 500
}
function New-Shortcut([string]$Path, [string]$Target, [string]$Arguments, [string]$Description) {
  New-Item -ItemType Directory -Path (Split-Path -Parent $Path) -Force | Out-Null
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($Path)
  $shortcut.TargetPath = $Target; $shortcut.Arguments = $Arguments; $shortcut.WorkingDirectory = $InstallRoot; $shortcut.Description = $Description
  $shortcut.Save()
}
function Register-App {
  if ($SkipShortcuts) { return }
  New-Item -ItemType Directory -Path $Programs -Force | Out-Null
  New-Shortcut (Join-Path $Programs "Research PDF Studio.lnk") (Join-Path $InstallRoot "START-WINDOWS.bat") "" "Open Research PDF Studio"
  New-Shortcut (Join-Path $Programs "Check for updates.lnk") (Join-Path $InstallRoot "UPDATE-CHECK-WINDOWS.bat") "" "Check for updates and ask before installing"
  New-Shortcut (Join-Path $Programs "Manage or uninstall.lnk") (Join-Path $InstallRoot "SETUP-WINDOWS.bat") "" "Update, repair, or uninstall"
  New-Shortcut $DesktopShortcut (Join-Path $InstallRoot "START-WINDOWS.bat") "" "Open Research PDF Studio"
  New-Item -Path $RegistryPath -Force | Out-Null
  Set-ItemProperty -Path $RegistryPath -Name DisplayName -Value $AppName
  Set-ItemProperty -Path $RegistryPath -Name DisplayVersion -Value (Get-Version $InstallRoot)
  Set-ItemProperty -Path $RegistryPath -Name Publisher -Value "Hajimohammadi-KI"
  Set-ItemProperty -Path $RegistryPath -Name InstallLocation -Value $InstallRoot
  Set-ItemProperty -Path $RegistryPath -Name UninstallString -Value ('"{0}" Uninstall' -f (Join-Path $InstallRoot "SETUP-WINDOWS.bat"))
  Set-ItemProperty -Path $RegistryPath -Name QuietUninstallString -Value ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "{0}" -Action Uninstall -NoDialogs -AssumeYes -ScriptRoot "{1}"' -f (Join-Path $InstallRoot "scripts\setup-windows.ps1"), (Join-Path $InstallRoot "scripts"))
  Set-ItemProperty -Path $RegistryPath -Name ModifyPath -Value ('"{0}"' -f (Join-Path $InstallRoot "SETUP-WINDOWS.bat"))
  Set-ItemProperty -Path $RegistryPath -Name NoModify -Value 0 -Type DWord
  Set-ItemProperty -Path $RegistryPath -Name NoRepair -Value 0 -Type DWord
}
function Remove-Registration {
  if ($SkipShortcuts) { return }
  if (Test-Path -LiteralPath $Programs) { Remove-Item -LiteralPath $Programs -Recurse -Force }
  if (Test-Path -LiteralPath $DesktopShortcut) { Remove-Item -LiteralPath $DesktopShortcut -Force }
  if (Test-Path -LiteralPath $RegistryPath) { Remove-Item -LiteralPath $RegistryPath -Recurse -Force }
}
function Assert-Package {
  foreach ($required in @("runtime\bun.exe", "dist\server\index.js", "dist\client", "scripts\start-local.mjs", "resources\update\check-for-updates.ps1", "version.txt")) {
    if (-not (Test-Path -LiteralPath (Join-Path $SourceRoot $required))) { throw "Release package is incomplete: $required" }
  }
}
function Install-App([string]$Mode) {
  Assert-Package
  $sourceVersion = Get-Version $SourceRoot
  $installedVersion = Get-Version $InstallRoot
  if ($Mode -eq "Install" -and (Test-Installed)) { throw "Research PDF Studio is already installed." }
  if ($Mode -eq "Update" -and (-not (Test-Installed) -or (Convert-Version $sourceVersion) -le (Convert-Version $installedVersion))) { throw "No newer package version is available." }
  if ($Mode -eq "Repair" -and -not (Test-Path -LiteralPath $InstallRoot)) { throw "Install the app before running Repair." }
  if (-not (Confirm("$Mode Research PDF Studio?`n`nInstalled: $installedVersion`nPackage: $sourceVersion`n`nPersonal PDF files and reader data remain in a separate folder."))) { return }
  Stop-App
  $parent = Split-Path -Parent $InstallRoot
  $staging = Join-Path $parent (".ResearchPDFStudio-installing-" + [Guid]::NewGuid().ToString("N"))
  $backup = Join-Path $parent (".ResearchPDFStudio-previous-" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $staging -Force | Out-Null
  & robocopy.exe $SourceRoot $staging /E /COPY:DAT /DCOPY:DAT /R:2 /W:1 /NFL /NDL /NJH /NJS /NP /XD ".git" "node_modules" ".wrangler" "artifacts" | Out-Null
  if ($LASTEXITCODE -gt 7) { throw "Program files could not be copied (Robocopy $LASTEXITCODE)." }
  if (Test-Path -LiteralPath $InstallRoot) { Move-Item -LiteralPath $InstallRoot -Destination $backup }
  try { Move-Item -LiteralPath $staging -Destination $InstallRoot } catch { if (Test-Path -LiteralPath $backup) { Move-Item -LiteralPath $backup -Destination $InstallRoot }; throw }
  if (Test-Path -LiteralPath $backup) { Remove-Item -LiteralPath $backup -Recurse -Force }
  New-Item -ItemType Directory -Path $DataRoot -Force | Out-Null
  Register-App
  Show-Info "$Mode complete. Version $sourceVersion is ready."
}
function Uninstall-App {
  if (-not (Test-Path -LiteralPath $InstallRoot)) { Show-Info "Research PDF Studio is not installed."; return }
  if (-not (Confirm("Uninstall Research PDF Studio?`n`nYour PDFs and reader data will be preserved by default."))) { return }
  Stop-App; Remove-Registration
  $parent = Split-Path -Parent $InstallRoot
  $tombstone = Join-Path $parent (".ResearchPDFStudio-delete-" + [Guid]::NewGuid().ToString("N"))
  Move-Item -LiteralPath $InstallRoot -Destination $tombstone
  Remove-Item -LiteralPath $tombstone -Recurse -Force
  Show-Info "Research PDF Studio was removed. Your data was preserved in $DataRoot"
}
function Show-Menu {
  if (-not (Test-Installed)) { if (Confirm("Install Research PDF Studio for your Windows user account?")) { Install-App "Install" }; return }
  $source = Get-Version $SourceRoot; $installed = Get-Version $InstallRoot
  $primary = if ((Convert-Version $source) -gt (Convert-Version $installed)) { "Update" } else { "Repair" }
  $answer = [Windows.Forms.MessageBox]::Show("Installed: $installed`nPackage: $source`n`nYes: $primary`nNo: Uninstall`nCancel: do nothing", $AppName, [Windows.Forms.MessageBoxButtons]::YesNoCancel, [Windows.Forms.MessageBoxIcon]::Question)
  if ($answer -eq [Windows.Forms.DialogResult]::Yes) { Install-App $primary }
  elseif ($answer -eq [Windows.Forms.DialogResult]::No) { Uninstall-App }
}

try {
  switch ($Action) { "Install" { Install-App "Install" }; "Update" { Install-App "Update" }; "Repair" { Install-App "Repair" }; "Uninstall" { Uninstall-App }; default { Show-Menu } }
} catch {
  if ($NoDialogs) { Write-Error $_ } else { [void][Windows.Forms.MessageBox]::Show($_.Exception.Message, "$AppName - Error", [Windows.Forms.MessageBoxButtons]::OK, [Windows.Forms.MessageBoxIcon]::Error) }
  exit 1
}
