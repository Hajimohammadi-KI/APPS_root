param(
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'

$roots = @(
    'D:\Bachelor-Thesis\02_Literature',
    'D:\Bachelor-Thesis\99_Archive\All Artikels\Recovered_Articles_2026-08-07'
)

$artifactRoot = 'D:\APPS_root\artifacts\article-renaming'
$manifestPath = Join-Path $artifactRoot ($(if ($Apply) { 'rename-applied.csv' } else { 'rename-preview.csv' }))
$summaryPath = Join-Path $artifactRoot ($(if ($Apply) { 'apply-summary.txt' } else { 'preview-summary.txt' }))
$guideTemplate = 'D:\APPS_root\artifacts\article-renaming\READING-GUIDE.template.md'

New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null

function Get-StudyTag {
    param([string]$Name)

    $n = $Name.ToLowerInvariant()

    if ($n -match 'hevner') { return 'DEEP_Framework-Guidelines-Eval' }
    if ($n -match 'nagy' -or $n -match 'where.was.this.sql' -or $n -match 'query.execut') { return 'DEEP_StaticSQL-Method-Eval' }
    if ($n -match 'shatnawi' -or $n -match 'multilanguage') { return 'DEEP_Multilang-Method-Limits' }
    if ($n -match 'yamaguc' -or $n -match 'property.graph') { return 'DEEP_CPG-Model-Construction' }
    if ($n -match 'usai' -or $n -match 'logiclens') { return 'DEEP_MultiRepo-Graph-Eval' }
    if ($n -match 'alshem' -or $n -match 'problematic.database') { return 'DEEP_Taxonomy-Limits' }
    if ($n -match 'abedu') { return 'DEEP_KG-QA-Pipeline-Eval' }
    if ($n -match 'peng' -or $n -match 'swe.qa') { return 'DEEP_Dataset-Metrics-Threats' }

    if ($n -match 'coreqa' -or $n -match 'chen') { return 'TARGET_Dataset-Metrics-Threats' }
    if ($n -match 'optional') { return 'OPTIONAL_Abs-Conclusion' }
    if ($n -match 'support') { return 'RELATED_Abs-Method-Conclusion' }
    if ($n -match 'survey' -or $n -match 'taxonomy') { return 'TARGET_Taxonomy-Limits' }
    if ($n -match 'evaluat|benchmark|dataset|question|metric|gold') { return 'TARGET_Data-Metrics-Threats' }
    if ($n -match 'important|strategic|retriev|rag|answer|repository.qa|graph|analysis|generation') { return 'TARGET_Method-Eval' }

    return 'REVIEW_Abs-Method-Conclusion'
}

function Remove-ExistingStudyTags {
    param([string]$Stem)

    $tagPattern = '^(?:DEEP_[A-Za-z0-9-]+|TARGET_[A-Za-z0-9-]+|RELATED_[A-Za-z0-9-]+|OPTIONAL_[A-Za-z0-9-]+|REVIEW_[A-Za-z0-9-]+)_'
    $value = $Stem
    while ($value -match $tagPattern) {
        $value = $value -replace $tagPattern, ''
    }
    return $value
}

function Get-NewBaseName {
    param([System.IO.FileInfo]$File)

    $stem = [System.IO.Path]::GetFileNameWithoutExtension($File.Name)
    $stem = Remove-ExistingStudyTags $stem
    $prefix = ''
    $rest = $stem

    if ($rest -match '^(?<prefix>(?:\d{1,3}_|R\d{1,3}_W\d{1,3}(?:-\d{1,3})?_))(?<rest>.*)$') {
        $prefix = $Matches.prefix
        $rest = $Matches.rest
        $rest = Remove-ExistingStudyTags $rest
    }

    $tag = Get-StudyTag $rest
    return [pscustomobject]@{
        Tag = $tag
        Name = "$prefix$tag`_$rest$($File.Extension)"
    }
}

$missing = @($roots | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Container) })
if ($missing.Count -gt 0) {
    throw "Missing directories: $($missing -join '; ')"
}

$files = @($roots | ForEach-Object { Get-ChildItem -LiteralPath $_ -Recurse -File -Filter '*.pdf' })
$plan = foreach ($file in $files) {
    $new = Get-NewBaseName $file
    [pscustomobject]@{
        Root = ($roots | Where-Object { $file.FullName.StartsWith($_, [System.StringComparison]::OrdinalIgnoreCase) } | Select-Object -First 1)
        Directory = $file.DirectoryName
        OldName = $file.Name
        NewName = $new.Name
        Tag = $new.Tag
        Changed = ($file.Name -cne $new.Name)
        OldPath = $file.FullName
        NewPath = Join-Path $file.DirectoryName $new.Name
    }
}

$collisions = @($plan | Group-Object { $_.NewPath.ToLowerInvariant() } | Where-Object Count -gt 1)
if ($collisions.Count -gt 0) {
    $collisionReport = Join-Path $artifactRoot 'collisions.txt'
    $collisions | ForEach-Object { $_.Group | Select-Object OldPath, NewPath } | Format-List | Out-String | Set-Content -LiteralPath $collisionReport -Encoding utf8
    throw "Rename collisions found. See $collisionReport"
}

$plan | Select-Object Root, Directory, OldName, NewName, Tag, Changed | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding utf8

$beforeByRoot = @{}
foreach ($root in $roots) {
    $beforeByRoot[$root] = @($plan | Where-Object Root -eq $root).Count
}

if ($Apply) {
    foreach ($item in @($plan | Where-Object Changed)) {
        if (Test-Path -LiteralPath $item.NewPath) {
            throw "Target already exists: $($item.NewPath)"
        }
        Rename-Item -LiteralPath $item.OldPath -NewName $item.NewName
    }

    foreach ($root in $roots) {
        Copy-Item -LiteralPath $guideTemplate -Destination (Join-Path $root 'READING-GUIDE.md') -Force
    }
}

$summary = [System.Collections.Generic.List[string]]::new()
$summary.Add("Mode=$($(if ($Apply) { 'APPLY' } else { 'PREVIEW' }))")
$summary.Add("TotalPDF=$($files.Count)")
$summary.Add("RenameCount=$(@($plan | Where-Object Changed).Count)")
$summary.Add("CollisionCount=$($collisions.Count)")
$summary.Add("DeepCount=$(@($plan | Where-Object Tag -like 'DEEP_*').Count)")
foreach ($root in $roots) {
    $after = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf').Count
    $summary.Add("Root=$root|Before=$($beforeByRoot[$root])|After=$after")
}
$summary.Add("Manifest=$manifestPath")
$summary | Set-Content -LiteralPath $summaryPath -Encoding utf8

Write-Output ($summary -join [Environment]::NewLine)
