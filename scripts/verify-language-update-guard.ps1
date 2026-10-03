Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
$output = Join-Path $workspace ('artifacts\language-update-guard\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $output -Force | Out-Null
$parseErrors = $null; $tokens = $null
$ast = [Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'update-installed-language-apps.ps1'), [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw 'Updater syntax failed' }
$definition = $ast.Find({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Assert-VerifiedInstaller' }, $true)
if (-not $definition) { throw 'Missing qualification gate' }
# Load only the pure file-hash/receipt guard. Never invoke the updater or setup.
. ([scriptblock]::Create($definition.Extent.Text))
$setup = Join-Path $output 'synthetic-setup.txt'; $payload = Join-Path $output 'synthetic-payload.txt'
[IO.File]::WriteAllText($setup, 'Synthetic fixture, not an executable')
[IO.File]::WriteAllText($payload, 'Synthetic fixture, not an archive')
$spec = @{ Name='Fixture'; Version='1' }
$receipt = @{ product='Fixture'; version='1'; setupSha256=(Get-FileHash $setup).Hash; payloadSha256=(Get-FileHash $payload).Hash; install='verified'; upgrade='verified'; startup='verified'; update='verified'; repair='verified'; uninstall='verified'; learnerDataPreserved=$true }
$checks = @()
Assert-VerifiedInstaller $spec $setup $payload @(@{}, $receipt)
$checks += 'Exact artifacts and complete lifecycle accepted; incomplete receipt ignored'
foreach ($change in @(@{startup='blocked'}, @{repair='not-run'}, @{upgrade='not-run'}, @{learnerDataPreserved=$false}, @{version='other'}, @{setupSha256=('0'*64)}, @{payloadSha256=('0'*64)})) {
  $altered = $receipt.Clone(); foreach ($key in $change.Keys) { $altered[$key]=$change[$key] }
  $rejected=$false
  try { Assert-VerifiedInstaller $spec $setup $payload @($altered) } catch { if ($_.Exception.Message -notlike 'No complete verified*') { throw }; $rejected=$true }
  if (-not $rejected) { throw 'Unqualified fixture was accepted' }
  $checks += ('Rejected ' + ($change.Keys -join ','))
}
[IO.File]::AppendAllText($payload, ' changed after verification')
$rejected=$false
try { Assert-VerifiedInstaller $spec $setup $payload @($receipt) } catch { if ($_.Exception.Message -notlike 'No complete verified*') { throw }; $rejected=$true }
if (-not $rejected) { throw 'Changed payload was accepted' }
$checks += 'Changed payload rejected by recomputed hash'
$report = @{ at=(Get-Date).ToUniversalTime().ToString('o'); status='passed'; scope='Qualification guard extracted from updater; synthetic non-executable files only; no setup or normal profile accessed'; checks=$checks }
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $output 'report.json') -Encoding UTF8
$report | ConvertTo-Json -Depth 5
Write-Output ('Evidence: ' + $output)
