param(
    [string[]]$Roots = @(
        'D:\Bachelor-Thesis\02_Literature',
        'D:\Bachelor-Thesis\99_Archive\All Artikels\Recovered_Articles_2026-08-07'
    ),
    [string]$ArtifactDirectory = 'D:\APPS_root\artifacts\article-renaming'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$deepByCode = [ordered]@{
    'R01' = 'DEEP_Read-Framework-Guidelines-Eval'
    'R06' = 'DEEP_Read-StaticSQL-Method-Eval'
    'R04' = 'DEEP_Read-Multilang-Method-Limits'
    'R02' = 'DEEP_Read-CPG-Model-Construction'
    'R09' = 'DEEP_Read-MultiRepo-Graph-Eval'
    'R07' = 'DEEP_Read-Taxonomy-Limits'
    'R15' = 'DEEP_Read-KG-QA-Pipeline-Eval'
    'R29' = 'DEEP_Read-Dataset-Metrics-Threats'
}

$deepByTitle = [ordered]@{
    'Hevner.*Design.Science' = 'DEEP_Read-Framework-Guidelines-Eval'
    'Nagy' = 'DEEP_Read-StaticSQL-Method-Eval'
    'Shatnawi' = 'DEEP_Read-Multilang-Method-Limits'
    'Yamaguchi' = 'DEEP_Read-CPG-Model-Construction'
    '(Usai|LogicLens)' = 'DEEP_Read-MultiRepo-Graph-Eval'
    'Alshemaimri' = 'DEEP_Read-Taxonomy-Limits'
    'Abedu' = 'DEEP_Read-KG-QA-Pipeline-Eval'
    'Peng.*(SWE.QA|Repository.Level)' = 'DEEP_Read-Dataset-Metrics-Threats'
}

function Get-ReadingTag {
    param([string]$Name)

    foreach ($entry in $deepByCode.GetEnumerator()) {
        if ($Name -match "(?i)(?:^|[_ -])$([regex]::Escape($entry.Key))(?:[_ .-]|$)") {
            return $entry.Value
        }
    }

    foreach ($entry in $deepByTitle.GetEnumerator()) {
        if ($Name -match "(?i)$($entry.Key)") {
            return $entry.Value
        }
    }

    if ($Name -match '(?i)OPTIONAL') {
        return 'OPTIONAL_Read-Abstract-Conclusion'
    }
    if ($Name -match '(?i)(survey|review|systematic|mapping)') {
        return 'REVIEW_Read-Taxonomy-Limits'
    }
    if ($Name -match '(?i)(dataset|benchmark|gold|CoReQA|SWE.QA|evaluation|metric)') {
        return 'TARGET_Read-Data-Metrics-Threats'
    }
    if ($Name -match '(?i)(retriev|RAG|question.answer|repository.qa|code.search|graph.qa|answering)') {
        return 'TARGET_Read-Method-Eval'
    }
    return 'RELATED_Read-Abstract-Method-Conclusion'
}

function Remove-ExistingReadingTags {
    param([string]$Stem)

    $result = $Stem
    $patterns = @(
        '(?i)(?:DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_Read-[A-Za-z0-9.-]+_?',
        '(?i)(?:DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_[A-Za-z0-9.-]+_?'
    )
    foreach ($pattern in $patterns) {
        $result = [regex]::Replace($result, $pattern, '')
    }
    return ($result -replace '__+', '_').Trim('_', ' ', '-')
}

function Get-NewFileName {
    param([System.IO.FileInfo]$File)

    $tag = Get-ReadingTag -Name $File.Name
    $cleanStem = Remove-ExistingReadingTags -Stem $File.BaseName
    $prefix = ''
    $body = $cleanStem

    if ($cleanStem -match '^(?<prefix>(?:\d{1,2}|R\d{2})[_ -]+)(?<body>.+)$') {
        $prefix = $Matches.prefix
        $body = $Matches.body
    }

    return "$prefix$tag`_$body$($File.Extension)"
}

foreach ($root in $Roots) {
    if (-not (Test-Path -LiteralPath $root -PathType Container)) {
        throw "Required directory does not exist: $root"
    }
}

New-Item -ItemType Directory -Path $ArtifactDirectory -Force | Out-Null
$before = @{}
$allBefore = @()
foreach ($root in $Roots) {
    $files = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf')
    $before[$root] = $files.Count
    $allBefore += $files
}

$planned = foreach ($file in $allBefore) {
    $newName = Get-NewFileName -File $file
    $target = Join-Path $file.DirectoryName $newName
    [pscustomobject]@{
        Root = ($Roots | Where-Object { $file.FullName.StartsWith($_, [System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1)
        OriginalPath = $file.FullName
        NewPath = $target
        OriginalName = $file.Name
        NewName = $newName
        Tag = Get-ReadingTag -Name $file.Name
        Changed = -not [string]::Equals($file.FullName, $target, [System.StringComparison]::OrdinalIgnoreCase)
    }
}

$collisions = @($planned | Group-Object { $_.NewPath.ToLowerInvariant() } | Where-Object Count -gt 1)
if ($collisions.Count -gt 0) {
    throw "Rename stopped: $($collisions.Count) target filename collision(s) detected."
}

foreach ($item in $planned | Where-Object Changed) {
    if ((Test-Path -LiteralPath $item.NewPath) -and
        -not [string]::Equals($item.OriginalPath, $item.NewPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Rename stopped because target already exists: $($item.NewPath)"
    }
}

$manifestPath = Join-Path $ArtifactDirectory 'article-renaming-manifest.csv'
$planned | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8

foreach ($item in $planned | Where-Object Changed) {
    Move-Item -LiteralPath $item.OriginalPath -Destination $item.NewPath
}

$guide = @'
# راهنمای خواندن مقاله‌ها

نام PDFها بدون حذف محتوا و با حفظ شماره و ترتیب قبلی برچسب‌گذاری شده است.

## معنی برچسب‌ها

- `DEEP_...`: عمیق بخوان؛ Problem، Method/Approach، Evaluation، Limitations و ارتباط با پایان‌نامه را استخراج کن.
- `TARGET_Read-Method-Eval`: Method/Approach و Evaluation را دقیق بخوان؛ بقیه را سریع مرور کن.
- `TARGET_Read-Data-Metrics-Threats`: طراحی داده/پرسش، معیارها، validation و threats را بخوان.
- `REVIEW_Read-Taxonomy-Limits`: taxonomy، جدول‌های مقایسه و limitations را بخوان؛ جزئیات پیاده‌سازی ضروری نیست.
- `RELATED_Read-Abstract-Method-Conclusion`: Abstract، شکل معماری یا Method اصلی، و Conclusion را بخوان.
- `OPTIONAL_Read-Abstract-Conclusion`: فقط Abstract و Conclusion؛ تنها در صورت نیاز به Related Work عمیق‌تر شو.

## هشت مقاله عمیق

1. Hevner 2004 — Framework، Seven Guidelines، Evaluation و Contribution.
2. Nagy 2015 — Static SQL extraction، محل اجرا، Evaluation و Limitations.
3. Shatnawi 2019 — multilanguage extraction، cross-language links و limitations.
4. Yamaguchi 2014 — Code Property Graph model، node/edgeها، construction و query idea.
5. Usai 2026 / LogicLens — multi-repository architecture، graph construction و evaluation.
6. Alshemaimri 2021 — taxonomy الگوهای SQL/ORM و limitations.
7. Abedu 2025 — knowledge-graph QA pipeline، evidence، evaluation و errors.
8. Peng 2026 / SWE-QA — dataset/question design، metrics، validation و threats.

## خروجی مطالعه هر مقاله عمیق

برای هر مقاله فقط پنج بخش ثبت کن: Problem، Method، Result، Limitation و Thesis connection.
'@

foreach ($root in $Roots) {
    Set-Content -LiteralPath (Join-Path $root 'READING-GUIDE.md') -Value $guide -Encoding UTF8
}

$allAfter = @()
$statusRows = @()
foreach ($root in $Roots) {
    $files = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf')
    $allAfter += $files
    $tagged = @($files | Where-Object Name -Match '(?i)(DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_Read-').Count
    $deep = @($files | Where-Object Name -Match '(?i)DEEP_Read-').Count
    $statusRows += [pscustomobject]@{
        Directory = $root
        PdfBefore = $before[$root]
        PdfAfter = $files.Count
        Tagged = $tagged
        DeepCopies = $deep
        Guide = Test-Path -LiteralPath (Join-Path $root 'READING-GUIDE.md')
    }
}

$untagged = @($allAfter | Where-Object Name -NotMatch '(?i)(DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_Read-')
$missingDeepCodes = @()
foreach ($code in $deepByCode.Keys) {
    if (-not ($allAfter.Name -match "(?i)DEEP_Read-.*(?:^|[_ -])$([regex]::Escape($code))(?:[_ .-]|$)")) {
        $matchingAny = @($allAfter | Where-Object Name -Match "(?i)(?:^|[_ -])$([regex]::Escape($code))(?:[_ .-]|$)")
        if ($matchingAny.Count -gt 0 -and -not ($matchingAny.Name -match '(?i)DEEP_Read-')) {
            $missingDeepCodes += $code
        }
    }
}

$countMismatch = @($statusRows | Where-Object { $_.PdfBefore -ne $_.PdfAfter })
if ($countMismatch.Count -gt 0) { throw 'PDF count changed unexpectedly.' }
if ($untagged.Count -gt 0) { throw "$($untagged.Count) PDF file(s) remain untagged." }
if ($missingDeepCodes.Count -gt 0) { throw "Deep tags are missing for: $($missingDeepCodes -join ', ')" }

$statusPath = Join-Path $ArtifactDirectory 'final-status.txt'
$lines = @(
    'ARTICLE RENAMING: SUCCESS',
    "Completed: $([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))",
    "Manifest: $manifestPath",
    ''
)
foreach ($row in $statusRows) {
    $lines += "Directory: $($row.Directory)"
    $lines += "PDF count: $($row.PdfAfter) (unchanged)"
    $lines += "Tagged PDFs: $($row.Tagged)"
    $lines += "DEEP copies: $($row.DeepCopies)"
    $lines += "Guide created: $($row.Guide)"
    $lines += ''
}
$lines += "Renamed in this run: $(@($planned | Where-Object Changed).Count)"
$lines += 'No PDF was deleted or overwritten.'
Set-Content -LiteralPath $statusPath -Value $lines -Encoding UTF8
Set-Content -LiteralPath (Join-Path $ArtifactDirectory 'SUCCESS.marker') -Value 'SUCCESS' -Encoding ASCII

$lines
