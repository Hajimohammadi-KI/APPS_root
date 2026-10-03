param(
  [Parameter(Mandatory = $true)][string]$RuntimePath,
  [Parameter(Mandatory = $true)][string]$Entry,
  [Parameter(Mandatory = $true)][string]$WorkingDirectory,
  [Parameter(Mandatory = $true)][string]$StdoutPath,
  [Parameter(Mandatory = $true)][string]$StderrPath
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Path (Split-Path -Parent $StdoutPath) -Force | Out-Null
Set-Location -LiteralPath $WorkingDirectory
& $RuntimePath $Entry 1>> $StdoutPath 2>> $StderrPath
exit ($LASTEXITCODE ?? 0)
