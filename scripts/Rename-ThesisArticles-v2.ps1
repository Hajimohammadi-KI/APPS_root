$ErrorActionPreference = 'Stop'

$roots = @(
    'D:\Bachelor-Thesis\02_Literature',
    'D:\Bachelor-Thesis\99_Archive\All Artikels\Recovered_Articles_2026-08-07'
)
$artifactRoot = 'D:\APPS_root\artifacts\article-renaming'
$manifestPath = Join-Path $artifactRoot 'article-renaming-manifest.csv'
$statusPath = Join-Path $artifactRoot 'rename-status.json'
$statusImagePath = Join-Path $artifactRoot 'rename-status.png'

New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null

function Get-ReadingTag {
    param([string]$Name)

    if ($Name -match '(?i)Hevner') { return 'DEEP_Framework-Guidelines-Evaluation' }
    if ($Name -match '(?i)Nagy|Where.{0,20}SQL.{0,20}Executed') { return 'DEEP_StaticSQL-Method-Evaluation' }
    if ($Name -match '(?i)Shatnawi') { return 'DEEP_Multilanguage-Method-Limits' }
    if ($Name -match '(?i)Yamaguchi') { return 'DEEP_CPG-Model-Construction' }
    if ($Name -match '(?i)Usai|LogicLens') { return 'DEEP_MultiRepo-Graph-Evaluation' }
    if ($Name -match '(?i)Alshemaimri|Problematic.{0,30}Database.{0,30}Fragments') { return 'DEEP_Taxonomy-Limits' }
    if ($Name -match '(?i)Abedu') { return 'DEEP_KG-QA-Pipeline-Evaluation' }
    if ($Name -match '(?i)Peng.{0,30}SWE.?QA|SWE.?QA.{0,30}Peng') { return 'DEEP_Dataset-Metrics-Threats' }

    if ($Name -match '(?i)CoReQA|Chen') { return 'TARGET_Data-Metrics-Threats' }
    if ($Name -match '(?i)OPTIONAL') { return 'OPTIONAL_Abstract-Conclusion' }
    if ($Name -match '(?i)SUPPORT') { return 'RELATED_Abstract-Method-Conclusion' }
    if ($Name -match '(?i)survey|taxonomy') { return 'TARGET_Taxonomy-Limits' }
    if ($Name -match '(?i)evaluation|benchmark|dataset|question|metric|gold') { return 'TARGET_Data-Metrics-Threats' }
    if ($Name -match '(?i)important|strategic|retrieval|rag|answer|graph|analysis|generation|code.?search') { return 'TARGET_Method-Evaluation' }
    return 'REVIEW_Abstract-Method-Conclusion'
}

function Get-RenamedBase {
    param([string]$BaseName)

    $prefix = ''
    $rest = $BaseName
    if ($BaseName -match '^(?<prefix>\d{1,3}_)(?<rest>.+)$') {
        $prefix = $Matches.prefix
        $rest = $Matches.rest
    } elseif ($BaseName -match '^(?<prefix>R\d+_W[\d-]+_)(?<rest>.+)$') {
        $prefix = $Matches.prefix
        $rest = $Matches.rest
    }

    $rest = $rest -replace '^(?:DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_[A-Za-z0-9-]+_', ''
    $tag = Get-ReadingTag -Name $rest
    return "$prefix$tag`_$rest"
}

$missingRoots = @($roots | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Container) })
if ($missingRoots.Count -gt 0) {
    throw "Missing roots: $($missingRoots -join '; ')"
}

