param(
  [ValidateSet("Menu", "Install", "Update", "Repair", "Uninstall")][string]$Action = "Menu",
  [Parameter(Mandatory = $true)][string]$Configuration,
  [string]$PayloadPath = "",
  [switch]$NoDialogs,
  [switch]$AssumeYes,
  [string]$InstallRootOverride = "",
  [string]$DataRootOverride = "",
  [switch]$SkipShortcuts
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.IO.Compression.FileSystem

$Configuration = [IO.Path]::GetFullPath($Configuration)
$config = Get-Content -LiteralPath $Configuration -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($name in @("productName", "productId", "version", "installFolder", "dataFolder", "mainExecutable", "payloadFile", "shortcutName", "environmentPrefix", "locale")) {
  if ([string]::IsNullOrWhiteSpace([string]$config.$name)) { throw "Release configuration value '$name' is required." }
}
$IsGerman = [string]$config.locale -eq "de"
$AppName = [string]$config.productName
$InstallRoot = if ([string]::IsNullOrWhiteSpace($InstallRootOverride)) {
  $configured = [Environment]::GetEnvironmentVariable(([string]$config.environmentPrefix) + "_INSTALL_ROOT")
  if ($configured) { [IO.Path]::GetFullPath($configured) } else { Join-Path $env:LOCALAPPDATA ("Programs\" + [string]$config.installFolder) }
} else { [IO.Path]::GetFullPath($InstallRootOverride) }
$DataRoot = if ([string]::IsNullOrWhiteSpace($DataRootOverride)) {
  $configured = [Environment]::GetEnvironmentVariable(([string]$config.environmentPrefix) + "_DATA_ROOT")
  if ($configured) { [IO.Path]::GetFullPath($configured) } else { Join-Path ([Environment]::GetFolderPath("ApplicationData")) ([string]$config.dataFolder) }
} else { [IO.Path]::GetFullPath($DataRootOverride) }
if ([string]::IsNullOrWhiteSpace($PayloadPath)) { $PayloadPath = Join-Path (Split-Path -Parent $Configuration) ([string]$config.payloadFile) }
$PayloadPath = [IO.Path]::GetFullPath($PayloadPath)
$RegistryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$([string]$config.productId)"
$StartMenu = Join-Path ([Environment]::GetFolderPath("StartMenu")) ("Programs\" + [string]$config.shortcutName)
$DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) (([string]$config.shortcutName) + ".lnk")

function T([string]$German, [string]$English) { if ($IsGerman) { return $German }; return $English }
function Show-Info([string]$Message) { if ($NoDialogs) { Write-Host $Message; return }; [void][Windows.Forms.MessageBox]::Show($Message, $AppName, [Windows.Forms.MessageBoxButtons]::OK, [Windows.Forms.MessageBoxIcon]::Information) }
function Confirm([string]$Message) { if ($AssumeYes) { return $true }; if ($NoDialogs) { return $false }; return [Windows.Forms.MessageBox]::Show($Message, $AppName, [Windows.Forms.MessageBoxButtons]::YesNo, [Windows.Forms.MessageBoxIcon]::Question) -eq [Windows.Forms.DialogResult]::Yes }
function Convert-Version([string]$Value) { $match=[Regex]::Match($Value,'^\d+\.\d+\.\d+'); if(-not$match.Success){throw "Invalid version: $Value"}; return [Version]$match.Value }
function Get-InstalledVersion { $path=Join-Path $InstallRoot 'version.txt'; if(Test-Path -LiteralPath $path -PathType Leaf){return (Get-Content -LiteralPath $path -Raw -Encoding UTF8).Trim()}; return $null }
function Test-Installed { return (Test-Path -LiteralPath (Join-Path $InstallRoot ([string]$config.mainExecutable)) -PathType Leaf) -and -not [string]::IsNullOrWhiteSpace((Get-InstalledVersion)) }

function Stop-App {
  $root=[IO.Path]::GetFullPath($InstallRoot).TrimEnd('\')+'\'
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ExecutablePath -and ([IO.Path]::GetFullPath($_.ExecutablePath)).StartsWith($root,[StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 500
}

function Expand-Payload([string]$Destination) {
  if(-not(Test-Path -LiteralPath $PayloadPath -PathType Leaf)){throw (T "Installationspaket fehlt." "Installation payload is missing.")}
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  $root=[IO.Path]::GetFullPath($Destination).TrimEnd('\')+'\'
  $archive=[IO.Compression.ZipFile]::OpenRead($PayloadPath)
  try { foreach($entry in $archive.Entries){$target=[IO.Path]::GetFullPath((Join-Path $Destination $entry.FullName));if(-not$target.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){throw (T "Ungültiger Pfad im Paket." "Invalid path in payload.")};if([string]::IsNullOrEmpty($entry.Name)){New-Item -ItemType Directory -Path $target -Force|Out-Null}else{New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force|Out-Null;[IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$target,$true)}} } finally { $archive.Dispose() }
  foreach($required in @([string]$config.mainExecutable,'version.txt','resources\update\check-for-updates.ps1','resources\update\setup-language-payload.ps1','resources\update\language-release-config.json')){if(-not(Test-Path -LiteralPath (Join-Path $Destination $required))){throw ((T "Paket ist unvollständig: " "Payload is incomplete: ")+$required)}}
  $payloadVersion=(Get-Content -LiteralPath (Join-Path $Destination 'version.txt') -Raw -Encoding UTF8).Trim()
  if($payloadVersion -ne [string]$config.version){throw (T "Paketversion stimmt nicht." "Payload version does not match release configuration.")}
}

function Write-ManagementLaunchers([string]$Root) {
  $manage=@"
@echo off
setlocal
cd /d "%TEMP%"
set "APP_ROOT=$Root"
set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=Menu"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_ROOT%\resources\update\setup-language-payload.ps1" -Action "%ACTION%" -Configuration "%APP_ROOT%\resources\update\language-release-config.json" -PayloadPath "%APP_ROOT%\$([string]$config.payloadFile)"
endlocal
"@
  [IO.File]::WriteAllText((Join-Path $Root 'MANAGE-WINDOWS.bat'),$manage,[Text.Encoding]::ASCII)
}

function New-Shortcut([string]$Path,[string]$Target,[string]$Arguments,[string]$Description) {
  New-Item -ItemType Directory -Path (Split-Path -Parent $Path) -Force|Out-Null
  $shell=New-Object -ComObject WScript.Shell;$shortcut=$shell.CreateShortcut($Path);$shortcut.TargetPath=$Target;$shortcut.Arguments=$Arguments;$shortcut.WorkingDirectory=$InstallRoot;$shortcut.IconLocation=(Join-Path $InstallRoot ([string]$config.mainExecutable))+',0';$shortcut.Description=$Description;$shortcut.Save()
}
function Register-App {
  if($SkipShortcuts){return}
  $manage=Join-Path $InstallRoot 'MANAGE-WINDOWS.bat';$exe=Join-Path $InstallRoot ([string]$config.mainExecutable);$updater=Join-Path $InstallRoot 'resources\update\check-for-updates.ps1';$updateConfig=Join-Path $InstallRoot 'resources\update\update-config.json';$powershell=Join-Path ([Environment]::GetFolderPath('System')) 'WindowsPowerShell\v1.0\powershell.exe'
  New-Shortcut (Join-Path $StartMenu (([string]$config.shortcutName)+'.lnk')) $exe '' (T "$AppName öffnen" "Open $AppName")
  New-Shortcut (Join-Path $StartMenu (T 'Nach Updates suchen.lnk' 'Check for updates.lnk')) $powershell ("-NoProfile -ExecutionPolicy Bypass -File `"$updater`" -Configuration `"$updateConfig`" -ForcePrompt") (T 'Update nur nach Zustimmung' 'Update only with consent')
  New-Shortcut (Join-Path $StartMenu (T 'Installation verwalten oder deinstallieren.lnk' 'Manage or uninstall.lnk')) $manage '' (T 'Update, Reparatur oder Deinstallation' 'Update, repair, or uninstall')
  New-Shortcut $DesktopShortcut $exe '' (T "$AppName öffnen" "Open $AppName")
  New-Item -Path $RegistryPath -Force|Out-Null;Set-ItemProperty $RegistryPath DisplayName $AppName;Set-ItemProperty $RegistryPath DisplayVersion ([string]$config.version);Set-ItemProperty $RegistryPath Publisher 'Hajimohammadi-KI';Set-ItemProperty $RegistryPath InstallLocation $InstallRoot;Set-ItemProperty $RegistryPath DisplayIcon $exe;Set-ItemProperty $RegistryPath UninstallString ('"{0}" Uninstall' -f $manage);Set-ItemProperty $RegistryPath QuietUninstallString ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "{0}" -Action Uninstall -Configuration "{1}" -PayloadPath "{2}" -NoDialogs -AssumeYes' -f (Join-Path $InstallRoot 'resources\update\setup-language-payload.ps1'),(Join-Path $InstallRoot 'resources\update\language-release-config.json'),(Join-Path $InstallRoot ([string]$config.payloadFile)));Set-ItemProperty $RegistryPath ModifyPath ('"{0}"' -f $manage);Set-ItemProperty $RegistryPath NoModify 0 -Type DWord;Set-ItemProperty $RegistryPath NoRepair 0 -Type DWord
}
function Remove-Registration { if($SkipShortcuts){return};if(Test-Path -LiteralPath $StartMenu){Remove-Item -LiteralPath $StartMenu -Recurse -Force};if(Test-Path -LiteralPath $DesktopShortcut){Remove-Item -LiteralPath $DesktopShortcut -Force};if(Test-Path -LiteralPath $RegistryPath){Remove-Item -LiteralPath $RegistryPath -Recurse -Force} }

function Install-App([string]$Mode) {
  $installed=Get-InstalledVersion;$source=[string]$config.version
  if($Mode-eq'Install'-and(Test-Installed)){throw (T 'Bereits installiert.' 'Already installed.')}
  if($Mode-eq'Update'-and((-not(Test-Installed))-or(Convert-Version $source)-le(Convert-Version $installed))){throw (T 'Keine neuere Version verfügbar.' 'No newer version is available.')}
  if($Mode-eq'Repair'-and-not(Test-Installed)){throw (T 'Zuerst installieren.' 'Install the app first.')}
  if(-not(Confirm((T "$Mode ausführen?`n`nInstalliert: $installed`nPaket: $source`n`nLerndaten bleiben erhalten." "$Mode now?`n`nInstalled: $installed`nPackage: $source`n`nLearning data is preserved.")))){return}
  Stop-App;$parent=Split-Path -Parent $InstallRoot;New-Item -ItemType Directory -Path $parent -Force|Out-Null;$staging=Join-Path $parent ('.'+[string]$config.productId+'.installing-'+[Guid]::NewGuid().ToString('N'));$backup=Join-Path $parent ('.'+[string]$config.productId+'.previous-'+[Guid]::NewGuid().ToString('N'))
  Expand-Payload $staging;Copy-Item -LiteralPath $PayloadPath -Destination (Join-Path $staging ([string]$config.payloadFile)) -Force;Write-ManagementLaunchers $staging
  if(Test-Path -LiteralPath $InstallRoot){Move-Item -LiteralPath $InstallRoot -Destination $backup}
  try{Move-Item -LiteralPath $staging -Destination $InstallRoot}catch{if(Test-Path -LiteralPath $backup){Move-Item -LiteralPath $backup -Destination $InstallRoot};throw}
  if(Test-Path -LiteralPath $backup){Remove-Item -LiteralPath $backup -Recurse -Force};New-Item -ItemType Directory -Path $DataRoot -Force|Out-Null;Register-App;Show-Info ((T "$Mode abgeschlossen. Version " "$Mode complete. Version ")+$source)
}
function Uninstall-App {
  if(-not(Test-Path -LiteralPath $InstallRoot)){return};if(-not(Confirm((T "$AppName deinstallieren?`n`nLerndaten bleiben erhalten." "Uninstall $AppName?`n`nLearning data is preserved.")))){return};Stop-App;Remove-Registration;$parent=Split-Path -Parent $InstallRoot;$tombstone=Join-Path $parent ('.'+[string]$config.productId+'.delete-'+[Guid]::NewGuid().ToString('N'));Move-Item -LiteralPath $InstallRoot -Destination $tombstone;Remove-Item -LiteralPath $tombstone -Recurse -Force;Show-Info (T 'Anwendung entfernt; Lerndaten wurden beibehalten.' 'App removed; learning data was preserved.')
}
function Show-Menu { if(-not(Test-Installed)){if(Confirm((T "$AppName installieren?" "Install $AppName?"))){Install-App 'Install'};return};$installed=Get-InstalledVersion;$primary=if((Convert-Version ([string]$config.version))-gt(Convert-Version $installed)){'Update'}else{'Repair'};$answer=[Windows.Forms.MessageBox]::Show((T "Ja: $primary`nNein: Deinstallieren`nAbbrechen: nichts ändern" "Yes: $primary`nNo: Uninstall`nCancel: do nothing"),$AppName,[Windows.Forms.MessageBoxButtons]::YesNoCancel,[Windows.Forms.MessageBoxIcon]::Question);if($answer-eq[Windows.Forms.DialogResult]::Yes){Install-App $primary}elseif($answer-eq[Windows.Forms.DialogResult]::No){Uninstall-App} }

try{switch($Action){'Install'{Install-App 'Install'};'Update'{Install-App 'Update'};'Repair'{Install-App 'Repair'};'Uninstall'{Uninstall-App};default{Show-Menu}}}catch{if($NoDialogs){Write-Error $_}else{[void][Windows.Forms.MessageBox]::Show($_.Exception.Message,"$AppName - Error",[Windows.Forms.MessageBoxButtons]::OK,[Windows.Forms.MessageBoxIcon]::Error)};exit 1}
