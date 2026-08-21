$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$roots = @(
    'D:\Bachelor-Thesis\02_Literature',
    'D:\Bachelor-Thesis\99_Archive\All Artikels\Recovered_Articles_2026-08-07'
)

$artifactDir = 'D:\APPS_root\artifacts\article-renaming'
$manifestPath = Join-Path $artifactDir 'article-reading-tags-manifest.csv'
$summaryPath = Join-Path $artifactDir 'article-reading-tags-summary.json'
$successPath = Join-Path $artifactDir 'READING-TAGS-SUCCESS.txt'

$deepTags = [ordered]@{
    'R01' = 'DEEP_Read-Framework-Guidelines-Eval'
    'R06' = 'DEEP_Read-StaticSQL-Method-Eval'
    'R04' = 'DEEP_Read-Multilang-Method-Limits'
    'R02' = 'DEEP_Read-CPG-Model-Construction'
    'R09' = 'DEEP_Read-MultiRepo-Graph-Eval'
    'R07' = 'DEEP_Read-Taxonomy-Limits'
    'R15' = 'DEEP_Read-KG-QA-Pipeline-Eval'
    'R29' = 'DEEP_Read-Dataset-Metrics-Threats'
}

foreach ($root in $roots) {
    if (-not (Test-Path -LiteralPath $root -PathType Container)) {
        throw "Article folder not found: $root"
    }
}

New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null

function Get-ReadingTag {
    param([Parameter(Mandatory)][string]$BaseName)

    foreach ($entry in $deepTags.GetEnumerator()) {
        $escapedId = [regex]::Escape($entry.Key)
        if ($BaseName -match "(?i)(?:^|[_\-\s])$escapedId(?:[_\-\s]|$)") {
            return $entry.Value
        }
    }

    if ($BaseName -match '(?i)OPTIONAL') {
        return 'OPTIONAL_Read-Abstract-Conclusion-Relevant'
    }
    if ($BaseName -match '(?i)(SURVEY|REVIEW)') {
        return 'REVIEW_Read-Taxonomy-Comparison-Limits'
    }
    if ($BaseName -match '(?i)(CORE|IMPORTANT|STRATEGIC)') {
        return 'TARGET_Read-Method-Eval-Limits'
    }
    return 'RELATED_Read-Abstract-Method-Conclusion'
}

