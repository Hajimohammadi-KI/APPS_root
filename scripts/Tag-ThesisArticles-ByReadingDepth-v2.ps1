$ErrorActionPreference = 'Stop'

$roots = @(
    'D:\Bachelor-Thesis\02_Literature',
    'D:\Bachelor-Thesis\99_Archive\All Artikels\Recovered_Articles_2026-08-07'
)

$deep = @{
    'R01' = 'TIEF-DEEP_Read-Framework-Guidelines-Eval'
    'R06' = 'TIEF-DEEP_Read-StaticSQL-Method-Eval'
    'R04' = 'TIEF-DEEP_Read-Multilang-Method-Limits'
    'R02' = 'TIEF-DEEP_Read-CPG-Model-Construction'
    'R09' = 'TIEF-DEEP_Read-MultiRepo-Graph-Eval'
    'R07' = 'TIEF-DEEP_Read-Taxonomy-Limits'
    'R15' = 'TIEF-DEEP_Read-KG-QA-Pipeline-Eval'
    'R29' = 'TIEF-DEEP_Read-Dataset-Metrics-Threats'
}

$artifactRoot = 'D:\APPS_root\artifacts\article-renaming'
New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null

$guide = @'
# راهنمای خواندن مقاله‌ها

نام هر PDF شامل نوع مطالعه و بخش‌های مهم آن است. شمارهٔ ابتدای فایل ترتیب مطالعه را نشان می‌دهد و تغییر نکرده است.

## معنی برچسب‌ها

- `TIEF-DEEP`: مطالعهٔ عمیق. Problem، Method/Approach، Result، Evaluation، Limitation و ارتباط با پایان‌نامه را استخراج کن. در پایان بدون نگاه‌کردن، پنج پاسخ کوتاه بنویس: مسئله، روش، نتیجه، محدودیت و کاربرد برای پایان‌نامه.
- `TARGET`: Abstract را بخوان، Method و Evaluation را با دقت بررسی کن و محدودیت‌های قابل مقایسه با پروژه را یادداشت کن.
- `REVIEW`: Taxonomy، مقایسهٔ روش‌ها، شکاف‌های پژوهشی و Limitations را استخراج کن؛ لازم نیست تمام جزئیات مثال‌ها را بخوانی.
- `RELATED`: Abstract، نمای کلی Method و Conclusion را بخوان؛ فقط بخش مرتبط با سؤال پایان‌نامه را عمیق‌تر بررسی کن.
- `OPTIONAL`: فقط Abstract و Conclusion و یک بخش کاملاً مرتبط را بخوان؛ در صورت نداشتن ارتباط مستقیم متوقف شو.

## روش ثابت یادداشت‌برداری

برای هر مقاله این پنج عنوان را پر کن:

1. Problem — مسئله چیست؟
2. Method — دقیقاً چه روشی اجرا شده است؟
3. Result — چه نتیجه‌ای به دست آمده است؟
4. Limitation — روش کجا محدود است؟
5. Thesis connection — چه چیزی را در پایان‌نامه استفاده یا مقایسه می‌کنم؟

پس از مطالعه، PDF و یادداشت‌ها را ببند و پاسخ‌ها را از حافظه به فارسی ساده، آلمانی ساده و در صورت نیاز انگلیسی علمی بازگو کن.
'@

$manifest = [System.Collections.Generic.List[object]]::new()
$before = @{}

