# Installs Research PDF Studio: checks Node.js, installs npm packages,
# builds the app, prepares the WSL-side copy that the web server actually
# runs in (see start-local-app.ps1 for why), creates a desktop shortcut,
# then starts the app. Plain console output on purpose -- this is meant to
# be double-clicked by someone with no technical background, so every step
# prints a short, readable status line rather than raw tool output.
#
# Unlike Tracker's installer, this one runs in place (no copy to
# %LOCALAPPDATA%) -- this app isn't a separate distributed product, it's
# part of this dev machine's own app collection.

$ErrorActionPreference = "Stop"
$AppName = "Research PDF Studio"
$AppRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$MinimumNodeVersion = [Version]"22.13.0"
$SetupLog = Join-Path $AppRoot "runtime-setup-install.log"
$DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "$AppName.lnk"
$StartBatch = Join-Path $AppRoot "STARTEN-WINDOWS.bat"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Done([string]$Message) {
  Write-Host "    $Message" -ForegroundColor Green
}

function Invoke-Logged([string]$Title, [scriptblock]$Action) {
  # Native commands (npm, node) routinely write routine warnings to stderr
  # (e.g. npm's deprecation notices). Under $ErrorActionPreference = "Stop",
  # PowerShell treats each stderr line as a terminating error -- so this
  # must switch to "Continue" for the duration of the native call and check
  # $LASTEXITCODE explicitly instead, the same pattern used by Tracker's
  # own installer (Invoke-NpmAttempt/Invoke-BunAttempt in its
  # setup-windows.ps1).
  Add-Content -LiteralPath $SetupLog -Value "`r`n=== $Title | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -Encoding UTF8
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $nativeOutput = @(& $Action 2>&1)
    $exitCode = $LASTEXITCODE
    foreach ($line in $nativeOutput) {
      $line.ToString() | Add-Content -LiteralPath $SetupLog -Encoding UTF8
    }
    if ($exitCode -ne 0 -and $null -ne $exitCode) {
      throw "$Title fehlgeschlagen (Exit-Code $exitCode). Details: $SetupLog"
    }
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
}

Set-Content -LiteralPath $SetupLog -Value "$AppName - Installationsprotokoll" -Encoding UTF8
Write-Host "$AppName wird installiert. Das kann einige Minuten dauern -- bitte dieses Fenster offen lassen." -ForegroundColor White

Write-Step "Node.js wird geprueft ..."
$node = Get-Command node.exe -ErrorAction SilentlyContinue
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $node -or -not $npm) {
  throw "Node.js wurde nicht gefunden. Bitte zuerst Node.js 22.13.0 oder neuer von https://nodejs.org/ installieren."
}
$versionText = (& $node.Source -p "process.versions.node").Trim().Split('-')[0]
$nodeVersion = [Version]$versionText
if ($nodeVersion -lt $MinimumNodeVersion) {
  throw "Installiert ist Node.js $nodeVersion. Benoetigt wird mindestens Node.js $MinimumNodeVersion."
}
Write-Done "Node.js $nodeVersion gefunden."

Write-Step "WSL2 (fuer den lokalen Webserver) wird geprueft ..."
$wslCheck = & wsl.exe -d Ubuntu -u root -- echo ok 2>$null
if ($LASTEXITCODE -ne 0 -or $wslCheck -ne "ok") {
  throw "WSL2 (Ubuntu) wurde nicht gefunden. Dieses Programm benoetigt WSL2, um den lokalen Webserver zuverlaessig zu starten."
}
Write-Done "WSL2 ist bereit."

Push-Location $AppRoot
try {
  Write-Step "Programmpakete werden geladen (kann mehrere Minuten dauern) ..."
  Invoke-Logged "npm ci" { & $npm.Source ci --no-audit --no-fund }
  Write-Done "Programmpakete installiert."

  Write-Step "Die App wird erstellt ..."
  Invoke-Logged "npm run build" { & $npm.Source run build }
  if (-not (Test-Path -LiteralPath (Join-Path $AppRoot "dist\server\index.js"))) {
    throw "Der Build hat keine lauffaehigen Programmdateien erzeugt. Protokoll: $SetupLog"
  }
  Write-Done "Build abgeschlossen."

  Write-Step "Lokale Laufzeitumgebung (WSL) wird vorbereitet ..."
  $prepareScript = Join-Path $AppRoot "scripts\wsl\prepare-wsl.sh"
  $wslRoot = (& wsl.exe wslpath -a "$($AppRoot.Replace('\', '/'))") 2>$null
  $prepareScriptWsl = (& wsl.exe wslpath -a "$($prepareScript.Replace('\', '/'))") 2>$null
  if (-not $wslRoot -or -not $prepareScriptWsl) {
    throw "Der Installationspfad konnte nicht fuer WSL umgewandelt werden."
  }
  Invoke-Logged "prepare-wsl.sh" { & wsl.exe -d Ubuntu -u root -- bash $prepareScriptWsl.Trim() $wslRoot.Trim() }
  Write-Done "Laufzeitumgebung vorbereitet."
}
finally {
  Pop-Location
}

Write-Step "Verknuepfung wird erstellt ..."
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($DesktopShortcut)
$shortcut.TargetPath = $StartBatch
$shortcut.WorkingDirectory = $AppRoot
$shortcut.Description = "$AppName starten"
if (Test-Path -LiteralPath (Join-Path $AppRoot "public\app-icon.ico")) {
  $shortcut.IconLocation = (Join-Path $AppRoot "public\app-icon.ico") + ",0"
}
$shortcut.Save()
Write-Done "Verknuepfung auf dem Desktop erstellt."

Write-Host ""
Write-Host "$AppName wurde erfolgreich installiert." -ForegroundColor Green
Write-Host "Die App wird jetzt gestartet ..." -ForegroundColor White
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $AppRoot "scripts\start-local-app.ps1")
