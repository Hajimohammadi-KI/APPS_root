[CmdletBinding()]
param(
  [string]$Version = '7.5.5'
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = [System.IO.Path]::GetFullPath(
  (Join-Path $scriptRoot '..\..'))
$outputDir = Join-Path $repositoryRoot 'release\windows'
$staging = Join-Path $outputDir '.staging'
$payloadRoot = Join-Path $staging 'payload'
$payloadZip = Join-Path $staging 'payload.zip'
$setupSource = Join-Path $staging 'SetupApp.generated.cs'
$manifest = Join-Path $scriptRoot 'setup.manifest'
$icon = Join-Path $payloadRoot 'app.ico'
$frameworkRoot = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319'
$csc = Join-Path $frameworkRoot 'csc.exe'
$setupFile = Join-Path $outputDir "Study-Tracker-Setup-$Version.exe"

if (-not (Test-Path -LiteralPath $payloadRoot -PathType Container)) {
  throw "Staging payload not found: $payloadRoot"
}
if (-not (Test-Path -LiteralPath $setupSource -PathType Leaf)) {
  throw "Generated setup source not found: $setupSource"
}
if (-not (Test-Path -LiteralPath $csc -PathType Leaf)) {
  throw 'The Windows .NET Framework C# compiler is not available.'
}

if (Test-Path -LiteralPath $payloadZip) {
  Remove-Item -LiteralPath $payloadZip -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
  $payloadRoot,
  $payloadZip,
  [System.IO.Compression.CompressionLevel]::Optimal,
  $false)

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
  "/win32icon:$icon",
  "/win32manifest:$manifest",
  "/resource:$payloadZip,Payload.zip",
  "/reference:$(Join-Path $frameworkRoot 'WPF\PresentationCore.dll')",
  "/reference:$(Join-Path $frameworkRoot 'WPF\PresentationFramework.dll')",
  "/reference:$(Join-Path $frameworkRoot 'WPF\WindowsBase.dll')",
  "/reference:$(Join-Path $frameworkRoot 'System.Xaml.dll')",
  "/reference:$(Join-Path $frameworkRoot 'System.IO.Compression.dll')",
  "/reference:$(Join-Path $frameworkRoot 'System.IO.Compression.FileSystem.dll')",
  $setupSource
)

& $csc @compilerArguments
if ($LASTEXITCODE -ne 0) {
  throw "Setup compilation failed with exit code $LASTEXITCODE."
}

$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $setupFile
$checksumFile = "$setupFile.sha256"
[System.IO.File]::WriteAllText(
  $checksumFile,
  "$($hash.Hash.ToLowerInvariant())  $([System.IO.Path]::GetFileName($setupFile))`r`n",
  (New-Object System.Text.UTF8Encoding($false)))

Write-Host ''
Write-Host 'Windows setup created successfully from the existing staging payload.'
Write-Host "File: $setupFile"
Write-Host "SHA-256: $($hash.Hash.ToLowerInvariant())"
