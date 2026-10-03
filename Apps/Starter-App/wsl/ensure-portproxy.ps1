param(
  [string]$PortsCsv = "4312,4323"
)

$ErrorActionPreference = "Stop"
$AllowedPorts = @(4312, 4323)
$Ports = @($PortsCsv.Split(",", [StringSplitOptions]::RemoveEmptyEntries) | ForEach-Object { [int]$_.Trim() })
if ($Ports.Count -eq 0 -or @($Ports | Where-Object { $_ -notin $AllowedPorts }).Count -gt 0) {
  throw "Unsupported portproxy request: $PortsCsv"
}
$RuleName = "WSL2 Local Apps (Tracker/Settings)"

function Test-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

$wslIp = (wsl -d Ubuntu -u root -- hostname -I 2>$null)
if ($wslIp) { $wslIp = $wslIp.Trim().Split(" ")[0] }
if (-not $wslIp) { throw "Could not determine the Ubuntu WSL address." }

$proxyTable = (netsh interface portproxy show v4tov4 | Out-String)
$escapedWslIp = [regex]::Escape($wslIp)
$allCurrent = $true
foreach ($port in $Ports) {
  $mappingPattern = "(?m)^\s*127\.0\.0\.1\s+$port\s+$escapedWslIp\s+$port\s*$"
  if ($proxyTable -notmatch $mappingPattern) { $allCurrent = $false; break }
}
if ($allCurrent) {
  Write-Output "OK: existing portproxy already points at $wslIp for ports $($Ports -join ', ')"
  exit 0
}

if (-not (Test-Admin)) {
  $proc = Start-Process powershell -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$($MyInvocation.MyCommand.Path)`"", "-PortsCsv", "`"$PortsCsv`""
  ) -Verb RunAs -Wait -PassThru
  exit $proc.ExitCode
}

if (-not (Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Ports -Profile Any | Out-Null
}
foreach ($port in $Ports) {
  netsh interface portproxy delete v4tov4 listenport=$port listenaddress=127.0.0.1 | Out-Null
  netsh interface portproxy add v4tov4 listenport=$port listenaddress=127.0.0.1 connectport=$port connectaddress=$wslIp | Out-Null
}
Write-Output "OK: portproxy pointed at $wslIp for ports $($Ports -join ', ')"
