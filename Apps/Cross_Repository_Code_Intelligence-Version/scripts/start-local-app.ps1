param(
  [int]$MaxAttempts = 3,
  [int]$StartupTimeoutSeconds = 75,
  [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$AppName = "Cross Repository Code Intelligence"
$AppRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$BunExecutable = Join-Path $AppRoot "node_modules\bun\bin\bun.exe"
$WebHealthUrl = "http://127.0.0.1:4312/api/state"
$ApiHealthUrl = "http://127.0.0.1:4313/v1/health"
$OpenUrl = "http://127.0.0.1:4312/"
$StartupLog = Join-Path $AppRoot "runtime-startup.log"
$WebOutputLog = Join-Path $AppRoot "runtime-web.log"
$WebErrorLog = Join-Path $AppRoot "runtime-web-error.log"
$ApiOutputLog = Join-Path $AppRoot "runtime-api.log"
$ApiErrorLog = Join-Path $AppRoot "runtime-api-error.log"

# The web server ("wrangler dev" / workerd) does not run natively on
# Windows on this machine -- it crashes immediately with a native
# std::terminate() inside workerd.exe, confirmed reproducible with this
# app's exact "start" command. It runs fine under WSL2 with the same
# source. So the web process is launched inside WSL instead, with a small
# relay bridging it back to the port Windows targets. The API has no such
# problem (plain Bun/Node, no workerd) and still runs natively below. See
# docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md and scripts/wsl/*.
$RunWebScript = Join-Path $AppRoot "scripts\wsl\run-web.sh"
$PortproxyScript = Join-Path $AppRoot "scripts\wsl\ensure-portproxy.ps1"

function ConvertTo-WslPath([string]$WindowsPath) {
  # Backslashes get silently eaten somewhere in the PowerShell -> wsl.exe ->
  # wslpath argument-passing chain (confirmed: "D:\APPS_root\..." arrives at
  # wslpath as "D:APPS_root..."). Forward slashes are accepted by Windows
  # path APIs and sidestep the ambiguity entirely.
  $forwardSlashPath = $WindowsPath.Replace('\', '/')
  $result = (& wsl.exe wslpath -a "$forwardSlashPath") 2>$null
  if (-not $result) {
    throw "Der Pfad konnte nicht für WSL umgewandelt werden: $WindowsPath"
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

function Get-AncestorProcessIds {
  $ids = [Collections.Generic.HashSet[int]]::new()
  $currentId = $PID
  while ($currentId -gt 0 -and $ids.Add($currentId)) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $currentId" -ErrorAction SilentlyContinue
    if (-not $process) { break }
    $currentId = [int]$process.ParentProcessId
  }
  return $ids
}

function Stop-StaleRuntimeProcesses {
  $escapedRoot = [Regex]::Escape($AppRoot)
  $protectedIds = Get-AncestorProcessIds
  $runtimeNames = @("bun.exe", "node.exe", "workerd.exe", "wrangler.exe", "esbuild.exe", "cmd.exe", "powershell.exe")

  for ($round = 0; $round -lt 4; $round++) {
    $targets = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object {
        -not $protectedIds.Contains([int]$_.ProcessId) -and
        (
          ($runtimeNames -contains $_.Name -and $_.CommandLine -and $_.CommandLine -match $escapedRoot) -or
          ($_.Name -eq "wsl.exe" -and $_.CommandLine -and $_.CommandLine -match "run-web\.sh")
        )
      }
    if (-not $targets) { return }
    foreach ($target in ($targets | Sort-Object ProcessId -Descending)) {
      Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 500
  }
}

function Initialize-WebPortproxy {
  if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
    throw "WSL wurde nicht gefunden. Dieses Programm benötigt WSL2 (Windows-Subsystem für Linux), um den lokalen Webserver zuverlässig zu starten."
  }
  $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $PortproxyScript 2>&1
  foreach ($line in $output) { Write-StartupStatus "[portproxy] $line" }
  if ($LASTEXITCODE -ne 0) {
    Write-StartupStatus "Warnung: Die Portweiterleitung zu WSL konnte nicht eingerichtet werden. Der Webserver ist möglicherweise nicht erreichbar."
  }
}

function Show-FailureDetails([string]$ServiceName, [string]$ErrorLog) {
  Write-StartupStatus "$ServiceName konnte nicht gestartet werden."
  if (Test-Path -LiteralPath $ErrorLog) {
    $details = Get-Content -LiteralPath $ErrorLog -Tail 12 -ErrorAction SilentlyContinue
    if ($details) {
      Write-Host ""
      Write-Host ($details -join [Environment]::NewLine) -ForegroundColor Red
      Write-Host ""
    }
  }
}

if (-not (Test-Path -LiteralPath $BunExecutable)) {
  throw "Bun wurde nicht gefunden. Bitte SETUP-WINDOWS.bat öffnen und Reparieren wählen."
}
if (-not (Test-Path -LiteralPath (Join-Path $AppRoot "dist\server\index.js")) -or
    -not (Test-Path -LiteralPath (Join-Path $AppRoot "apps\api\dist\main.js"))) {
  throw "Die kompilierten Programmdateien fehlen. Bitte SETUP-WINDOWS.bat öffnen und Reparieren wählen."
}

Set-Content -LiteralPath $StartupLog -Value "$AppName - Startprotokoll" -Encoding UTF8
Stop-StaleRuntimeProcesses
Initialize-WebPortproxy
$RunWebScriptWsl = ConvertTo-WslPath $RunWebScript
$AppRootWsl = ConvertTo-WslPath $AppRoot

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  Write-StartupStatus "Startversuch $attempt von $MaxAttempts."

  $apiProcess = Start-Process -FilePath $BunExecutable -ArgumentList @("run", "--cwd", "apps/api", "start") -WorkingDirectory $AppRoot -NoNewWindow -PassThru -RedirectStandardOutput $ApiOutputLog -RedirectStandardError $ApiErrorLog
  Start-Sleep -Milliseconds 500
  $webProcess = Start-Process -FilePath "wsl.exe" -ArgumentList @("-d", "Ubuntu", "-u", "root", "--", "bash", $RunWebScriptWsl, $AppRootWsl) -NoNewWindow -PassThru -RedirectStandardOutput $WebOutputLog -RedirectStandardError $WebErrorLog

  $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
  $ready = $false
  while ((Get-Date) -lt $deadline) {
    if ((Test-Health $WebHealthUrl) -and (Test-Health $ApiHealthUrl)) {
      $ready = $true
      break
    }
    if ($webProcess.HasExited -or $apiProcess.HasExited) { break }
    Start-Sleep -Milliseconds 500
  }

  if ($ready) {
    Write-StartupStatus "Web und API sind bereit."
    if (-not $NoBrowser) {
      Start-Process $OpenUrl
    }
    while (-not $webProcess.HasExited -and -not $apiProcess.HasExited) {
      Start-Sleep -Seconds 1
    }
    $failedService = if ($webProcess.HasExited) { "Web" } else { "API" }
    $failedLog = if ($webProcess.HasExited) { $WebErrorLog } else { $ApiErrorLog }
    Show-FailureDetails $failedService $failedLog
    Stop-ProcessTree $webProcess
    Stop-ProcessTree $apiProcess
    exit 1
  }

  if ($webProcess.HasExited) { Show-FailureDetails "Web" $WebErrorLog }
  if ($apiProcess.HasExited) { Show-FailureDetails "API" $ApiErrorLog }
  if (-not $webProcess.HasExited -and -not $apiProcess.HasExited) {
    Write-StartupStatus "Der Start hat das Zeitlimit überschritten."
  }
  Stop-ProcessTree $webProcess
  Stop-ProcessTree $apiProcess
  Start-Sleep -Seconds 2
}

Write-StartupStatus "Die App konnte nach $MaxAttempts Versuchen nicht gestartet werden."
Write-Host "Bitte öffne SETUP-WINDOWS.bat und wähle Reparieren." -ForegroundColor Yellow
Write-Host "Startprotokoll: $StartupLog"
exit 1
