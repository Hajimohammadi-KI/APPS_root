[CmdletBinding()]
param(
  [string]$Configuration,
  [switch]$SkipElectronBuild
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($Configuration)) {
  $Configuration = Join-Path $scriptRoot 'setup.config.json'
}
$configurationPath = [System.IO.Path]::GetFullPath($Configuration)

function Resolve-ConfiguredPath {
  param(
    [Parameter(Mandatory = $true)][string]$Base,
    [Parameter(Mandatory = $true)][string]$Value
  )

  if ([System.IO.Path]::IsPathRooted($Value)) {
    return [System.IO.Path]::GetFullPath($Value)
  }
  return [System.IO.Path]::GetFullPath((Join-Path $Base $Value))
}

function ConvertTo-CSharpLiteralContent {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Value)

  $escaped = $Value.
    Replace('\', '\\').
    Replace('"', '\"').
    Replace("`r", '').
    Replace("`n", '\n')
  return $escaped
}

function Get-Sha256Hex {
  param([Parameter(Mandatory = $true)][string]$LiteralPath)

  $stream = [System.IO.File]::OpenRead($LiteralPath)
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  try {
    return ([System.BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '').ToLowerInvariant()
  } finally {
    $algorithm.Dispose()
    $stream.Dispose()
  }
}

function Copy-DirectoryDereferenced {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  & robocopy $Source $Destination /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
  $initialExitCode = $LASTEXITCODE

  # Bun's Windows install layout uses directory symlinks inside .bun. Those
  # links cannot be recreated by an unprivileged installer build, so replace
  # every link with the real directory it points to.
  $links = Get-ChildItem `
    -LiteralPath $Source `
    -Recurse `
    -Force `
    -Attributes ReparsePoint `
    -ErrorAction SilentlyContinue

  foreach ($link in $links) {
    $relativePath = $link.FullName.Substring($Source.Length).TrimStart('\')
    $destinationPath = Join-Path $Destination $relativePath
    $targetValue = @($link.Target)[0]
    if (-not $targetValue) {
      continue
    }

    $resolvedTarget = if ([IO.Path]::IsPathRooted([string]$targetValue)) {
      [IO.Path]::GetFullPath([string]$targetValue)
    } else {
      [IO.Path]::GetFullPath(
        (Join-Path (Split-Path -Parent $link.FullName) $targetValue)
      )
    }
    if (-not [IO.Directory]::Exists($resolvedTarget)) {
      continue
    }

    if (
      (Test-Path -LiteralPath $destinationPath) -and
      -not (Test-Path -LiteralPath $destinationPath -PathType Container)
    ) {
      Remove-Item -LiteralPath $destinationPath -Force
    }
    if (-not (Test-Path -LiteralPath $destinationPath -PathType Container)) {
      New-Item -ItemType Directory -Force -Path $destinationPath | Out-Null
    }

    & robocopy `
      $resolvedTarget `
      $destinationPath `
      /E `
      /R:1 `
      /W:1 `
      /NFL `
      /NDL `
      /NJH `
      /NJS `
      /NP | Out-Null
  }

  $remainingLinks = Get-ChildItem `
    -LiteralPath $Destination `
    -Recurse `
    -Force `
    -Attributes ReparsePoint `
    -ErrorAction SilentlyContinue
  if ($remainingLinks.Count -gt 0) {
    throw "Directory copy left $($remainingLinks.Count) unresolved symbolic links."
  }

  if ($initialExitCode -ge 8 -and $links.Count -eq 0) {
    throw "Directory copy failed with robocopy exit code $initialExitCode."
  }
}

function Assert-HexColor {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value
  )

  if ($Value -notmatch '^#[0-9A-Fa-f]{6}$') {
    throw "$Name must be a six-digit hexadecimal color."
  }
}

function New-IcoFromPng {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  Add-Type -AssemblyName System.Drawing
  $sourceImage = [System.Drawing.Image]::FromFile($Source)
  $bitmap = New-Object System.Drawing.Bitmap 256, 256
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $memory = New-Object System.IO.MemoryStream
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode =
      [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode =
      [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($sourceImage, 0, 0, 256, 256)
    $bitmap.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $memory.ToArray()
  } finally {
    $memory.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
    $sourceImage.Dispose()
  }

  $stream = [System.IO.File]::Open(
    $Destination,
    [System.IO.FileMode]::Create,
    [System.IO.FileAccess]::Write)
  $writer = New-Object System.IO.BinaryWriter($stream)
  try {
    $writer.Write([uint16]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]1)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]32)
    $writer.Write([uint32]$pngBytes.Length)
    $writer.Write([uint32]22)
    $writer.Write($pngBytes)
  } finally {
    $writer.Dispose()
    $stream.Dispose()
  }
}

