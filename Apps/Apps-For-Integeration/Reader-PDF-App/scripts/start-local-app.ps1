param(
  [int]$MaxAttempts = 3,
  [int]$StartupTimeoutSeconds = 75,
  [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$AppName = "Research PDF Studio"
$AppRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$WebHealthUrl = "http://127.0.0.1:4322/api/status"
$OpenUrl = "http://127.0.0.1:4322/"
$StartupLog = Join-Path $AppRoot "runtime-startup.log"
$WebOutputLog = Join-Path $AppRoot "runtime-web.log"
$WebErrorLog = Join-Path $AppRoot "runtime-web-error.log"

# The web server ("wrangler dev" / workerd) does not run natively on
# Windows on this machine -- it crashes immediately with a native
# std::terminate() inside workerd.exe. It runs fine under WSL2 with the
# same source. So the web process is launched inside WSL instead, with a
# small relay bridging it back to the port Windows targets. See
# docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md and scripts/wsl/*.
$RunWebScript = Join-Path $AppRoot "scripts\wsl\run-web.sh"
$PortproxyScript = Join-Path $AppRoot "scripts\wsl\ensure-portproxy.ps1"

function ConvertTo-WslPath([string]$WindowsPath) {
  # Backslashes get silently eaten somewhere in the PowerShell -> wsl.exe ->
  # wslpath argument-passing chain -- forward slashes sidestep this.
  $forwardSlashPath = $WindowsPath.Replace('\', '/')
  $result = (& wsl.exe wslpath -a "$forwardSlashPath") 2>$null
  if (-not $result) {
    throw "Der Pfad konnte nicht fuer WSL umgewandelt werden: $WindowsPath"
  }
  return $result.Trim()
}

function Write-StartupStatus([string]$Message) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Write-Host $line
  Add-Content -LiteralPath $StartupLog -Value $line -Encoding UTF8
}

function Test-Health([string]$Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  }
  catch {
    return $false
  }
}

function Stop-ProcessTree($Process) {
  if (-not $Process) { return }
  try {
    if (-not $Process.HasExited) {
      & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
    }
  }
  catch { }
}

function Initialize-WebPortproxy {
  if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
    throw "WSL wurde nicht gefunden. Dieses Programm benoetigt WSL2 (Windows-Subsystem fuer Linux), um den lokalen Webserver zuverlaessig zu starten."
  }
  $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $PortproxyScript 2>&1
  foreach ($line in $output) { Write-StartupStatus "[portproxy] $line" }
  if ($LASTEXITCODE -ne 0) {
    Write-StartupStatus "Warnung: Die Portweiterleitung zu WSL konnte nicht eingerichtet werden. Der Webserver ist moeglicherweise nicht erreichbar."
  }
}

function Show-FailureDetails([string]$ErrorLog) {
  if (Test-Path -LiteralPath $ErrorLog) {
    $details = Get-Content -LiteralPath $ErrorLog -Tail 12 -ErrorAction SilentlyContinue
    if ($details) {
      Write-Host ""
      Write-Host ($details -join [Environment]::NewLine) -ForegroundColor Red
      Write-Host ""
    }
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $AppRoot "dist\server\index.js"))) {
  throw "Die kompilierten Programmdateien fehlen. Bitte SETUP-WINDOWS.bat ausfuehren."
}

Set-Content -LiteralPath $StartupLog -Value "$AppName - Startprotokoll" -Encoding UTF8
Initialize-WebPortproxy
$RunWebScriptWsl = ConvertTo-WslPath $RunWebScript

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  Write-StartupStatus "Startversuch $attempt von $MaxAttempts."

  $webProcess = Start-Process -FilePath "wsl.exe" -ArgumentList @("-d", "Ubuntu", "-u", "root", "--", "bash", $RunWebScriptWsl) -NoNewWindow -PassThru -RedirectStandardOutput $WebOutputLog -RedirectStandardError $WebErrorLog

  $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
  $ready = $false
  while ((Get-Date) -lt $deadline) {
    if (Test-Health $WebHealthUrl) { $ready = $true; break }
    if ($webProcess.HasExited) { break }
    Start-Sleep -Milliseconds 500
  }

  if ($ready) {
    Write-StartupStatus "$AppName ist bereit."
    if (-not $NoBrowser) {
      Start-Process $OpenUrl
    }
    while (-not $webProcess.HasExited) {
      Start-Sleep -Seconds 1
    }
    Write-StartupStatus "Die App wurde beendet."
    Show-FailureDetails $WebErrorLog
    Stop-ProcessTree $webProcess
    exit 1
  }

  Write-StartupStatus "Der Start hat das Zeitlimit ueberschritten oder ist fehlgeschlagen."
  Show-FailureDetails $WebErrorLog
  Stop-ProcessTree $webProcess
  Start-Sleep -Seconds 2
}

Write-StartupStatus "Die App konnte nach $MaxAttempts Versuchen nicht gestartet werden."
Write-Host "Bitte SETUP-WINDOWS.bat erneut ausfuehren." -ForegroundColor Yellow
Write-Host "Startprotokoll: $StartupLog"
exit 1
