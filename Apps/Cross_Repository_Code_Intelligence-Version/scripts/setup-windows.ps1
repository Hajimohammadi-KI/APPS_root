param(
  [ValidateSet("Menu", "Install", "Update", "Repair", "Uninstall")]
  [string]$Action = "Menu",
  [switch]$NoDialogs,
  [string]$ScriptRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$AppName = "Cross Repository Code Intelligence"
$MinimumNodeVersion = [Version]"22.13.0"
$EffectiveScriptRoot = if ([string]::IsNullOrWhiteSpace($ScriptRoot)) { $PSScriptRoot } else { $ScriptRoot }
$SourceRoot = [IO.Path]::GetFullPath((Join-Path $EffectiveScriptRoot ".."))
$InstallRoot = Join-Path $env:LOCALAPPDATA "CrossRepositoryCodeIntelligence"
$SavedDataRoot = Join-Path $env:LOCALAPPDATA "CrossRepositoryCodeIntelligence-UserData"
$StartBatch = Join-Path $InstallRoot "STARTEN-WINDOWS.bat"
$SetupBatch = Join-Path $InstallRoot "SETUP-WINDOWS.bat"
$IconPath = Join-Path $InstallRoot "public\app-icon.ico"
$DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "$AppName.lnk"
$ProgramsFolder = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
$StartShortcut = Join-Path $ProgramsFolder "$AppName.lnk"
$SetupShortcut = Join-Path $ProgramsFolder "$AppName - Setup.lnk"
$SetupLog = Join-Path $InstallRoot "setup-install.log"

function Show-Info([string]$Message) {
  if ($NoDialogs) {
    Write-Host $Message
    return
  }
  [void][System.Windows.Forms.MessageBox]::Show(
    $Message,
    $AppName,
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
  )
}

function Show-Error([string]$Message) {
  if ($NoDialogs) {
    Write-Host $Message -ForegroundColor Red
    return
  }
  [void][System.Windows.Forms.MessageBox]::Show(
    $Message,
    "$AppName - Fehler",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Error
  )
}

function Confirm-Action([string]$Message) {
  if ($NoDialogs) {
    return $false
  }
  return [System.Windows.Forms.MessageBox]::Show(
    $Message,
    $AppName,
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Question
  ) -eq [System.Windows.Forms.DialogResult]::Yes
}

function Test-InstallFiles {
  return (Test-Path -LiteralPath (Join-Path $InstallRoot "package.json")) -and
    (Test-Path -LiteralPath $StartBatch)
}

function Test-Installed {
  return (Test-InstallFiles) -and
    (Test-Path -LiteralPath (Join-Path $InstallRoot "node_modules\.bin\bun.cmd")) -and
    (Test-Path -LiteralPath (Join-Path $InstallRoot ".env.local")) -and
    (Test-Path -LiteralPath (Join-Path $InstallRoot "dist\server\index.js")) -and
    (Test-Path -LiteralPath (Join-Path $InstallRoot "apps\api\dist\main.js"))
}

function Test-IncompleteInstallation {
  return (Test-InstallFiles) -and -not (Test-Installed)
}

function Test-SameDirectory([string]$Left, [string]$Right) {
  $leftPath = [IO.Path]::GetFullPath($Left).TrimEnd('\')
  $rightPath = [IO.Path]::GetFullPath($Right).TrimEnd('\')
  return $leftPath.Equals($rightPath, [StringComparison]::OrdinalIgnoreCase)
}

function Assert-Prerequisites {
  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $node -or -not $npm) {
    throw "Node.js und npm wurden nicht gefunden. Bitte installiere zuerst Node.js 22.13.0 oder neuer von https://nodejs.org/."
  }

  $versionText = (& $node.Source -p "process.versions.node").Trim().Split('-')[0]
  if ($LASTEXITCODE -ne 0) {
    throw "Die installierte Node.js-Version konnte nicht geprüft werden."
  }

  $nodeVersion = [Version]$versionText
  if ($nodeVersion -lt $MinimumNodeVersion) {
    throw "Installiert ist Node.js $nodeVersion. Benötigt wird mindestens Node.js $MinimumNodeVersion."
  }

  return @{ Node = $node.Source; Npm = $npm.Source; Version = $nodeVersion }
}

function Copy-ApplicationFiles {
  if (Test-SameDirectory $SourceRoot $InstallRoot) {
    return
  }

  New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
  $arguments = @(
    $SourceRoot,
    $InstallRoot,
    "/E",
    "/COPY:DAT",
    "/DCOPY:DAT",
    "/R:2",
    "/W:1",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS",
    "/NP",
    "/XD",
    "node_modules",
    "dist",
    ".next",
    "out",
    ".wrangler",
    ".npm-cache",
    ".git",
    "/XF",
    ".env.local",
    "*.log",
    "*.tsbuildinfo"
  )

  & robocopy.exe @arguments | Out-Null
  if ($LASTEXITCODE -gt 7) {
    throw "Die Programmdateien konnten nicht nach $InstallRoot kopiert werden. Robocopy-Code: $LASTEXITCODE"
  }
}

function Remove-DownloadedFileMark {
  if (-not (Test-Path -LiteralPath $InstallRoot)) {
    return
  }

  Get-ChildItem -LiteralPath $InstallRoot -Recurse -Force -File -ErrorAction SilentlyContinue |
    ForEach-Object {
      Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue
    }
}

function Get-LatestSavedData {
  if (-not (Test-Path -LiteralPath $SavedDataRoot)) {
    return $null
  }
  return Get-ChildItem -LiteralPath $SavedDataRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1
}

function Restore-SavedData {
  $backup = Get-LatestSavedData
  if (-not $backup) {
    return
  }

  $savedWrangler = Join-Path $backup.FullName ".wrangler"
  $savedEnv = Join-Path $backup.FullName ".env.local"
  $targetWrangler = Join-Path $InstallRoot ".wrangler"
  $targetEnv = Join-Path $InstallRoot ".env.local"

  if ((Test-Path -LiteralPath $savedWrangler) -and -not (Test-Path -LiteralPath $targetWrangler)) {
    Copy-Item -LiteralPath $savedWrangler -Destination $targetWrangler -Recurse -Force
  }
  if ((Test-Path -LiteralPath $savedEnv) -and -not (Test-Path -LiteralPath $targetEnv)) {
    Copy-Item -LiteralPath $savedEnv -Destination $targetEnv -Force
  }
}

function Invoke-NpmAttempt($Prerequisites, [string[]]$Arguments, [string]$Title) {
  $previousPreference = $ErrorActionPreference
  try {
    Add-Content -LiteralPath $SetupLog -Value "`r`n=== $Title | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -Encoding UTF8
    Add-Content -LiteralPath $SetupLog -Value ("npm " + ($Arguments -join " ")) -Encoding UTF8
    $ErrorActionPreference = "Continue"
    $nativeOutput = @(& $Prerequisites.Npm @Arguments 2>&1)
    $exitCode = $LASTEXITCODE
    foreach ($line in $nativeOutput) {
      $line.ToString() | Add-Content -LiteralPath $SetupLog -Encoding UTF8
    }
    Add-Content -LiteralPath $SetupLog -Value "Exit-Code: $exitCode" -Encoding UTF8
    return $exitCode
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Invoke-BunAttempt([string[]]$Arguments, [string]$Title) {
  $bunExecutable = Join-Path $InstallRoot "node_modules\bun\bin\bun.exe"
  if (-not (Test-Path -LiteralPath $bunExecutable)) {
    throw "Bun wurde nach der Paketinstallation nicht gefunden."
  }

  $previousPreference = $ErrorActionPreference
  try {
    Add-Content -LiteralPath $SetupLog -Value "`r`n=== $Title | $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -Encoding UTF8
    Add-Content -LiteralPath $SetupLog -Value ("bun " + ($Arguments -join " ")) -Encoding UTF8
    $ErrorActionPreference = "Continue"
    $nativeOutput = @(& $bunExecutable @Arguments 2>&1)
    $exitCode = $LASTEXITCODE
    foreach ($line in $nativeOutput) {
      $line.ToString() | Add-Content -LiteralPath $SetupLog -Encoding UTF8
    }
    Add-Content -LiteralPath $SetupLog -Value "Exit-Code: $exitCode" -Encoding UTF8
    return $exitCode
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Install-Dependencies($Prerequisites) {
  Push-Location $InstallRoot
  try {
    Set-Content -LiteralPath $SetupLog -Value "Cross Repository Code Intelligence - Installationsprotokoll" -Encoding UTF8
    $env:npm_config_registry = "https://registry.npmjs.org/"

    $exitCode = Invoke-NpmAttempt $Prerequisites @("ci", "--no-audit", "--no-fund", "--prefer-online", "--fetch-retries=2") "1. Versuch: saubere Installation"
    if ($exitCode -ne 0) {
      [void](Invoke-NpmAttempt $Prerequisites @("cache", "verify") "Cache prüfen")
      $exitCode = Invoke-NpmAttempt $Prerequisites @("ci", "--no-audit", "--no-fund", "--prefer-online", "--fetch-retries=5", "--fetch-retry-mintimeout=2000") "2. Versuch: Online-Wiederholung"
    }
    if ($exitCode -ne 0) {
      $exitCode = Invoke-NpmAttempt $Prerequisites @("install", "--no-audit", "--no-fund", "--prefer-online", "--fetch-retries=5") "3. Versuch: kompatible Installation"
    }
    if ($exitCode -ne 0) {
      $details = (Get-Content -LiteralPath $SetupLog -Tail 14 -ErrorAction SilentlyContinue) -join "`r`n"
      throw "Die Programmpakete konnten nicht installiert werden.`r`n`r`nLetzte Meldungen:`r`n$details`r`n`r`nVollständiges Protokoll:`r`n$SetupLog"
    }

    & $Prerequisites.Node "scripts\generate-local-env.mjs"
    if ($LASTEXITCODE -ne 0) {
      throw "Die sichere lokale Konfiguration konnte nicht erstellt werden."
    }

    $buildExitCode = Invoke-BunAttempt @("run", "build:all") "Kompilierte Web-App und API erstellen"
    if ($buildExitCode -ne 0) {
      $details = (Get-Content -LiteralPath $SetupLog -Tail 18 -ErrorAction SilentlyContinue) -join "`r`n"
      throw "Web-App oder API konnten nicht kompiliert werden.`r`n`r`nLetzte Meldungen:`r`n$details`r`n`r`nVollständiges Protokoll:`r`n$SetupLog"
    }

    $validationExitCode = Invoke-BunAttempt @("run", "validate:artifact") "Web-Artefakt prüfen"
    if ($validationExitCode -ne 0 -or
        -not (Test-Path -LiteralPath (Join-Path $InstallRoot "dist\server\index.js")) -or
        -not (Test-Path -LiteralPath (Join-Path $InstallRoot "apps\api\dist\main.js"))) {
      throw "Die kompilierten Programmdateien sind unvollständig. Bitte das Installationsprotokoll prüfen: $SetupLog"
    }
  }
  finally {
    Pop-Location
  }
}

function New-Shortcut([string]$Path, [string]$Target, [string]$Description) {
  $parent = Split-Path -Parent $Path
  New-Item -ItemType Directory -Path $parent -Force | Out-Null
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($Path)
  $shortcut.TargetPath = $Target
  $shortcut.WorkingDirectory = $InstallRoot
  $shortcut.Description = $Description
  if (Test-Path -LiteralPath $IconPath) {
    $shortcut.IconLocation = "$IconPath,0"
  }
  $shortcut.Save()
}

function Create-Shortcuts {
  New-Shortcut $DesktopShortcut $StartBatch "$AppName starten"
  New-Shortcut $StartShortcut $StartBatch "$AppName starten"
  New-Shortcut $SetupShortcut $SetupBatch "$AppName aktualisieren, reparieren oder deinstallieren"
}

function Remove-Shortcuts {
  foreach ($shortcut in @($DesktopShortcut, $StartShortcut, $SetupShortcut)) {
    if (Test-Path -LiteralPath $shortcut) {
      Remove-Item -LiteralPath $shortcut -Force
    }
  }
}

function Save-UserData {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backup = Join-Path $SavedDataRoot $stamp
  New-Item -ItemType Directory -Path $backup -Force | Out-Null

  $wrangler = Join-Path $InstallRoot ".wrangler"
  $environment = Join-Path $InstallRoot ".env.local"
  if (Test-Path -LiteralPath $wrangler) {
    Copy-Item -LiteralPath $wrangler -Destination (Join-Path $backup ".wrangler") -Recurse -Force
  }
  if (Test-Path -LiteralPath $environment) {
    Copy-Item -LiteralPath $environment -Destination (Join-Path $backup ".env.local") -Force
  }
  return $backup
}

function Start-App {
  if (-not (Test-Path -LiteralPath $StartBatch)) {
    throw "Die Startdatei fehlt: $StartBatch"
  }
  return Start-Process -FilePath $StartBatch -WorkingDirectory $InstallRoot -PassThru
}

function Open-DeepLBrowserExtensionPage {
  # The official DeepL page lets the user choose Chrome, Edge, or Firefox.
  # Installation and permission approval stay in the user's browser.
  try {
    Start-Process -FilePath "https://www.deepl.com/en/app" | Out-Null
  }
  catch {
    Show-Info "Die offizielle DeepL-Seite konnte nicht geöffnet werden. Bitte später https://www.deepl.com/en/app im Browser öffnen."
  }
}

function Test-AppEndpoint([string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  }
  catch {
    return $false
  }
}

function Wait-ForAppReady($LauncherProcess, [int]$TimeoutSeconds = 180) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    [System.Windows.Forms.Application]::DoEvents()
    $webReady = Test-AppEndpoint "http://127.0.0.1:4312/api/state"
    $apiReady = Test-AppEndpoint "http://127.0.0.1:4313/v1/health"
    if ($webReady -and $apiReady) {
      return $true
    }
    if ($LauncherProcess -and $LauncherProcess.HasExited) {
      return $false
    }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Invoke-InstallOperation(
  [ValidateSet("Install", "Update", "Repair")][string]$Mode,
  [switch]$NoCompletionDialog
) {
  $installed = Test-Installed
  $installFilesExist = Test-InstallFiles
  if ($Mode -eq "Install" -and $installed) {
    throw "Die App ist bereits installiert. Verwende Aktualisieren oder Reparieren."
  }
  if ($Mode -ne "Install" -and -not $installFilesExist) {
    throw "Die App ist noch nicht installiert. Verwende Erstinstallation."
  }
  if ($Mode -eq "Update" -and (Test-SameDirectory $SourceRoot $InstallRoot)) {
    throw "Für ein Update bitte SETUP-WINDOWS.bat aus dem neu heruntergeladenen und entpackten Paket starten."
  }

  $prerequisites = Assert-Prerequisites
  if ($Mode -ne "Install") {
    Stop-LocalAppProcesses
  }
  Copy-ApplicationFiles
  Restore-SavedData
  Remove-DownloadedFileMark
  Install-Dependencies $prerequisites
  Create-Shortcuts

  $verb = switch ($Mode) {
    "Install" { "installiert" }
    "Update" { "aktualisiert" }
    "Repair" { "repariert" }
  }
  $launcherProcess = Start-App
  if (-not (Wait-ForAppReady $launcherProcess)) {
    Stop-LocalAppProcesses
    $runtimeLog = Join-Path $InstallRoot "runtime-startup.log"
    throw "Die Installation wurde abgeschlossen, aber Web-App und API konnten nicht gemeinsam gestartet werden.`r`nBitte das Startprotokoll prüfen: $runtimeLog"
  }
  if (-not $NoCompletionDialog) {
    Show-Info "$AppName wurde erfolgreich $verb.`n`nInstallationsordner:`n$InstallRoot`n`nAuf dem Desktop und im Startmenü wurden Verknüpfungen erstellt.`n`nDie App wurde automatisch gestartet."
  }
}

function Start-DeferredRemoval {
  $cleanupScript = Join-Path $env:TEMP ("cross-repository-uninstall-" + [Guid]::NewGuid().ToString("N") + ".ps1")
  $cleanupContent = @'
param([Parameter(Mandatory = $true)][string]$Target, [Parameter(Mandatory = $true)][string]$AppName)
Start-Sleep -Seconds 2
$removed = $false
for ($attempt = 0; $attempt -lt 20; $attempt++) {
  try {
    if (Test-Path -LiteralPath $Target) {
      Remove-Item -LiteralPath $Target -Recurse -Force -ErrorAction Stop
    }
    $removed = -not (Test-Path -LiteralPath $Target)
    if ($removed) { break }
  }
  catch { }
  Start-Sleep -Milliseconds 750
}
Add-Type -AssemblyName System.Windows.Forms
if ($removed) {
  [void][System.Windows.Forms.MessageBox]::Show("Die App wurde vollständig deinstalliert.", $AppName)
} else {
  [void][System.Windows.Forms.MessageBox]::Show("Der Installationsordner konnte nicht vollständig entfernt werden. Bitte starte Windows neu und lösche ihn anschließend manuell:`n$Target", "$AppName - Fehler")
}
Remove-Item -LiteralPath $PSCommandPath -Force -ErrorAction SilentlyContinue
'@
  Set-Content -LiteralPath $cleanupScript -Value $cleanupContent -Encoding UTF8
  $arguments = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-WindowStyle", "Hidden",
    "-File", ('"{0}"' -f $cleanupScript),
    "-Target", ('"{0}"' -f $InstallRoot),
    "-AppName", ('"{0}"' -f $AppName)
  )
  Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -WorkingDirectory $env:TEMP | Out-Null
}

function Stop-LocalAppProcesses {
  $escapedRoot = [Regex]::Escape($InstallRoot)
  $processNames = @("bun.exe", "node.exe", "workerd.exe", "wrangler.exe", "esbuild.exe", "cmd.exe", "npm.exe", "powershell.exe")
  $protectedIds = [Collections.Generic.HashSet[int]]::new()
  $currentId = $PID
  while ($currentId -gt 0 -and $protectedIds.Add($currentId)) {
    $currentProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $currentId" -ErrorAction SilentlyContinue
    if (-not $currentProcess) { break }
    $currentId = [int]$currentProcess.ParentProcessId
  }

  for ($round = 0; $round -lt 5; $round++) {
    $targets = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object {
        -not $protectedIds.Contains([int]$_.ProcessId) -and
        $processNames -contains $_.Name -and
        $_.CommandLine -and
        $_.CommandLine -match $escapedRoot
      }
    if (-not $targets) { return }
    foreach ($target in ($targets | Sort-Object ProcessId -Descending)) {
      Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 500
  }
}

function Invoke-Uninstall {
  if (-not (Test-Path -LiteralPath $InstallRoot)) {
    Show-Info "Die App ist nicht installiert."
    return
  }

  if (-not (Confirm-Action "$AppName wirklich deinstallieren?")) {
    return
  }

  $dataChoice = [System.Windows.Forms.MessageBox]::Show(
    "Möchtest du Lernfortschritt, Notizen, Uploads und Einstellungen für eine spätere Neuinstallation behalten?`n`nJa = Daten sichern`nNein = Daten löschen`nAbbrechen = Deinstallation abbrechen",
    "$AppName - lokale Daten",
    [System.Windows.Forms.MessageBoxButtons]::YesNoCancel,
    [System.Windows.Forms.MessageBoxIcon]::Question
  )
  if ($dataChoice -eq [System.Windows.Forms.DialogResult]::Cancel) {
    return
  }

  Stop-LocalAppProcesses
  if ($dataChoice -eq [System.Windows.Forms.DialogResult]::Yes) {
    $backup = Save-UserData
    Show-Info "Die lokalen Daten wurden für eine spätere Neuinstallation gesichert:`n$backup"
  } elseif (Test-Path -LiteralPath $SavedDataRoot) {
    Remove-Item -LiteralPath $SavedDataRoot -Recurse -Force
  }

  Remove-Shortcuts
  Start-DeferredRemoval
  [Environment]::Exit(0)
}

function New-UiLabel([string]$Text, [int]$Left, [int]$Top, [int]$Width, [int]$Height, [float]$Size, [System.Drawing.FontStyle]$Style, [System.Drawing.Color]$Color) {
  $label = New-Object System.Windows.Forms.Label
  $label.Text = $Text
  $label.Left = $Left
  $label.Top = $Top
  $label.Width = $Width
  $label.Height = $Height
  $label.Font = New-Object System.Drawing.Font("Segoe UI", $Size, $Style)
  $label.ForeColor = $Color
  $label.BackColor = [System.Drawing.Color]::Transparent
  return $label
}

function New-UiButton([string]$Text, [int]$Left, [int]$Top, [int]$Width, [int]$Height) {
  $button = New-Object System.Windows.Forms.Button
  $button.Text = $Text
  $button.Left = $Left
  $button.Top = $Top
  $button.Width = $Width
  $button.Height = $Height
  $button.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
  $button.UseVisualStyleBackColor = $false
  $button.FlatAppearance.BorderSize = 1
  $button.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
  $button.Cursor = [System.Windows.Forms.Cursors]::Hand
  return $button
}

function Invoke-Menu {
  [System.Windows.Forms.Application]::EnableVisualStyles()
  $navy = [System.Drawing.Color]::FromArgb(73, 52, 101)
  $ink = [System.Drawing.Color]::FromArgb(41, 35, 61)
  $muted = [System.Drawing.Color]::FromArgb(92, 79, 112)
  $purple = [System.Drawing.Color]::FromArgb(111, 82, 150)
  $lavender = [System.Drawing.Color]::FromArgb(241, 234, 250)
  $line = [System.Drawing.Color]::FromArgb(221, 210, 232)
  $surface = [System.Drawing.Color]::FromArgb(250, 247, 253)
  $danger = [System.Drawing.Color]::FromArgb(176, 66, 58)
  $white = [System.Drawing.Color]::White

  $form = New-Object System.Windows.Forms.Form
  $form.Text = "$AppName - Setup"
  $form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
  $form.ClientSize = New-Object System.Drawing.Size(920, 590)
  $form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
  $form.MaximizeBox = $false
  $form.BackColor = $white
  if (Test-Path -LiteralPath (Join-Path $SourceRoot "public\app-icon.ico")) {
    $form.Icon = New-Object System.Drawing.Icon -ArgumentList (Join-Path $SourceRoot "public\app-icon.ico")
  }

  $brandPanel = New-Object System.Windows.Forms.Panel
  $brandPanel.Dock = [System.Windows.Forms.DockStyle]::Left
  $brandPanel.Width = 292
  $brandPanel.BackColor = $navy

  $iconBox = New-Object System.Windows.Forms.PictureBox
  $iconBox.Left = 34
  $iconBox.Top = 34
  $iconBox.Width = 58
  $iconBox.Height = 58
  $iconBox.SizeMode = [System.Windows.Forms.PictureBoxSizeMode]::StretchImage
  if (Test-Path -LiteralPath (Join-Path $SourceRoot "public\app-icon.ico")) {
    $iconBox.Image = (New-Object System.Drawing.Icon -ArgumentList (Join-Path $SourceRoot "public\app-icon.ico")).ToBitmap()
  }

  $brandKicker = New-UiLabel "FORSCHEN · VERSTEHEN · BAUEN" 34 116 224 22 8.5 ([System.Drawing.FontStyle]::Bold) ([System.Drawing.Color]::FromArgb(216, 200, 233))
  $brandTitle = New-UiLabel "Cross Repository`nCode Intelligence" 34 148 224 72 19 ([System.Drawing.FontStyle]::Bold) $white
  $brandCopy = New-UiLabel "Ihr lokales Lernstudio für Forschungsplanung, PDF-Arbeit und Fokuszeit." 34 232 218 72 10 ([System.Drawing.FontStyle]::Regular) ([System.Drawing.Color]::FromArgb(237, 228, 245))
  $brandFooter = New-UiLabel "LOKALE INSTALLATION`nVersion2 0.5.0 · Daten bleiben auf diesem PC" 34 510 224 48 8.5 ([System.Drawing.FontStyle]::Regular) ([System.Drawing.Color]::FromArgb(216, 200, 233))
  $brandPanel.Controls.AddRange(@($iconBox, $brandKicker, $brandTitle, $brandCopy, $brandFooter))

  $content = New-Object System.Windows.Forms.Panel
  $content.Left = 292
  $content.Top = 0
  $content.Width = 628
  $content.Height = 590
  $content.BackColor = $white

  $closeButton = New-UiButton "×" 574 18 34 34
  $closeButton.BackColor = $white
  $closeButton.ForeColor = $muted
  $closeButton.FlatAppearance.BorderSize = 0
  $closeButton.Font = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Regular)

  $stateLabel = New-UiLabel "" 42 40 500 24 8.5 ([System.Drawing.FontStyle]::Bold) $purple
  $heading = New-UiLabel "" 42 76 530 42 21 ([System.Drawing.FontStyle]::Bold) $ink
  $subtitle = New-UiLabel "" 42 122 530 46 10 ([System.Drawing.FontStyle]::Regular) $muted

  $modePanel = New-Object System.Windows.Forms.Panel
  $modePanel.Left = 42
  $modePanel.Top = 176
  $modePanel.Width = 530
  $modePanel.Height = 42
  $modePanel.BackColor = $surface

  $modeButtons = @{}
  $modeNames = @(
    @{ Mode = "Install"; Text = "Installieren" },
    @{ Mode = "Update"; Text = "Aktualisieren" },
    @{ Mode = "Repair"; Text = "Reparieren" },
    @{ Mode = "Uninstall"; Text = "Deinstallieren" }
  )
  for ($index = 0; $index -lt $modeNames.Count; $index++) {
    $item = $modeNames[$index]
    $button = New-UiButton $item.Text ($index * 132) 0 132 42
    $button.Tag = $item.Mode
    $button.BackColor = $surface
    $button.ForeColor = $muted
    $button.FlatAppearance.BorderColor = $line
    $modeButtons[$item.Mode] = $button
    $modePanel.Controls.Add($button)
  }

  $featureRows = @()
  for ($index = 0; $index -lt 3; $index++) {
    $top = 244 + ($index * 70)
    $number = New-UiLabel ([string]($index + 1)) 42 $top 30 30 10 ([System.Drawing.FontStyle]::Bold) $purple
    $number.BackColor = $lavender
    $number.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
    $featureTitle = New-UiLabel "" 88 ($top - 2) 474 24 10 ([System.Drawing.FontStyle]::Bold) $ink
    $featureText = New-UiLabel "" 88 ($top + 22) 474 32 9 ([System.Drawing.FontStyle]::Regular) $muted
    $content.Controls.AddRange(@($number, $featureTitle, $featureText))
    $featureRows += ,@($number, $featureTitle, $featureText)
  }

  $status = New-UiLabel "" 42 466 530 36 9 ([System.Drawing.FontStyle]::Regular) $muted
  $status.Padding = New-Object System.Windows.Forms.Padding(10, 7, 10, 7)
  $status.BackColor = $surface

  $openDeepLCheckBox = New-Object System.Windows.Forms.CheckBox
  $openDeepLCheckBox.Left = 42
  $openDeepLCheckBox.Top = 441
  $openDeepLCheckBox.Width = 530
  $openDeepLCheckBox.Height = 20
  $openDeepLCheckBox.Text = "Nach Abschluss die offizielle DeepL-Erweiterung öffnen (optional)"
  $openDeepLCheckBox.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Regular)
  $openDeepLCheckBox.ForeColor = $ink
  $openDeepLCheckBox.BackColor = $white
  $openDeepLCheckBox.Checked = $false
  $deepLTip = New-Object System.Windows.Forms.ToolTip
  $deepLTip.SetToolTip($openDeepLCheckBox, "DeepL wird nicht automatisch installiert. Ihr Browser zeigt die Berechtigungen und bittet um Ihre Bestätigung.")

  $progress = New-Object System.Windows.Forms.ProgressBar
  $progress.Left = 42
  $progress.Top = 507
  $progress.Width = 530
  $progress.Height = 5
  $progress.Style = [System.Windows.Forms.ProgressBarStyle]::Marquee
  $progress.MarqueeAnimationSpeed = 30
  $progress.Visible = $false

  $logButton = New-UiButton "Installationsprotokoll" 42 523 176 42
  $logButton.BackColor = $white
  $logButton.ForeColor = $ink
  $logButton.FlatAppearance.BorderColor = $line
  $logButton.Visible = Test-Path -LiteralPath $SetupLog

  $actionButton = New-UiButton "" 382 515 190 50
  $actionButton.BackColor = $navy
  $actionButton.ForeColor = $white
  $actionButton.FlatAppearance.BorderSize = 0
  $actionButton.Font = New-Object System.Drawing.Font("Segoe UI", 10.5, [System.Drawing.FontStyle]::Bold)

  $content.Controls.AddRange(@($closeButton, $stateLabel, $heading, $subtitle, $modePanel, $openDeepLCheckBox, $status, $progress, $logButton, $actionButton))
  $form.Controls.AddRange(@($content, $brandPanel))

  $modeContent = @{
    Install = @{
      State = "●  ERSTINSTALLATION AUSGEWÄHLT"
      Heading = "App vollständig installieren."
      Subtitle = "Alle drei Bereiche werden lokal eingerichtet. Ihre Daten bleiben auf diesem Windows-PC."
      Action = "Jetzt installieren"
      Features = @(
        @("Ein klarer Start", "Setup prüft Node.js, lädt Pakete und erstellt die Verknüpfungen."),
        @("Update-sicher", "Lernfortschritt, Notizen und Einstellungen bleiben erhalten."),
        @("Unter Ihrer Kontrolle", "Aktualisieren, reparieren oder deinstallieren Sie jederzeit.")
      )
    }
    Update = @{
      State = "●  AKTUALISIERUNG AUSGEWÄHLT"
      Heading = "App sicher aktualisieren."
      Subtitle = "Neue Programmdateien werden übernommen, ohne Ihre lokalen Lerndaten zu ersetzen."
      Action = "Jetzt aktualisieren"
      Features = @(
        @("Neue Version übernehmen", "Programmdateien und Oberfläche werden aktualisiert."),
        @("Persönliche Daten schützen", "Fortschritt, Uploads und Zugangsdaten bleiben erhalten."),
        @("Verknüpfungen erneuern", "Desktop und Startmenü zeigen wieder auf die aktuelle Version.")
      )
    }
    Repair = @{
      State = "●  REPARATUR AUSGEWÄHLT"
      Heading = "Installation prüfen und reparieren."
      Subtitle = "Fehlende oder beschädigte Programmpakete werden erneut geladen und geprüft."
      Action = "Jetzt reparieren"
      Features = @(
        @("Dateien vervollständigen", "Eine unvollständige Installation wird automatisch erkannt."),
        @("Pakete erneut laden", "Setup versucht mehrere sichere npm-Wiederherstellungswege."),
        @("Lerndaten behalten", "Notizen, Fortschritt und lokale Dateien werden nicht gelöscht.")
      )
    }
    Uninstall = @{
      State = "●  DEINSTALLATION AUSGEWÄHLT"
      Heading = "App kontrolliert entfernen."
      Subtitle = "Vor dem Entfernen entscheiden Sie selbst, ob Ihre lokalen Lerndaten erhalten bleiben."
      Action = "App deinstallieren"
      Features = @(
        @("Verknüpfungen entfernen", "Desktop- und Startmenüeinträge werden sauber gelöscht."),
        @("Programmdaten entfernen", "Der lokale Installationsordner wird freigegeben."),
        @("Lerndaten auswählen", "Setup fragt ausdrücklich, ob persönliche Daten erhalten bleiben.")
      )
    }
  }

  $uiState = @{ SelectedMode = "Install"; Busy = $false }
  $availableModes = @{}

  $selectMode = {
    param([string]$Mode)
    if ($uiState.Busy) { return }
    if (-not $availableModes[$Mode]) { return }
    $uiState.SelectedMode = $Mode
    $contentItem = $modeContent[$Mode]
    $stateLabel.Text = $contentItem.State
    $heading.Text = $contentItem.Heading
    $subtitle.Text = $contentItem.Subtitle
    $actionButton.Text = $contentItem.Action
    $actionButton.BackColor = if ($Mode -eq "Uninstall") { $danger } else { $navy }
    $actionButton.ForeColor = $white
    $openDeepLCheckBox.Visible = $Mode -ne "Uninstall"
    for ($row = 0; $row -lt 3; $row++) {
      $featureRows[$row][1].Text = $contentItem.Features[$row][0]
      $featureRows[$row][2].Text = $contentItem.Features[$row][1]
    }
    foreach ($key in $modeButtons.Keys) {
      $button = $modeButtons[$key]
      if (-not $availableModes[$key]) {
        $button.BackColor = [System.Drawing.Color]::FromArgb(242, 244, 246)
        $button.ForeColor = [System.Drawing.Color]::FromArgb(170, 178, 186)
      } elseif ($key -eq $Mode) {
        $button.BackColor = $navy
        $button.ForeColor = $white
      } else {
        $button.BackColor = $surface
        $button.ForeColor = $muted
      }
    }
  }

  $refreshState = {
    $installed = Test-Installed
    $incomplete = Test-IncompleteInstallation
    $availableModes.Clear()
    $availableModes["Install"] = -not $installed
    $availableModes["Update"] = $installed
    $availableModes["Repair"] = ($installed -or $incomplete)
    $availableModes["Uninstall"] = ($installed -or $incomplete)
    foreach ($key in $modeButtons.Keys) {
      $modeButtons[$key].Enabled = [bool]$availableModes[$key]
    }
    $status.Text = if ($installed) {
      "Bereit · installiert unter $InstallRoot"
    } elseif ($incomplete) {
      "Unvollständige Installation erkannt · Reparieren wird empfohlen."
    } else {
      "Bereit für die lokale Erstinstallation."
    }
    $logButton.Visible = Test-Path -LiteralPath $SetupLog
    $defaultMode = if ($incomplete) { "Repair" } elseif ($installed) { "Update" } else { "Install" }
    & $selectMode $defaultMode
  }

  foreach ($button in $modeButtons.Values) {
    $button.Add_Click({
      param($sender, $eventArgs)
      if ($uiState.Busy) { return }
      & $selectMode ([string]$sender.Tag)
    })
  }

  $actionButton.Add_Click({
    if ($uiState.Busy) { return }
    $uiState.Busy = $true
    $operationSucceeded = $false
    $mode = $uiState.SelectedMode
    $status.Text = switch ($mode) {
      "Install" { "Installation läuft · Pakete werden geprüft und geladen ..." }
      "Update" { "Aktualisierung läuft · persönliche Daten bleiben erhalten ..." }
      "Repair" { "Reparatur läuft · fehlende Pakete werden wiederhergestellt ..." }
      "Uninstall" { "Deinstallation wird vorbereitet ..." }
    }
    $progress.Visible = $mode -ne "Uninstall"
    $actionButton.Text = "Bitte warten ..."
    $actionButton.ForeColor = $white
    $actionButton.Cursor = [System.Windows.Forms.Cursors]::WaitCursor
    $modePanel.Cursor = [System.Windows.Forms.Cursors]::WaitCursor
    $form.Cursor = [System.Windows.Forms.Cursors]::WaitCursor
    [System.Windows.Forms.Application]::DoEvents()
    try {
      if ($mode -eq "Uninstall") {
        Invoke-Uninstall
      } else {
        Invoke-InstallOperation $mode -NoCompletionDialog
        if ($openDeepLCheckBox.Checked) {
          Open-DeepLBrowserExtensionPage
        }
        $operationSucceeded = $true
      }
    }
    catch {
      $logButton.Visible = Test-Path -LiteralPath $SetupLog
      Show-Error $_.Exception.Message
    }
    finally {
      $progress.Visible = $false
      $uiState.Busy = $false
      $actionButton.Cursor = [System.Windows.Forms.Cursors]::Hand
      $modePanel.Cursor = [System.Windows.Forms.Cursors]::Default
      $form.Cursor = [System.Windows.Forms.Cursors]::Default
      & $refreshState
    }
    if ($operationSucceeded) {
      $form.Close()
    }
  })

  $logButton.Add_Click({
    if (Test-Path -LiteralPath $SetupLog) {
      Start-Process -FilePath "notepad.exe" -ArgumentList ('"{0}"' -f $SetupLog)
    }
  })
  $closeButton.Add_Click({
    if (-not $uiState.Busy) { $form.Close() }
  })
  $form.Add_FormClosing({
    param($sender, $eventArgs)
    if ($uiState.Busy) { $eventArgs.Cancel = $true }
  })

  & $refreshState
  [void]$form.ShowDialog()
}

try {
  switch ($Action) {
    "Install" { Invoke-InstallOperation "Install" }
    "Update" { Invoke-InstallOperation "Update" }
    "Repair" { Invoke-InstallOperation "Repair" }
    "Uninstall" { Invoke-Uninstall }
    default { Invoke-Menu }
  }
}
catch {
  Show-Error $_.Exception.Message
  exit 1
}
