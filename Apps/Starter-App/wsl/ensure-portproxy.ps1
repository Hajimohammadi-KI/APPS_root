# Ensures Windows can reach the WSL-hosted Tracker/PDF Reader/Settings
# relays: a firewall rule allowing the ports inbound, and a netsh portproxy
# rule forwarding 127.0.0.1:<port> -> <current WSL VM IP>:<port>.
#
# Why this is needed at all -- and why it's a relay port, not the app's own
# server port -- is explained in tcp-relay.mjs and
# docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md.
#
# The WSL VM's IP is DHCP-assigned and can change across WSL restarts, so
# this re-checks and re-applies the portproxy target every time it runs
# rather than assuming a prior rule is still correct.
#
# Both steps require Administrator rights. If not already elevated, this
# re-launches itself elevated (one UAC prompt) and waits for it to finish.
# Ports are fixed rather than parameterized: passing an int[] through a
# self-relaunch via `-File` round-trips as a single comma-joined string,
# which PowerShell does not reliably re-split back into an array.

$ErrorActionPreference = "Stop"
$Ports = @(4312, 4313, 4322, 4323)
$RuleName = "WSL2 Local Apps (Tracker/PDF/Settings)"

function Test-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
  $scriptPath = $MyInvocation.MyCommand.Path
  $proc = Start-Process powershell -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$scriptPath`""
  ) -Verb RunAs -Wait -PassThru
  exit $proc.ExitCode
}

$wslIp = (wsl -d Ubuntu -u root -- hostname -I 2>$null)
if ($wslIp) { $wslIp = $wslIp.Trim().Split(" ")[0] }
if (-not $wslIp) {
  Write-Error "Could not determine WSL VM IP -- is the Ubuntu distro running? Try 'wsl -d Ubuntu' once first."
  exit 1
}

if (-not (Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Action Allow `
    -Protocol TCP -LocalPort $Ports -Profile Any | Out-Null
}

foreach ($port in $Ports) {
  netsh interface portproxy delete v4tov4 listenport=$port listenaddress=127.0.0.1 | Out-Null
  netsh interface portproxy add v4tov4 listenport=$port listenaddress=127.0.0.1 connectport=$port connectaddress=$wslIp | Out-Null
}

Write-Output "OK: portproxy pointed at $wslIp for ports $($Ports -join ', ')"