$files = @($roots | ForEach-Object { Get-ChildItem -LiteralPath $_ -Recurse -File -Filter '*.pdf' })
$plan = foreach ($file in $files) {
    $newBase = Get-RenamedBase -BaseName $file.BaseName
    $newPath = Join-Path $file.DirectoryName ($newBase + $file.Extension)
    [pscustomobject]@{
        Root = ($roots | Where-Object { $file.FullName.StartsWith($_, [System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1)
        OldPath = $file.FullName
        NewPath = $newPath
        OldName = $file.Name
        NewName = [System.IO.Path]::GetFileName($newPath)
        Tag = Get-ReadingTag -Name $file.BaseName
        Changed = -not $file.FullName.Equals($newPath, [System.StringComparison]::OrdinalIgnoreCase)
    }
}

$duplicateTargets = @($plan | Group-Object NewPath | Where-Object Count -gt 1)
$occupiedTargets = @($plan | Where-Object {
    $_.Changed -and (Test-Path -LiteralPath $_.NewPath) -and
    -not $_.OldPath.Equals($_.NewPath, [System.StringComparison]::OrdinalIgnoreCase)
})
if ($duplicateTargets.Count -gt 0 -or $occupiedTargets.Count -gt 0) {
    throw "Rename collision detected. Duplicate targets: $($duplicateTargets.Count); occupied targets: $($occupiedTargets.Count)"
}

$renamed = 0
foreach ($item in $plan) {
    if ($item.Changed) {
        Move-Item -LiteralPath $item.OldPath -Destination $item.NewPath
        $renamed++
    }
}

$guide = @'
# راهنمای خواندن مقاله‌ها

نام فایل‌ها روش مطالعه را مشخص می‌کند:

- `DEEP_*`: مطالعهٔ عمیق. Problem، Method/Approach، Result، Evaluation، Limitation و ارتباط با پایان‌نامه را استخراج کن. برای هر مقاله یک خلاصهٔ پنج‌بخشی و یک توضیح شفاهی بدون نگاه به متن بساز.
- `TARGET_Method-Evaluation`: بخش‌های Method، Architecture/Pipeline و Evaluation را دقیق بخوان؛ Introduction و Related Work را مرور سریع کن.
- `TARGET_Data-Metrics-Threats`: طراحی dataset/question، metricها، validation و threats to validity را دقیق بخوان.
- `TARGET_Taxonomy-Limits`: taxonomy، دسته‌بندی‌ها و limitations را استخراج کن؛ جزئیات پیاده‌سازی فرعی است.
- `RELATED_Abstract-Method-Conclusion`: Abstract، شکل معماری یا Method اصلی و Conclusion را بخوان؛ فقط نکتهٔ مرتبط با پایان‌نامه را یادداشت کن.
- `OPTIONAL_Abstract-Conclusion`: فقط Abstract و Conclusion؛ در صورت نیاز به سؤال مشخص، بخش مربوط را باز کن.
- `REVIEW_Abstract-Method-Conclusion`: ابتدا Abstract، Method و Conclusion را غربال کن؛ سپس تصمیم بگیر که به TARGET ارتقا پیدا کند یا کنار گذاشته شود.

## خروجی ثابت برای مقاله‌های DEEP

1. Problem — مسئله چیست؟
2. Method — دقیقاً چه روشی اجرا شده؟
3. Result — چه نتیجه‌ای به دست آمده؟
4. Limitation — محدودیت و تهدید اعتبار چیست؟
5. Thesis connection — کدام بخش را استفاده، بازسازی یا مقایسه می‌کنی؟

مقاله‌های DEEP اصلی: Hevner، Nagy، Shatnawi، Yamaguchi، Usai/LogicLens، Alshemaimri، Abedu و Peng/SWE-QA.
'@
foreach ($root in $roots) {
    $guide | Set-Content -LiteralPath (Join-Path $root 'READING-GUIDE.md') -Encoding UTF8
}

$plan | Sort-Object Root, NewName | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8

$after = @($roots | ForEach-Object { Get-ChildItem -LiteralPath $_ -Recurse -File -Filter '*.pdf' })
$untagged = @($after | Where-Object { $_.BaseName -notmatch '_(DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_' })
$deep = @($after | Where-Object { $_.BaseName -match '_DEEP_' })
$identified = @{
    Hevner = [bool]($after.Name -match '(?i)Hevner')
    Nagy = [bool]($after.Name -match '(?i)Nagy|Where.{0,20}SQL.{0,20}Executed')
    Shatnawi = [bool]($after.Name -match '(?i)Shatnawi')
    Yamaguchi = [bool]($after.Name -match '(?i)Yamaguchi')
    Usai = [bool]($after.Name -match '(?i)Usai|LogicLens')
    Alshemaimri = [bool]($after.Name -match '(?i)Alshemaimri|Problematic.{0,30}Database.{0,30}Fragments')
    Abedu = [bool]($after.Name -match '(?i)Abedu')
    Peng = [bool]($after.Name -match '(?i)Peng.{0,30}SWE.?QA|SWE.?QA.{0,30}Peng')
}
$missingDeepIdentities = @($identified.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object Key)
$passed = ($untagged.Count -eq 0 -and $missingDeepIdentities.Count -eq 0)
$status = [ordered]@{
    passed = $passed
    totalPdfs = $after.Count
    renamed = $renamed
    deepCopies = $deep.Count
    otherTaggedCopies = $after.Count - $deep.Count
    untagged = $untagged.Count
    missingDeepIdentities = $missingDeepIdentities
    roots = $roots
    manifest = $manifestPath
}
$status | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statusPath -Encoding UTF8

Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 760,260
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::White)
$titleFont = New-Object System.Drawing.Font 'Segoe UI',22,[System.Drawing.FontStyle]::Bold
$bodyFont = New-Object System.Drawing.Font 'Segoe UI',14
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30,20,50))
$resultBrush = New-Object System.Drawing.SolidBrush ($(if ($passed) { [System.Drawing.Color]::FromArgb(25,130,80) } else { [System.Drawing.Color]::FromArgb(190,40,45) }))
$graphics.DrawString($(if ($passed) { 'PASS - Article names updated' } else { 'FAIL - Review required' }), $titleFont, $resultBrush, 24, 18)
$graphics.DrawString("PDFs: $($after.Count)    Renamed now: $renamed    DEEP copies: $($deep.Count)", $bodyFont, $brush, 26, 76)
$graphics.DrawString("Other tagged: $($after.Count - $deep.Count)    Untagged: $($untagged.Count)", $bodyFont, $brush, 26, 114)
$graphics.DrawString("Missing DEEP identities: $($(if ($missingDeepIdentities.Count) { $missingDeepIdentities -join ', ' } else { 'none' }))", $bodyFont, $brush, 26, 152)
$graphics.DrawString('No PDF deleted or overwritten.', $bodyFont, $brush, 26, 196)
$bitmap.Save($statusImagePath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose(); $bitmap.Dispose(); $titleFont.Dispose(); $bodyFont.Dispose(); $brush.Dispose(); $resultBrush.Dispose()

if (-not $passed) { exit 2 }
