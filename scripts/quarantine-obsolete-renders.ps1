Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$temporary = Join-Path $workspace '.codex-tmp'
$quarantine = Join-Path $workspace 'DELETE\20260906-obsolete-renders'
# These old generated output folders have no references in active source/docs.
# Keep the three folders referenced by the surviving render helpers in place.
$names = @('proposal-final-render','proposal-original-render','proposal-revised-render','proposal-v3-render','proposal-v5-final-render','proposal-v5-final2-render','proposal-v5-final3-render','proposal-v5-render')
if (Test-Path -LiteralPath $quarantine) { throw 'A quarantine already exists; inspect its manifest instead of overwriting it.' }
$rows = [Collections.Generic.List[object]]::new()
$moves = @()
foreach ($name in $names) {
  $source = [IO.Path]::GetFullPath((Join-Path $temporary $name))
  $destination = [IO.Path]::GetFullPath((Join-Path $quarantine $name))
  if (-not $source.StartsWith($temporary + '\', [StringComparison]::OrdinalIgnoreCase) -or -not $destination.StartsWith($quarantine + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Path escapes approved workspace folders.' }
  $item = Get-Item -LiteralPath $source
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Source is a reparse point.' }
  $children = @(Get-ChildItem -LiteralPath $source -Recurse -Force)
  if (@($children | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'Refusing a directory containing reparse points.' }
  foreach ($file in @($children | Where-Object { -not $_.PSIsContainer })) {
    $suffix = $file.FullName.Substring($source.Length).TrimStart('\')
    $rows.Add([pscustomobject]@{ original=$file.FullName.Substring($workspace.Length + 1); destination=(Join-Path $destination $suffix).Substring($workspace.Length + 1); bytes=$file.Length; sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant() })
  }
  $moves += [pscustomobject]@{source=$source;destination=$destination}
}
New-Item -ItemType Directory -Path $quarantine | Out-Null
$manifest = Join-Path $quarantine 'manifest.json'
@{at=(Get-Date).ToUniversalTime().ToString('o');status='prepared';rows=@($rows)} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifest -Encoding UTF8
foreach ($move in $moves) { Move-Item -LiteralPath $move.source -Destination $move.destination }
foreach ($row in $rows) {
  if (Test-Path -LiteralPath (Join-Path $workspace $row.original)) { throw 'Original unexpectedly remains.' }
  if ((Get-FileHash -LiteralPath (Join-Path $workspace $row.destination) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $row.sha256) { throw 'Quarantine hash mismatch.' }
}
$report = @{at=(Get-Date).ToUniversalTime().ToString('o');status='verified';directories=$moves.Count;files=$rows.Count;bytes=($rows | Measure-Object bytes -Sum).Sum;rows=@($rows)}
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifest -Encoding UTF8
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $workspace 'docs/CLEANUP-MANIFEST-2026-09-06.json') -Encoding UTF8
@'
These are generated intermediate render outputs, moved reversibly rather than deleted.
Original thesis files were not touched. Paths and SHA-256 values are in manifest.json.
To restore, close related render tools, verify each hash, and move each folder back
to its original .codex-tmp location only if that destination does not already exist.
Do not overwrite a newly generated folder.
'@ | Set-Content -LiteralPath (Join-Path $quarantine 'RESTORE.txt') -Encoding UTF8
[pscustomobject]@{status='verified';folder=$quarantine;directories=$moves.Count;files=$rows.Count;bytes=$report.bytes} | ConvertTo-Json
