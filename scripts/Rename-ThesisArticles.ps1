param(
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'

$roots = @(
    'D:\Bachelor-Thesis\02_Literature',
    'D:\Bachelor-Thesis\99_Archive\All Artikels\Recovered_Articles_2026-08-07'
)

$artifactDir = 'D:\APPS_root\artifacts\article-renaming'
$guideTemplate = Join-Path $artifactDir 'READING-GUIDE.template.md'
$mode = if ($Apply) { 'apply' } else { 'preview' }
$manifestPath = Join-Path $artifactDir "article-rename-$mode-2026-08-14.csv"
$summaryPath = Join-Path $artifactDir "article-rename-$mode-summary.txt"

New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null

function Get-ReadingTag {
    param([string]$Name)

    $n = $Name.ToLowerInvariant()

    if ($n -match 'hevner') { return 'DEEP_Framework-Guidelines-Eval' }
    if ($n -match 'nagy') { return 'DEEP_StaticSQL-Method-Eval' }
    if ($n -match 'shatnawi') { return 'DEEP_Multilang-Method-Limits' }
    if ($n -match 'yamaguc') { return 'DEEP_CPG-Model-Construction' }
    if ($n -match 'usai|logiclens') { return 'DEEP_MultiRepo-Graph-Eval' }
    if ($n -match 'alshem|problematic.*database|database.*fragments') { return 'DEEP_Taxonomy-Limits' }
    if ($n -match 'abedu') { return 'DEEP_KG-QA-Pipeline-Eval' }
    if ($n -match 'peng|swe.qa|swe-qa|coreqa|chen') { return 'DEEP_Dataset-Metrics-Threats' }

    if ($n -match 'optional') { return 'OPTIONAL_Abs-Conclusion' }
    if ($n -match 'support') { return 'RELATED_Abs-Method-Conclusion' }
    if ($n -match 'survey|taxonomy') { return 'TARGET_Taxonomy-Limits' }
    if ($n -match 'evaluation|benchmark|dataset|question|metric|gold') { return 'TARGET_Data-Metrics-Threats' }
    if ($n -match 'important|strategic|retrieval|rag|answer|qa|graph|analysis|generation') { return 'TARGET_Method-Eval' }

    return 'REVIEW_Abs-Method-Conclusion'
}

function Get-NewName {
    param(
        [string]$FileName,
        [string]$Tag
    )

    $stem = [System.IO.Path]::GetFileNameWithoutExtension($FileName)

    # Make repeated runs idempotent by removing our current leading label.
    $stem = $stem -replace '^(?:(?:DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_[A-Za-z0-9-]+__)+', ''

    $prefix = ''
    $rest = $stem
    if ($stem -match '^((?:\d{1,3}|R\d{2}(?:_W\d{2}(?:-\d{2})?)?)[ _-]+)(.+)$') {
        $prefix = $Matches[1].TrimEnd(' ', '_', '-')
        $rest = $Matches[2]
    }

    # Remove earlier DEEP/STRATEGIC labels while retaining the original title.
    $rest = $rest -replace '^(?:(?:DEEP|STRATEGIC)(?:_[0-9]+(?:-[0-9]+)?h)?_+)+', ''
    $rest = $rest -replace '^(?:(?:DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_[A-Za-z0-9-]+__)+', ''

    if ([string]::IsNullOrWhiteSpace($prefix)) {
        return "${Tag}__${rest}.pdf"
    }

    return "${prefix}_${Tag}__${rest}.pdf"
}

$records = [System.Collections.Generic.List[object]]::new()
$missingRoots = [System.Collections.Generic.List[string]]::new()

foreach ($root in $roots) {
    if (-not (Test-Path -LiteralPath $root -PathType Container)) {
        $missingRoots.Add($root)
        continue
    }

    Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf' | ForEach-Object {
        $tag = Get-ReadingTag -Name $_.Name
        $newName = Get-NewName -FileName $_.Name -Tag $tag
        $targetPath = Join-Path $_.DirectoryName $newName
        $same = $_.Name -ceq $newName
        $collision = (-not $same) -and (Test-Path -LiteralPath $targetPath)

        $records.Add([pscustomobject]@{
            Root = $root
            RelativeDirectory = [System.IO.Path]::GetRelativePath($root, $_.DirectoryName)
            OldName = $_.Name
            NewName = $newName
            Tag = $tag
            Changed = -not $same
            Collision = $collision
            SourcePath = $_.FullName
            TargetPath = $targetPath
            TargetPathLength = $targetPath.Length
        })
    }
}

$records | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding utf8

$collisions = @($records | Where-Object Collision)
$maxPathLength = ($records | Measure-Object -Property TargetPathLength -Maximum).Maximum
if ($null -eq $maxPathLength) { $maxPathLength = 0 }

if ($missingRoots.Count -gt 0) {
    throw "Missing article roots: $($missingRoots -join '; ')"
}
if ($collisions.Count -gt 0) {
    throw "Rename collisions found: $($collisions.Count). See $manifestPath"
}
if ($maxPathLength -gt 250) {
    throw "A target path is longer than 250 characters ($maxPathLength). See $manifestPath"
}

$renamed = 0
if ($Apply) {
    foreach ($record in ($records | Where-Object Changed)) {
        Rename-Item -LiteralPath $record.SourcePath -NewName $record.NewName
        $renamed++
    }

    foreach ($root in $roots) {
        Copy-Item -LiteralPath $guideTemplate -Destination (Join-Path $root 'READING-GUIDE.md') -Force
    }
}

$postCounts = @{}
$unlabelled = 0
foreach ($root in $roots) {
    $files = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.pdf')
    $postCounts[$root] = $files.Count
    if ($Apply) {
        $unlabelled += @($files | Where-Object {
            $_.Name -notmatch '(?:DEEP|TARGET|RELATED|OPTIONAL|REVIEW)_[A-Za-z0-9-]+__'
        }).Count
    }
}

$tagCounts = $records | Group-Object Tag | Sort-Object Name | ForEach-Object {
    "$($_.Name)=$($_.Count)"
}

$summary = @(
    "mode=$mode"
    "total=$($records.Count)"
    "planned_changes=$(@($records | Where-Object Changed).Count)"
    "renamed=$renamed"
    "collisions=$($collisions.Count)"
    "max_target_path_length=$maxPathLength"
    "unlabelled_after_apply=$unlabelled"
    "root_1_count=$($postCounts[$roots[0]])"
    "root_2_count=$($postCounts[$roots[1]])"
    "manifest=$manifestPath"
    "tags=$($tagCounts -join ';')"
)

$summary | Set-Content -LiteralPath $summaryPath -Encoding utf8