if (-not (Test-Path -LiteralPath $configurationPath -PathType Leaf)) {
  throw "Setup configuration does not exist: $configurationPath"
}

# setup.config.json is BOM-less UTF-8. Force the decoder so Windows PowerShell
# cannot silently corrupt non-ASCII product copy through the system code page.
$config = Get-Content -Raw -Encoding UTF8 -LiteralPath $configurationPath | ConvertFrom-Json
$configDirectory = Split-Path -Parent $configurationPath
$projectRoot = Resolve-ConfiguredPath -Base $configDirectory -Value ([string]$config.projectRoot)
$desktopProject = Resolve-ConfiguredPath -Base $configDirectory -Value ([string]$config.desktopProject)
$readerProject = Resolve-ConfiguredPath -Base $configDirectory -Value ([string]$config.readerProject)
$iconSource = Resolve-ConfiguredPath -Base $configDirectory -Value ([string]$config.iconSource)
$outputFile = Resolve-ConfiguredPath -Base $projectRoot -Value ([string]$config.outputFile)

$requiredValues = @(
  'productName',
  'version',
  'publisher',
  'productId',
  'installFolder',
  'dataFolder',
  'mainExecutable',
  'compatibilityLauncherArchive',
  'compatibilityLauncherSha256',
  'setupFile',
  'shortcutName',
  'environmentPrefix',
  'locale',
  'identityLabel',
  'marketingTitle',
  'tagline',
  'motifOne',
  'motifTwo',
  'motifThree'
  'readerProject'
)
foreach ($name in $requiredValues) {
  $value = [string]$config.$name
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Setup configuration value '$name' is required."
  }
}

Assert-HexColor -Name 'darkColor' -Value ([string]$config.darkColor)
Assert-HexColor -Name 'darkSurfaceColor' -Value ([string]$config.darkSurfaceColor)
Assert-HexColor -Name 'accentColor' -Value ([string]$config.accentColor)
Assert-HexColor -Name 'secondaryColor' -Value ([string]$config.secondaryColor)
Assert-HexColor -Name 'highlightColor' -Value ([string]$config.highlightColor)
Assert-HexColor -Name 'accentSoftColor' -Value ([string]$config.accentSoftColor)
Assert-HexColor -Name 'secondarySoftColor' -Value ([string]$config.secondarySoftColor)
Assert-HexColor -Name 'highlightSoftColor' -Value ([string]$config.highlightSoftColor)

if (-not (Test-Path -LiteralPath $desktopProject -PathType Container)) {
  throw "Electron desktop project does not exist: $desktopProject"
}
if (-not (Test-Path -LiteralPath $readerProject -PathType Container)) {
  throw "PDF Reader project does not exist: $readerProject"
}
if (-not (Test-Path -LiteralPath $iconSource -PathType Leaf)) {
  throw "Setup icon does not exist: $iconSource"
}

$workRoot = Join-Path ([System.IO.Path]::GetTempPath()) (
  'EGA-' + [Guid]::NewGuid().ToString('N'))
$portableOutput = Join-Path $workRoot 'electron'
$payloadRoot = Join-Path $workRoot 'payload'
$payloadZip = Join-Path $workRoot 'payload.zip'
$generatedSource = Join-Path $workRoot 'SetupApp.generated.cs'
$setupIcon = Join-Path $workRoot 'setup.ico'
$compiledSetup = Join-Path $workRoot ([string]$config.setupFile)
$payloadOutput = Join-Path $projectRoot ([IO.Path]::ChangeExtension([string]$config.outputFile, '.payload.zip'))
$localAppRoot = Join-Path $workRoot 'local-app'
$webPayloadRoot = Join-Path $workRoot 'web-runtime'

