$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$roots = @(
  'D:\Bachelor-Thesis\02_Literature',
  'D:\Bachelor-Thesis\99_Archive\All Artikels\Recovered_Articles_2026-08-07'
)
$artifactDir = 'D:\APPS_root\artifacts\article-renaming'
New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null

function Test-RCode([string]$name, [string]$code) {
  return $name -match "(^|[_\-\s])$code([_\-\s]|$)"
}

function Get-ReadingTag([string]$name) {
  if ((Test-RCode $name 'R01') -or $name -match 'Hevner.*Design.Science') { return 'DEEP_Framework-Guidelines-Evaluation' }
  if ((Test-RCode $name 'R06') -or $name -match 'Nagy|Where.Was.This.SQL') { return 'DEEP_StaticSQL-Method-Evaluation' }
  if ((Test-RCode $name 'R04') -or $name -match 'Shatnawi|Multilanguage') { return 'DEEP_Multilanguage-Method-Limits' }
  if ((Test-RCode $name 'R02') -or $name -match 'Yamaguchi|Code.Property.Graph') { return 'DEEP_CPG-Model-Construction' }
  if ((Test-RCode $name 'R09') -or $name -match 'Usai|LogicLens') { return 'DEEP_MultiRepo-Graph-Evaluation' }
  if ((Test-RCode $name 'R07') -or $name -match 'Alshemaimri|Problematic.Database') { return 'DEEP_Taxonomy-Limits' }
  if ((Test-RCode $name 'R15') -or $name -match 'Abedu') { return 'DEEP_KG-QA-Pipeline-Evaluation' }
  if ((Test-RCode $name 'R29') -or $name -match 'Peng.*SWE.QA|SWE.QA') { return 'DEEP_Dataset-Metrics-Threats' }
  if ((Test-RCode $name 'R30') -or $name -match 'CoReQA|Chen') { return 'TARGET_Data-Metrics-Threats' }
  if ($name -match 'OPTIONAL') { return 'OPTIONAL_Abstract-Conclusion' }
  if ($name -match 'SUPPORT') { return 'RELATED_Abstract-Method-Conclusion' }
  if ($name -match 'survey|taxonomy|systematic.review') { return 'TARGET_Taxonomy-Limits' }
  if ($name -match 'evaluation|dataset|benchmark|metric|question') { return 'TARGET_Data-Metrics-Threats' }
  if ($name -match 'retrieval|RAG|search|graph|query|answer') { return 'TARGET_Method-Evaluation' }
  return 'REVIEW_Abstract-Method-Conclusion'
}

function Get-NewLeafName([System.IO.FileInfo]$file) {
  $base = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
  $prefix = ''
  $rest = $base
  if ($base -match '^(?<prefix>(?:\d{1,3}|R\d{2}(?:_W\d+(?:-\d+)?)?)[ _-]+)(?<rest>.+)$') {
    $prefix = $Matches.prefix
    $rest = $Matches.rest
  }
  $rest = $rest -replace '^(?:DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_[A-Za-z0-9\-]+__', ''
  $tag = Get-ReadingTag $base
  return [pscustomobject]@{ Name = "$prefix$tag`__$rest.pdf"; Tag = $tag }
}

$before = @{}
$plan = [System.Collections.Generic.List[object]]::new()
foreach ($root in $roots) {
  if (-not (Test-Path -LiteralPath $root -PathType Container)) { throw "Missing root: $root" }
  $files = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf')
  $before[$root] = $files.Count
  foreach ($file in $files) {
    $new = Get-NewLeafName $file
    $target = Join-Path $file.DirectoryName $new.Name
    $plan.Add([pscustomobject]@{
      Root = $root
      OldPath = $file.FullName
      OldName = $file.Name
      NewPath = $target
      NewName = $new.Name
      Tag = $new.Tag
      Status = if ($file.FullName -ceq $target) { 'Unchanged' } else { 'Planned' }
    })
  }
}

$collisions = $plan | Group-Object { $_.NewPath.ToLowerInvariant() } | Where-Object Count -gt 1
if ($collisions) { throw "Target filename collision detected." }
foreach ($item in $plan | Where-Object Status -eq 'Planned') {
  if ((Test-Path -LiteralPath $item.NewPath) -and ($item.OldPath -ine $item.NewPath)) {
    throw "Target already exists: $($item.NewPath)"
  }
}

foreach ($item in $plan | Where-Object Status -eq 'Planned') {
  Move-Item -LiteralPath $item.OldPath -Destination $item.NewPath
  $item.Status = 'Renamed'
}

$guide = @'
# راهنمای خواندن مقاله‌ها

برچسب ابتدای نام فایل مشخص می‌کند مقاله را چگونه بخوانید. شمارهٔ اولیهٔ فایل، ترتیب مطالعه است.

