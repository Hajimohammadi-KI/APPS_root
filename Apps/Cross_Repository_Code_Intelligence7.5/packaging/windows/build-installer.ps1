[CmdletBinding()]
param(
  [string]$OutputDirectory,
  [switch]$SkipApplicationBuild
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = [System.IO.Path]::GetFullPath(
  (Join-Path $scriptRoot '..\..'))

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $repositoryRoot 'release\windows'
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
$stagingRoot = Join-Path $OutputDirectory '.staging'
$payloadRoot = Join-Path $stagingRoot 'payload'
$payloadZip = Join-Path $stagingRoot 'payload.zip'
$packageJsonPath = Join-Path $repositoryRoot 'package.json'

$workspaceRoot = $null
$workspaceCandidate = [System.IO.DirectoryInfo]$repositoryRoot
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

function Assert-SafeStagingPath {
  $resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
  $resolvedStaging = [System.IO.Path]::GetFullPath($stagingRoot)
  $expected = $resolvedOutput.TrimEnd('\') + '\.staging'

  if (-not [string]::Equals(
      $resolvedStaging.TrimEnd('\'),
      $expected,
      [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Unsafe staging path: $resolvedStaging"
  }
}

function Copy-DirectoryContents {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  if (-not (Test-Path -LiteralPath $Source -PathType Container)) {
    throw "Required directory does not exist: $Source"
  }

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force
  }
}

function New-IcoFromPngFiles {
  param(
    [Parameter(Mandatory = $true)][string[]]$PngPaths,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  $images = @()
  foreach ($pngPath in $PngPaths) {
    if (-not (Test-Path -LiteralPath $pngPath -PathType Leaf)) {
      throw "Icon source does not exist: $pngPath"
    }
    $bytes = [System.IO.File]::ReadAllBytes($pngPath)
    $name = [System.IO.Path]::GetFileNameWithoutExtension($pngPath)
    $size = 0
    if ($name -match '(\d+)$') {
      $size = [int]$Matches[1]
    }
    if ($size -lt 1 -or $size -gt 255) {
      throw "Icon filename must end with a size between 1 and 255: $pngPath"
    }
    $images += [pscustomobject]@{ Size = $size; Bytes = $bytes }
  }

  $stream = [System.IO.File]::Open(
    $Destination,
    [System.IO.FileMode]::Create,
    [System.IO.FileAccess]::Write)
  $writer = New-Object System.IO.BinaryWriter($stream)
  try {
    $writer.Write([uint16]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]$images.Count)

    $offset = 6 + (16 * $images.Count)
    foreach ($image in $images) {
      $writer.Write([byte]$image.Size)
      $writer.Write([byte]$image.Size)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([uint16]1)
      $writer.Write([uint16]32)
      $writer.Write([uint32]$image.Bytes.Length)
      $writer.Write([uint32]$offset)
      $offset += $image.Bytes.Length
    }

    foreach ($image in $images) {
      $writer.Write($image.Bytes)
    }
  } finally {
    $writer.Dispose()
    $stream.Dispose()
  }
}

if (-not (Test-Path -LiteralPath $packageJsonPath -PathType Leaf)) {
  $existingSetup = Get-ChildItem `
    -LiteralPath $OutputDirectory `
    -Filter 'Study-Tracker-Setup-*.exe' `
    -File `
    -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($null -eq $existingSetup) {
    throw "The source workspace is incomplete (missing package.json) and no existing setup executable was found in $OutputDirectory."
  }

  $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $existingSetup.FullName
  $checksumFile = "$($existingSetup.FullName).sha256"
  [System.IO.File]::WriteAllText(
    $checksumFile,
    "$($hash.Hash.ToLowerInvariant())  $($existingSetup.Name)`r`n",
    (New-Object System.Text.UTF8Encoding($false)))

  Write-Host ''
  Write-Host 'Windows setup created successfully (reused existing build).' 
  Write-Host "File: $($existingSetup.FullName)"
  Write-Host ("Size: {0:N1} MB" -f ($existingSetup.Length / 1MB))
  Write-Host "SHA-256: $($hash.Hash.ToLowerInvariant())"
  return
}

Push-Location $repositoryRoot
try {
  $package = Get-Content -Raw -LiteralPath $packageJsonPath |
    ConvertFrom-Json
  $version = [string]$package.version
  if ([string]::IsNullOrWhiteSpace($version)) {
    throw 'The package version is missing.'
  }

  $bun = (Get-Command bun.exe -ErrorAction Stop).Source
  $frameworkRoot = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319'
  $csc = Join-Path $frameworkRoot 'csc.exe'
  if (-not (Test-Path -LiteralPath $csc -PathType Leaf)) {
    throw 'The Windows .NET Framework C# compiler is not available.'
  }

  if ($SkipApplicationBuild) {
    Write-Host "[1/7] Reusing the existing Next.js and NestJS production output..."
  } else {
    Write-Host "[1/7] Building Next.js and NestJS production output..."
    & $bun run build
    if ($LASTEXITCODE -ne 0) {
      throw "Production build failed with exit code $LASTEXITCODE."
    }
  }

  Assert-SafeStagingPath
  if (Test-Path -LiteralPath $stagingRoot) {
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $payloadRoot | Out-Null

  Write-Host "[2/7] Bundling the NestJS API..."
  $apiOutput = Join-Path $payloadRoot 'api\main.js'
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $apiOutput) | Out-Null
  & $bun build `
    (Join-Path $repositoryRoot 'apps\api\src\main.ts') `
    --target=bun `
    --minify `
    --external '@nestjs/websockets' `
    --external '@nestjs/websockets/*' `
    --external '@nestjs/microservices' `
    --external '@nestjs/microservices/*' `
    --outfile $apiOutput
  if ($LASTEXITCODE -ne 0) {
    throw "API bundle failed with exit code $LASTEXITCODE."
  }

  Write-Host "[3/7] Collecting the standalone web application and legacy content..."
  $standalone = Join-Path $repositoryRoot 'apps\web\.next\standalone'
  $webPayload = Join-Path $payloadRoot 'web'
  Copy-DirectoryContents -Source $standalone -Destination $webPayload

  $standaloneApp = Join-Path $webPayload 'apps\web'
  Copy-DirectoryContents `
    -Source (Join-Path $repositoryRoot 'apps\web\.next\static') `
    -Destination (Join-Path $standaloneApp '.next\static')
  Copy-DirectoryContents `
    -Source (Join-Path $repositoryRoot 'apps\web\public') `
    -Destination (Join-Path $standaloneApp 'public')

  Write-Host "[4/7] Adding the embedded runtime and desktop launcher..."
  $runtimeRoot = Join-Path $payloadRoot 'runtime'
  New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
  Copy-Item -LiteralPath $bun -Destination (Join-Path $runtimeRoot 'bun.exe') -Force
  Copy-Item `
    -LiteralPath (Join-Path $scriptRoot 'runtime\launcher.ps1') `
    -Destination (Join-Path $payloadRoot 'launcher.ps1') `
    -Force
  Copy-Item `
    -LiteralPath (Join-Path $scriptRoot 'runtime\launcher.vbs') `
    -Destination (Join-Path $payloadRoot 'launcher.vbs') `
    -Force
  Install-StudyGoogleOAuthResources `
    -WorkspaceRoot $workspaceRoot `
    -ResourcesDirectory $payloadRoot

  [System.IO.File]::WriteAllText(
    (Join-Path $payloadRoot 'version.txt'),
    $version,
    (New-Object System.Text.UTF8Encoding($true)))

  $iconPath = Join-Path $payloadRoot 'app.ico'
  New-IcoFromPngFiles `
    -PngPaths @(
      (Join-Path $repositoryRoot 'apps\web\public\icons\favicon-64.png'),
      (Join-Path $repositoryRoot 'apps\web\public\icons\icon-192.png')
    ) `
    -Destination $iconPath

  Write-Host "[5/7] Compressing the offline payload..."
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  if (Test-Path -LiteralPath $payloadZip) {
    Remove-Item -LiteralPath $payloadZip -Force
  }
  [System.IO.Compression.ZipFile]::CreateFromDirectory(
    $payloadRoot,
    $payloadZip,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false)

  Write-Host "[6/7] Compiling the modern setup interface..."
  $setupSourceTemplate = Get-Content -Raw -LiteralPath (Join-Path $scriptRoot 'SetupApp.cs')
  $setupSource = $setupSourceTemplate.Replace('__VERSION__', $version)
  $compiledSource = Join-Path $stagingRoot 'SetupApp.generated.cs'
  [System.IO.File]::WriteAllText(
    $compiledSource,
    $setupSource,
    (New-Object System.Text.UTF8Encoding($true)))

  New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
  $setupFile = Join-Path $OutputDirectory "Study-Tracker-Setup-$version.exe"
  if (Test-Path -LiteralPath $setupFile) {
    Remove-Item -LiteralPath $setupFile -Force
  }

  $compilerArguments = @(
    '/nologo',
    '/target:winexe',
    '/platform:anycpu',
    '/optimize+',
    '/utf8output',
    "/out:$setupFile",
    "/win32icon:$iconPath",
    "/win32manifest:$(Join-Path $scriptRoot 'setup.manifest')",
    "/resource:$payloadZip,Payload.zip",
    "/reference:$(Join-Path $frameworkRoot 'WPF\PresentationCore.dll')",
    "/reference:$(Join-Path $frameworkRoot 'WPF\PresentationFramework.dll')",
    "/reference:$(Join-Path $frameworkRoot 'WPF\WindowsBase.dll')",
    "/reference:$(Join-Path $frameworkRoot 'System.Xaml.dll')",
    "/reference:$(Join-Path $frameworkRoot 'System.IO.Compression.dll')",
    "/reference:$(Join-Path $frameworkRoot 'System.IO.Compression.FileSystem.dll')",
    $compiledSource
  )
  & $csc @compilerArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Setup compilation failed with exit code $LASTEXITCODE."
  }

  Write-Host "[7/7] Writing release checksum..."
  $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $setupFile
  $checksumFile = "$setupFile.sha256"
  [System.IO.File]::WriteAllText(
    $checksumFile,
    "$($hash.Hash.ToLowerInvariant())  $([System.IO.Path]::GetFileName($setupFile))`r`n",
    (New-Object System.Text.UTF8Encoding($false)))

  $setupInfo = Get-Item -LiteralPath $setupFile
  Write-Host ''
  Write-Host 'Windows setup created successfully.'
  Write-Host "File: $($setupInfo.FullName)"
  Write-Host ("Size: {0:N1} MB" -f ($setupInfo.Length / 1MB))
  Write-Host "SHA-256: $($hash.Hash.ToLowerInvariant())"
} finally {
  Pop-Location
}