function Remove-AuthoritativeReadingTag {
    param([Parameter(Mandatory)][string]$BaseName)
    return [regex]::Replace(
        $BaseName,
        '__(?:DEEP|TARGET|REVIEW|RELATED|OPTIONAL)_Read-[A-Za-z0-9-]+$',
        '',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
}

$records = [System.Collections.Generic.List[object]]::new()
$allFiles = foreach ($root in $roots) {
    Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf'
}

foreach ($file in $allFiles) {
    $cleanBase = Remove-AuthoritativeReadingTag -BaseName $file.BaseName
    $tag = Get-ReadingTag -BaseName $cleanBase
    $newName = "$cleanBase`__$tag$($file.Extension)"
    $targetPath = Join-Path $file.DirectoryName $newName
    $status = 'Unchanged'

    if (-not [string]::Equals($file.FullName, $targetPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        if (Test-Path -LiteralPath $targetPath) {
            throw "Rename collision: $targetPath"
        }
        Rename-Item -LiteralPath $file.FullName -NewName $newName
        $status = 'Renamed'
    }

    $records.Add([pscustomobject]@{
        Root = ($roots | Where-Object { $file.FullName.StartsWith($_, [System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1)
        OriginalPath = $file.FullName
        CurrentPath = $targetPath
        ReadingTag = $tag
        ReadingDepth = ($tag -split '_')[0]
        Status = $status
    })
}

$guide = @'
# راهنمای مطالعهٔ مقاله‌ها

نام فایل‌ها اکنون نوع و عمق مطالعه را در انتهای نام نشان می‌دهد. شماره و پوشهٔ مقاله تغییر نکرده است.

## معنی برچسب‌ها

- `DEEP_Read-...` (مطالعهٔ عمیق / TIEF): مسئله، روش، نتایج، ارزیابی، محدودیت‌ها و ارتباط با پایان‌نامه را دقیق بخوان. از مقاله یادداشت پنج‌بخشی Problem / Method / Result / Limitation / Thesis connection بساز.
- `TARGET_Read-Method-Eval-Limits`: Abstract را بخوان؛ سپس Method، Evaluation و Limitations را هدفمند بررسی کن.
- `REVIEW_Read-Taxonomy-Comparison-Limits`: دسته‌بندی‌ها، جدول‌های مقایسه، خلأ پژوهشی و محدودیت‌ها را استخراج کن؛ لازم نیست تمام جزئیات فنی را خط‌به‌خط بخوانی.
- `RELATED_Read-Abstract-Method-Conclusion`: Abstract، نمای کلی Method و Conclusion را بخوان و فقط بخش مرتبط با سؤال پایان‌نامه را عمیق‌تر کن.
- `OPTIONAL_Read-Abstract-Conclusion-Relevant`: Abstract و Conclusion را بخوان؛ فقط در صورت ارتباط مستقیم، بخش لازم را ادامه بده.

## ترتیب هشت مقالهٔ عمیق

1. `R01` — Hevner 2004: Framework، Seven Guidelines و Evaluation
2. `R06` — Nagy 2015: Static SQL analysis، روش و ارزیابی
3. `R04` — Shatnawi 2019: تحلیل چندزبانه، پیوندها و محدودیت‌ها
4. `R02` — Yamaguchi 2014: Code Property Graph، مدل و ساخت گراف
5. `R09` — Usai / LogicLens: گراف چندمخزنی و ارزیابی
6. `R07` — Alshemaimri: taxonomy و محدودیت‌های database code
7. `R15` — Abedu: Knowledge Graph + Repository QA pipeline
8. `R29` — Peng / SWE-QA: طراحی dataset، معیارها و threats

## خروجی مطالعهٔ عمیق

برای هر مقاله بدون نگاه‌کردن به متن پاسخ بده:

1. Problem: مسئله چیست؟
2. Method: دقیقاً چه کاری انجام می‌دهد؟
3. Result: چه نتیجه‌ای می‌گیرد؟
4. Limitation: کجا محدود است؟
5. Thesis connection: چه چیزی برای پایان‌نامهٔ من قابل استفاده یا مقایسه است؟
'@

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
foreach ($root in $roots) {
    [System.IO.File]::WriteAllText((Join-Path $root 'READING-GUIDE.md'), $guide, $utf8NoBom)
}

$records | Sort-Object Root, CurrentPath | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8

$currentPdfs = foreach ($root in $roots) {
    Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf'
}
$untagged = @($currentPdfs | Where-Object {
    $_.BaseName -notmatch '__(?:DEEP|TARGET|REVIEW|RELATED|OPTIONAL)_Read-[A-Za-z0-9-]+$'
})
if ($untagged.Count -ne 0) {
    throw "Validation failed: $($untagged.Count) PDFs do not have a reading tag."
}

$duplicateNames = @($currentPdfs | Group-Object FullName | Where-Object Count -gt 1)
if ($duplicateNames.Count -ne 0) {
    throw "Validation failed: duplicate full paths were detected."
}

$missingDeepIds = [System.Collections.Generic.List[string]]::new()
foreach ($id in $deepTags.Keys) {
    $escapedId = [regex]::Escape($id)
    $matches = @($currentPdfs | Where-Object {
        $_.BaseName -match "(?i)(?:^|[_\-\s])$escapedId(?:[_\-\s]|$)" -and
        $_.BaseName -match '__DEEP_Read-'
    })
    if ($matches.Count -eq 0) {
        $missingDeepIds.Add($id)
    }
}
if ($missingDeepIds.Count -ne 0) {
    throw "Validation failed: deep-reading IDs not found: $($missingDeepIds -join ', ')"
}

$guideCount = @($roots | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'READING-GUIDE.md') }).Count
if ($guideCount -ne 2) {
    throw "Validation failed: expected two reading guides, found $guideCount."
}

$counts = [ordered]@{
    TotalPdfs = $currentPdfs.Count
    Renamed = @($records | Where-Object Status -eq 'Renamed').Count
    Unchanged = @($records | Where-Object Status -eq 'Unchanged').Count
    Deep = @($currentPdfs | Where-Object BaseName -match '__DEEP_Read-').Count
    Target = @($currentPdfs | Where-Object BaseName -match '__TARGET_Read-').Count
    Review = @($currentPdfs | Where-Object BaseName -match '__REVIEW_Read-').Count
    Related = @($currentPdfs | Where-Object BaseName -match '__RELATED_Read-').Count
    Optional = @($currentPdfs | Where-Object BaseName -match '__OPTIONAL_Read-').Count
    Guides = $guideCount
    Untagged = $untagged.Count
    Collisions = 0
}

$counts | ConvertTo-Json | Set-Content -LiteralPath $summaryPath -Encoding UTF8

$success = @(
    'STATUS=SUCCESS'
    'ROOTS=2'
    'ALL_PDFS_TAGGED=true'
    'COLLISIONS=0'
    "GUIDES=$guideCount"
    "TOTAL_PDFS=$($counts.TotalPdfs)"
    "RENAMED=$($counts.Renamed)"
    "DEEP=$($counts.Deep)"
    "TARGET=$($counts.Target)"
    "REVIEW=$($counts.Review)"
    "RELATED=$($counts.Related)"
    "OPTIONAL=$($counts.Optional)"
)
[System.IO.File]::WriteAllLines($successPath, $success, $utf8NoBom)

Write-Output "Article reading tags completed. PDFs: $($counts.TotalPdfs); renamed: $($counts.Renamed)."
