param(
  [string]$OutputPath = 'D:\APPS_root\artifacts\article-renaming\status.png'
)

$ErrorActionPreference = 'Stop'
$roots = @(
  'D:\Bachelor-Thesis\02_Literature',
  'D:\Bachelor-Thesis\99_Archive\All Artikels\Recovered_Articles_2026-08-07'
)

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('ARTICLE RENAME STATUS')
$lines.Add((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))
$lines.Add('')

foreach ($root in $roots) {
  $lines.Add("ROOT: $root")
  if (-not (Test-Path -LiteralPath $root)) {
    $lines.Add('  MISSING ROOT')
    $lines.Add('')
    continue
  }

  $pdfs = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf')
  $tagged = @($pdfs | Where-Object { $_.Name -match '_(DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_' })
  $deep = @($pdfs | Where-Object { $_.Name -match '_DEEP_' })
  $untagged = @($pdfs | Where-Object { $_.Name -notmatch '_(DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_' })
  $lines.Add("  PDF count: $($pdfs.Count)")
  $lines.Add("  Tagged: $($tagged.Count)")
  $lines.Add("  DEEP: $($deep.Count)")
  $lines.Add("  Untagged: $($untagged.Count)")
  $lines.Add("  Guide exists: $(Test-Path -LiteralPath (Join-Path $root 'READING-GUIDE.md'))")
  $lines.Add('  DEEP files:')
  foreach ($file in ($deep | Sort-Object Name | Select-Object -First 20)) {
    $lines.Add("    $($file.Name)")
  }
  if ($untagged.Count -gt 0) {
    $lines.Add('  UNTAGGED files:')
    foreach ($file in ($untagged | Sort-Object Name | Select-Object -First 30)) {
      $lines.Add("    $($file.Name)")
    }
  }
  $lines.Add('')
}

$statusPath = 'D:\APPS_root\artifacts\article-renaming\latest-status.json'
$lines.Add("STATUS JSON EXISTS: $(Test-Path -LiteralPath $statusPath)")
if (Test-Path -LiteralPath $statusPath) {
  $lines.AddRange([string[]](Get-Content -LiteralPath $statusPath -ErrorAction SilentlyContinue))
}

$logPath = 'D:\APPS_root\artifacts\article-renaming\run-v4.log'
$lines.Add('')
$lines.Add("RUN LOG EXISTS: $(Test-Path -LiteralPath $logPath)")
if (Test-Path -LiteralPath $logPath) {
  $lines.Add('LAST LOG LINES:')
  $lines.AddRange([string[]](Get-Content -LiteralPath $logPath -Tail 30 -ErrorAction SilentlyContinue))
}

Add-Type -AssemblyName System.Drawing
$font = [System.Drawing.Font]::new('Consolas', 16)
$lineHeight = 24
$width = 2200
$height = [Math]::Max(1200, ($lines.Count + 4) * $lineHeight)
$bitmap = [System.Drawing.Bitmap]::new($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::White)
$brush = [System.Drawing.Brushes]::Black
$y = 20
foreach ($line in $lines) {
  $graphics.DrawString($line, $font, $brush, 20, $y)
  $y += $lineHeight
}

$directory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $directory -Force | Out-Null
$bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
$font.Dispose()