foreach ($root in $roots) {
    if (-not (Test-Path -LiteralPath $root -PathType Container)) {
        throw "Root not found: $root"
    }

    $pdfs = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf')
    $before[$root] = $pdfs.Count

    foreach ($pdf in $pdfs) {
        $base = $pdf.BaseName
        $cleanBase = $base -replace '__(?:TIEF-DEEP|DEEP|TARGET|REVIEW|RELATED|OPTIONAL)_Read-[A-Za-z0-9-]+$', ''
        $match = [regex]::Match($cleanBase, '(?:^|_)R(?<id>\d{2})(?:_|$)', 'IgnoreCase')
        $rid = if ($match.Success) { 'R' + $match.Groups['id'].Value } else { '' }

        if ($rid -and $deep.ContainsKey($rid)) {
            $tag = $deep[$rid]
        }
        elseif ($cleanBase -match '(?i)OPTIONAL') {
            $tag = 'OPTIONAL_Read-Abstract-Conclusion-Relevant'
        }
        elseif ($cleanBase -match '(?i)SURVEY|REVIEW') {
            $tag = 'REVIEW_Read-Taxonomy-Comparison-Limits'
        }
        elseif ($cleanBase -match '(?i)CORE|IMPORTANT|STRATEGIC') {
            $tag = 'TARGET_Read-Method-Eval-Limits'
        }
        else {
            $tag = 'RELATED_Read-Abstract-Method-Conclusion'
        }

        $newName = $cleanBase + '__' + $tag + $pdf.Extension
        $newPath = Join-Path $pdf.DirectoryName $newName

        if ($pdf.FullName -ne $newPath) {
            if (Test-Path -LiteralPath $newPath) {
                throw "Rename collision: $newPath"
            }
            Rename-Item -LiteralPath $pdf.FullName -NewName $newName
        }

        $manifest.Add([pscustomobject]@{
            Root = $root
            ResearchId = $rid
            ReadingClass = ($tag -split '_Read-')[0]
            OldPath = $pdf.FullName
            NewPath = $newPath
            Instruction = ($tag -replace '^[^_]+_Read-', '')
        })
    }

    Set-Content -LiteralPath (Join-Path $root 'READING-GUIDE.md') -Value $guide -Encoding UTF8
}

$after = @{}
foreach ($root in $roots) {
    $pdfs = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf')
    $after[$root] = $pdfs.Count
    if ($before[$root] -ne $after[$root]) {
        throw "PDF count changed in $root: before=$($before[$root]), after=$($after[$root])"
    }
    $untagged = @($pdfs | Where-Object { $_.BaseName -notmatch '__(?:TIEF-DEEP|TARGET|REVIEW|RELATED|OPTIONAL)_Read-[A-Za-z0-9-]+$' })
    if ($untagged.Count -gt 0) {
        throw "Untagged PDFs remain in $root: $($untagged.Count)"
    }
}

$missingDeep = @()
foreach ($rid in $deep.Keys) {
    if (-not ($manifest | Where-Object { $_.ResearchId -eq $rid -and $_.ReadingClass -eq 'TIEF-DEEP' })) {
        $missingDeep += $rid
    }
}
if ($missingDeep.Count -gt 0) {
    throw "Deep-read IDs not found: $($missingDeep -join ', ')"
}

$manifestPath = Join-Path $artifactRoot 'article-reading-tags-manifest.csv'
$manifest | Sort-Object Root, NewPath | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8

$summary = [pscustomobject]@{
    status = 'SUCCESS'
    createdAt = (Get-Date).ToString('o')
    roots = @($roots | ForEach-Object {
        [pscustomobject]@{
            path = $_
            pdfCountBefore = $before[$_]
            pdfCountAfter = $after[$_]
            guide = (Join-Path $_ 'READING-GUIDE.md')
        }
    })
    totalPdfs = ($after.Values | Measure-Object -Sum).Sum
    tiefDeepFiles = @($manifest | Where-Object ReadingClass -eq 'TIEF-DEEP').Count
    targetFiles = @($manifest | Where-Object ReadingClass -eq 'TARGET').Count
    reviewFiles = @($manifest | Where-Object ReadingClass -eq 'REVIEW').Count
    relatedFiles = @($manifest | Where-Object ReadingClass -eq 'RELATED').Count
    optionalFiles = @($manifest | Where-Object ReadingClass -eq 'OPTIONAL').Count
    deepResearchIds = @($deep.Keys | Sort-Object)
    manifest = $manifestPath
}

$summaryPath = Join-Path $artifactRoot 'article-reading-tags-summary.json'
$summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $summaryPath -Encoding UTF8

$successPath = Join-Path $artifactRoot 'READING-TAGS-SUCCESS.txt'
@(
    'STATUS=SUCCESS'
    "TOTAL_PDFS=$($summary.totalPdfs)"
    "TIEF_DEEP_FILES=$($summary.tiefDeepFiles)"
    "MANIFEST=$manifestPath"
    "SUMMARY=$summaryPath"
) | Set-Content -LiteralPath $successPath -Encoding UTF8