## DEEP

مقالهٔ پایه است و باید عمیق خوانده شود. بخش‌های Method / Approach / Evaluation را دقیق بخوانید و این پنج خروجی را بنویسید:

1. Problem — مسئله چیست؟
2. Method — دقیقاً چه روشی اجرا شده است؟
3. Result — چه نتیجه‌ای به دست آمده است؟
4. Limitation — محدودیت مهم چیست؟
5. Thesis connection — چه چیزی برای پایان‌نامهٔ من قابل استفاده یا مقایسه است؟

عبارت بعد از DEEP بخش‌های دارای اولویت را نشان می‌دهد؛ مثلاً `DEEP_CPG-Model-Construction` یعنی مدل CPG و نحوهٔ ساخت گراف را دقیق بخوانید.

## TARGET

فقط بخش‌های نوشته‌شده در نام فایل را هدفمند بخوانید؛ مثلاً `TARGET_Method-Evaluation` یعنی Abstract را سریع مرور کنید و Method و Evaluation را دقیق‌تر بخوانید.

## RELATED

Abstract، بخش مرتبط از Method و Conclusion را بخوانید. هدف، قرار دادن مقاله در Related Work و شناخت تفاوت آن با پروژه است.

## REVIEW

Abstract، Method و Conclusion را مرور کنید. فقط اگر ارتباط مستقیمی با سؤال پژوهش پیدا شد، آن را به مطالعهٔ عمیق ارتقا دهید.

## OPTIONAL

فعلاً فقط Abstract و Conclusion را بخوانید. جزئیات برای Future Work یا زمانی است که هستهٔ baseline کامل شده باشد.

## یادداشت کوتاه استاندارد

برای هر مقاله یک یادداشت پنج‌خطی با Problem، Method، Result، Limitation و Thesis connection بسازید. برای مقاله‌های DEEP علاوه بر این یادداشت، شکل pipeline، دادهٔ ورودی/خروجی و روش ارزیابی را نیز استخراج کنید.
'@

foreach ($root in $roots) {
  $guidePath = Join-Path $root 'READING-GUIDE.md'
  [System.IO.File]::WriteAllText($guidePath, $guide, [System.Text.UTF8Encoding]::new($false))
}

$after = @{}
foreach ($root in $roots) { $after[$root] = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf').Count }

$allCurrent = @($roots | ForEach-Object { Get-ChildItem -LiteralPath $_ -Recurse -File -Filter '*.pdf' })
$untagged = @($allCurrent | Where-Object { $_.Name -notmatch '(?:^|[ _-])(?:DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_[A-Za-z0-9\-]+__' })
$deepCodes = @('R01','R06','R04','R02','R09','R07','R15','R29')
$missingDeep = @($deepCodes | Where-Object { $code = $_; -not ($allCurrent | Where-Object { (Test-RCode $_.Name $code) -and $_.Name -match 'DEEP_' }) })
$countMismatch = @($roots | Where-Object { $before[$_] -ne $after[$_] })
$ok = ($untagged.Count -eq 0 -and $missingDeep.Count -eq 0 -and $countMismatch.Count -eq 0)

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$manifest = Join-Path $artifactDir "article-renaming-$stamp.csv"
$plan | Select-Object Root,OldName,NewName,Tag,Status | Export-Csv -LiteralPath $manifest -NoTypeInformation -Encoding UTF8
$status = [ordered]@{
  success = $ok
  timestamp = $stamp
  roots = @($roots | ForEach-Object { [ordered]@{ path=$_; before=$before[$_]; after=$after[$_] } })
  renamed = @($plan | Where-Object Status -eq 'Renamed').Count
  unchanged = @($plan | Where-Object Status -eq 'Unchanged').Count
  deepFiles = @($allCurrent | Where-Object Name -match 'DEEP_').Count
  untagged = $untagged.Count
  missingDeepCodes = $missingDeep
  manifest = $manifest
}
$statusPath = Join-Path $artifactDir 'latest-status.json'
[System.IO.File]::WriteAllText($statusPath, ($status | ConvertTo-Json -Depth 6), [System.Text.UTF8Encoding]::new($false))
Get-ChildItem -LiteralPath $artifactDir -File -Filter 'SUCCESS__*.marker' | Remove-Item -Force
if ($ok) {
  $r1 = $after[$roots[0]]; $r2 = $after[$roots[1]]; $renamed = $status.renamed; $deep = $status.deepFiles
  New-Item -ItemType File -Path (Join-Path $artifactDir "SUCCESS__R1-$r1`__R2-$r2`__DEEP-$deep`__RENAMED-$renamed.marker") | Out-Null
} else {
  throw "Verification failed. See $statusPath"
}
