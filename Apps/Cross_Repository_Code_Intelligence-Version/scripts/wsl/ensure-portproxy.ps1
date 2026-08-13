# Ensures Windows can reach this app's WSL-hosted web relay: a firewall
# rule allowing the port inbound, and a netsh portproxy rule forwarding
# 127.0.0.1:4312 -> <current WSL VM IP>:4312. See tcp-relay.mjs and
# docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md for why this is needed.
#
# The WSL VM's IP is DHCP-assigned and can change across WSL restarts, so
# this re-checks the current IP every run. But changing the portproxy rule
# requires Administrator rights (one UAC prompt), which is disruptive on
# every single app launch -- so this first checks, as a normal user,
# whether the existing rule already points at the right place, and only
# elevates when something actually needs to change.

$ErrorActionPreference = "Stop"
$Port = 4312
$RuleName = "Cross Repository Code Intelligence - WSL2 Relay"

$wslIp = (wsl -d Ubuntu -u root -- hostname -I 2>$null)
if ($wslIp) { $wslIp = $wslIp.Trim().Split(" ")[0] }
if (-not $wslIp) {
  Write-Error "Could not determine WSL VM IP -- is the Ubuntu distro running? Try 'wsl -d Ubuntu' once first."
  exit 1
}

function Test-AlreadyConfigured {
  $rule = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
  if (-not $rule) { return $false }
  $existing = netsh interface portproxy show v4tov4 | Select-String "127\.0\.0\.1\s+$Port\s+$([Regex]::Escape($wslIp))\s+$Port"
  return [bool]$existing
}

if (Test-AlreadyConfigured) {
  Write-Output "OK: portproxy already correct for $wslIp"
  exit 0
}

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

if (-not (Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Action Allow `
    -Protocol TCP -LocalPort $Port -Profile Any | Out-Null
}

netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=127.0.0.1 | Out-Null
netsh interface portproxy add v4tov4 listenport=$Port listenaddress=127.0.0.1 connectport=$Port connectaddress=$wslIp | Out-Null

Write-Output "OK: portproxy pointed at $wslIp for port $Port"