$resolvedWorkRoot = [System.IO.Path]::GetFullPath($workRoot)
$tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
if (-not $tempRoot.EndsWith('\')) {
  $tempRoot += '\'
}
if (-not $resolvedWorkRoot.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Unsafe setup staging path: $resolvedWorkRoot"
}

if (-not $SkipElectronBuild) {
  Write-Host "[1/8] Building the standalone Next.js web application..."
  if (Test-Path -LiteralPath $workRoot) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $portableOutput | Out-Null
  New-Item -ItemType Directory -Force -Path $localAppRoot | Out-Null

  Push-Location $projectRoot
  try {
    & bun run --cwd apps/web build
    if ($LASTEXITCODE -ne 0) {
      throw "Web production build failed with exit code $LASTEXITCODE."
    }
    New-Item -ItemType Directory -Force -Path (Join-Path $localAppRoot 'api') | Out-Null
    & bun build `
      (Join-Path $projectRoot 'apps\api\src\main.ts') `
      --target=bun `
      --minify `
      --external '@nestjs/websockets' `
      --external '@nestjs/websockets/*' `
      --external '@nestjs/microservices' `
      --external '@nestjs/microservices/*' `
      --external '@nestjs/platform-express' `
      --external '@nestjs/platform-express/*' `
      --external '@fastify/static' `
      --external '@fastify/view' `
      --external 'class-validator' `
      --external 'class-transformer' `
      --outfile (Join-Path $localAppRoot 'api\main.js')
    if ($LASTEXITCODE -ne 0) {
      throw "NestJS API bundle failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }

  $standaloneRoot = Join-Path $projectRoot 'apps\web\.next\standalone'
  $standaloneApp = Join-Path $webPayloadRoot 'apps\web'
  $standaloneNodeModulesSource = Join-Path $standaloneRoot 'node_modules\.bun\node_modules'
  if (-not (Test-Path -LiteralPath $standaloneNodeModulesSource -PathType Container)) {
    $standaloneNodeModulesSource = Join-Path $standaloneRoot 'node_modules'
  }
  New-Item -ItemType Directory -Force -Path $webPayloadRoot | Out-Null
  Copy-DirectoryDereferenced `
    -Source (Join-Path $standaloneRoot 'apps\web') `
    -Destination $standaloneApp
  Copy-DirectoryDereferenced `
    -Source $standaloneNodeModulesSource `
    -Destination (Join-Path $standaloneApp 'node_modules')
  Copy-Item `
    -LiteralPath (Join-Path $projectRoot 'apps\web\.next\static') `
    -Destination (Join-Path $standaloneApp '.next\static') `
    -Recurse `
    -Force
  # The standalone trace may already contain public/. Re-copying the public
  # directory into that existing directory creates public/public on Windows
  # and can recursively package older multi-gigabyte installer payloads.
  $standalonePublic = Join-Path $standaloneApp 'public'
  if (Test-Path -LiteralPath $standalonePublic) {
    Remove-Item -LiteralPath $standalonePublic -Recurse -Force
  }
  Copy-DirectoryDereferenced `
    -Source (Join-Path $projectRoot 'apps\web\public') `
    -Destination $standalonePublic
  $standaloneDownloads = Join-Path $standalonePublic 'downloads'
  if (Test-Path -LiteralPath $standaloneDownloads -PathType Container) {
    # Generated installers are distribution artifacts, not runtime web assets.
    Remove-Item -LiteralPath $standaloneDownloads -Recurse -Force
  }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $webArchive = Join-Path $localAppRoot 'web.zip'
  [System.IO.Compression.ZipFile]::CreateFromDirectory(
    $webPayloadRoot,
    $webArchive,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false)
  [System.IO.File]::WriteAllText(
    (Join-Path $localAppRoot 'web.sha256'),
    (Get-Sha256Hex -LiteralPath $webArchive),
    (New-Object System.Text.UTF8Encoding($false)))

  Write-Host "[2/8] Building the deterministic local PDF Reader..."
  Push-Location $readerProject
  try {
    & bun run build
    if ($LASTEXITCODE -ne 0) {
      throw "PDF Reader production build failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }
  $readerPayloadRoot = Join-Path $localAppRoot 'reader'
  Copy-DirectoryDereferenced `
    -Source (Join-Path $readerProject 'dist') `
    -Destination (Join-Path $readerPayloadRoot 'dist')
  New-Item -ItemType Directory -Force -Path (Join-Path $readerPayloadRoot 'scripts') | Out-Null
  Copy-Item `
    -LiteralPath (Join-Path $readerProject 'scripts\start-local.mjs') `
    -Destination (Join-Path $readerPayloadRoot 'scripts\start-local.mjs') `
    -Force
  Copy-Item `
    -LiteralPath (Join-Path $readerProject 'package.json') `
    -Destination (Join-Path $readerPayloadRoot 'package.json') `
    -Force
  New-Item -ItemType Directory -Force -Path (Join-Path $localAppRoot 'runtime') | Out-Null
  Copy-Item `
    -LiteralPath (Get-Command bun).Source `
    -Destination (Join-Path $localAppRoot 'runtime\bun.exe') `
    -Force

  Write-Host "[3/8] Building the portable Electron application..."
  $preloadBundle = Join-Path $desktopProject 'preload.bundle.cjs'
  & bun build `
    (Join-Path $desktopProject 'preload.cjs') `
    --target=node `
    --format=cjs `
    --external electron `
    --outfile $preloadBundle
  if ($LASTEXITCODE -ne 0) {
    throw "Electron preload bundle failed with exit code $LASTEXITCODE."
  }

  Push-Location $desktopProject
  try {
    & bun x electron-builder `
      --dir `
      --win `
      --x64 `
      "--config.directories.output=$portableOutput"
    if ($LASTEXITCODE -ne 0) {
      throw "Electron application build failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
    if (Test-Path -LiteralPath $preloadBundle -PathType Leaf) {
      Remove-Item -LiteralPath $preloadBundle -Force
    }
  }
} else {
  Write-Host "[1-3/8] Reusing the existing standalone, PDF Reader, and Electron application..."
}

$portableApp = Join-Path $portableOutput 'win-unpacked'
if (-not (Test-Path -LiteralPath $portableApp -PathType Container)) {
  throw "Portable Electron output is missing: $portableApp"
}

$configuredMainExecutable = [string]$config.mainExecutable
if ([IO.Path]::GetFileName($configuredMainExecutable) -ne $configuredMainExecutable) {
  throw 'The configured main executable must be a root-level file name.'
}
$portableLauncher = Join-Path $portableApp $configuredMainExecutable
if (-not (Test-Path -LiteralPath $portableLauncher -PathType Leaf)) {
  throw "Portable application executable is missing: $portableLauncher"
}

$compatibilityLauncherArchive = Resolve-ConfiguredPath `
  -Base $configDirectory `
  -Value ([string]$config.compatibilityLauncherArchive)
if (-not (Test-Path -LiteralPath $compatibilityLauncherArchive -PathType Leaf)) {
  throw "Compatibility launcher archive is missing: $compatibilityLauncherArchive"
}
$expectedCompatibilityLauncherSha256 =
  ([string]$config.compatibilityLauncherSha256).Trim()
if ($expectedCompatibilityLauncherSha256 -notmatch '^[0-9A-Fa-f]{64}$') {
  throw 'The compatibility launcher SHA-256 must contain exactly 64 hexadecimal characters.'
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$compatibilityLauncherTemp = Join-Path $workRoot 'compatibility-launcher.exe'
$compatibilityArchive = [System.IO.Compression.ZipFile]::OpenRead(
  $compatibilityLauncherArchive)
try {
  $compatibilityEntries = @(
    $compatibilityArchive.Entries | Where-Object {
      $_.FullName -ceq $configuredMainExecutable -and
      -not [string]::IsNullOrEmpty($_.Name)
    }
  )
  if ($compatibilityEntries.Count -ne 1) {
    throw (
      "Compatibility launcher archive must contain exactly one root entry " +
      "named '$configuredMainExecutable'; found $($compatibilityEntries.Count).")
  }
  [System.IO.Compression.ZipFileExtensions]::ExtractToFile(
    $compatibilityEntries[0],
    $compatibilityLauncherTemp,
    $true)
} finally {
  $compatibilityArchive.Dispose()
}

try {
  $actualCompatibilityLauncherSha256 =
    Get-Sha256Hex -LiteralPath $compatibilityLauncherTemp
  if (-not [string]::Equals(
    $actualCompatibilityLauncherSha256,
    $expectedCompatibilityLauncherSha256,
    [System.StringComparison]::OrdinalIgnoreCase)) {
    throw (
      'Compatibility launcher SHA-256 mismatch. ' +
      "Expected $expectedCompatibilityLauncherSha256; " +
      "found $actualCompatibilityLauncherSha256.")
  }

  # Preserve the launcher that already passes this Windows machine's App
  # Control policy while retaining the current app.asar and resources.
  Copy-Item `
    -LiteralPath $compatibilityLauncherTemp `
    -Destination $portableLauncher `
    -Force
} finally {
  if (Test-Path -LiteralPath $compatibilityLauncherTemp -PathType Leaf) {
    Remove-Item -LiteralPath $compatibilityLauncherTemp -Force
  }
}

$workspaceRoot = $null
$workspaceCandidate = [System.IO.DirectoryInfo]$projectRoot
while ($null -ne $workspaceCandidate) {
  $packagerCandidate = Join-Path $workspaceCandidate.FullName 'shared\GoogleOAuthPackaging.ps1'
  if (Test-Path -LiteralPath $packagerCandidate -PathType Leaf) {
    $workspaceRoot = $workspaceCandidate.FullName
    . $packagerCandidate
    break
  }
  $workspaceCandidate = $workspaceCandidate.Parent
}
if ([string]::IsNullOrWhiteSpace($workspaceRoot)) {
  throw 'The shared Google OAuth packager could not be found.'
}
Install-StudyGoogleOAuthResources `
  -WorkspaceRoot $workspaceRoot `
  -ResourcesDirectory (Join-Path $portableApp 'resources') `
  -IncludeDesktopBridge

$embeddedLocalApp = Join-Path $portableApp 'resources\local-app'
if (Test-Path -LiteralPath $embeddedLocalApp) {
  Remove-Item -LiteralPath $embeddedLocalApp -Recurse -Force
}
Copy-Item -LiteralPath $localAppRoot -Destination $embeddedLocalApp -Recurse -Force

Write-Host "[4/8] Preparing the embedded application payload..."
if (Test-Path -LiteralPath $payloadRoot) {
  Remove-Item -LiteralPath $payloadRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $payloadRoot | Out-Null
Get-ChildItem -LiteralPath $portableApp -Force | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $payloadRoot -Recurse -Force
}

$mainExecutable = Join-Path $payloadRoot ([string]$config.mainExecutable)
if (-not (Test-Path -LiteralPath $mainExecutable -PathType Leaf)) {
  throw "Portable application executable is missing: $mainExecutable"
}

[System.IO.File]::WriteAllText(
  (Join-Path $payloadRoot 'version.txt'),
  [string]$config.version,
  (New-Object System.Text.UTF8Encoding($false)))
New-IcoFromPng -Source $iconSource -Destination (Join-Path $payloadRoot 'app.ico')

Write-Host "[5/8] Compressing the offline payload..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path -LiteralPath $payloadZip) {
  Remove-Item -LiteralPath $payloadZip -Force
}
[System.IO.Compression.ZipFile]::CreateFromDirectory(
  $payloadRoot,
  $payloadZip,
  [System.IO.Compression.CompressionLevel]::Optimal,
  $false)

Write-Host "[6/8] Applying the product identity and modern visual theme..."
# SetupApp.cs is also BOM-less UTF-8; force the correct decoder before source
# generation and compilation.
$source = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $scriptRoot 'SetupApp.cs')
$replacements = [ordered]@{
  '__PRODUCT_NAME__' = ConvertTo-CSharpLiteralContent ([string]$config.productName)
  '__VERSION__' = ConvertTo-CSharpLiteralContent ([string]$config.version)
  '__PUBLISHER__' = ConvertTo-CSharpLiteralContent ([string]$config.publisher)
  '__PRODUCT_ID__' = ConvertTo-CSharpLiteralContent ([string]$config.productId)
  '__INSTALL_FOLDER__' = ConvertTo-CSharpLiteralContent ([string]$config.installFolder)
  '__DATA_FOLDER__' = ConvertTo-CSharpLiteralContent ([string]$config.dataFolder)
  '__MAIN_EXECUTABLE__' = ConvertTo-CSharpLiteralContent ([string]$config.mainExecutable)
  '__SETUP_FILE__' = ConvertTo-CSharpLiteralContent ([string]$config.setupFile)
  '__SHORTCUT_NAME__' = ConvertTo-CSharpLiteralContent ([string]$config.shortcutName)
  '__ENV_PREFIX__' = ConvertTo-CSharpLiteralContent ([string]$config.environmentPrefix)
  '__LOCALE__' = ConvertTo-CSharpLiteralContent ([string]$config.locale)
  '__IDENTITY_LABEL__' = ConvertTo-CSharpLiteralContent ([string]$config.identityLabel)
  '__MARKETING_TITLE__' = ConvertTo-CSharpLiteralContent ([string]$config.marketingTitle)
  '__TAGLINE__' = ConvertTo-CSharpLiteralContent ([string]$config.tagline)
  '__MOTIF_ONE__' = ConvertTo-CSharpLiteralContent ([string]$config.motifOne)
  '__MOTIF_TWO__' = ConvertTo-CSharpLiteralContent ([string]$config.motifTwo)
  '__MOTIF_THREE__' = ConvertTo-CSharpLiteralContent ([string]$config.motifThree)
  '__DARK_COLOR__' = [string]$config.darkColor
  '__DARK_SURFACE_COLOR__' = [string]$config.darkSurfaceColor
  '__ACCENT_COLOR__' = [string]$config.accentColor
  '__SECONDARY_COLOR__' = [string]$config.secondaryColor
  '__HIGHLIGHT_COLOR__' = [string]$config.highlightColor
  '__ACCENT_SOFT_COLOR__' = [string]$config.accentSoftColor
  '__SECONDARY_SOFT_COLOR__' = [string]$config.secondarySoftColor
  '__HIGHLIGHT_SOFT_COLOR__' = [string]$config.highlightSoftColor
}
foreach ($replacement in $replacements.GetEnumerator()) {
  $source = $source.Replace([string]$replacement.Key, [string]$replacement.Value)
}

if ($source -match '__[A-Z0-9_]+__') {
  throw "The generated setup source still contains placeholder '$($Matches[0])'."
}
[System.IO.File]::WriteAllText(
  $generatedSource,
  $source,
  (New-Object System.Text.UTF8Encoding($true)))

Write-Host "[7/8] Compiling the setup manager..."
$frameworkRoot = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319'
$compiler = Join-Path $frameworkRoot 'csc.exe'
if (-not (Test-Path -LiteralPath $compiler -PathType Leaf)) {
  throw 'The Windows .NET Framework C# compiler is not available.'
}
New-IcoFromPng -Source $iconSource -Destination $setupIcon
if (Test-Path -LiteralPath $compiledSetup) {
  Remove-Item -LiteralPath $compiledSetup -Force
}

$compilerArguments = @(
  '/nologo',
  '/target:winexe',
  '/platform:anycpu',
  '/optimize+',
  '/utf8output',
  "/out:$compiledSetup",
  "/win32icon:$setupIcon",
  "/win32manifest:$(Join-Path $scriptRoot 'setup.manifest')",
  "/resource:$iconSource,AppIcon.png",
  "/reference:$(Join-Path $frameworkRoot 'WPF\PresentationCore.dll')",
  "/reference:$(Join-Path $frameworkRoot 'WPF\PresentationFramework.dll')",
  "/reference:$(Join-Path $frameworkRoot 'WPF\WindowsBase.dll')",
  "/reference:$(Join-Path $frameworkRoot 'System.Xaml.dll')",
  "/reference:$(Join-Path $frameworkRoot 'System.IO.Compression.dll')",
  "/reference:$(Join-Path $frameworkRoot 'System.IO.Compression.FileSystem.dll')",
  $generatedSource
)
& $compiler @compilerArguments
if ($LASTEXITCODE -ne 0) {
  throw "Setup compilation failed with exit code $LASTEXITCODE."
}

Write-Host "[8/8] Publishing the setup file and checksum..."
$outputDirectory = Split-Path -Parent $outputFile
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
Copy-Item -LiteralPath $compiledSetup -Destination $outputFile -Force
$payloadDirectory = Split-Path -Parent $payloadOutput
New-Item -ItemType Directory -Force -Path $payloadDirectory | Out-Null
Copy-Item -LiteralPath $payloadZip -Destination $payloadOutput -Force
$hash = Get-Sha256Hex -LiteralPath $outputFile
[System.IO.File]::WriteAllText(
  "$outputFile.sha256",
  "$hash  $([System.IO.Path]::GetFileName($outputFile))`r`n",
  (New-Object System.Text.UTF8Encoding($false)))

$info = Get-Item -LiteralPath $outputFile
Write-Host ''
Write-Host 'Modern Windows setup created successfully.'
Write-Host "File: $($info.FullName)"
Write-Host ("Size: {0:N1} MB" -f ($info.Length / 1MB))
Write-Host "SHA-256: $hash"
