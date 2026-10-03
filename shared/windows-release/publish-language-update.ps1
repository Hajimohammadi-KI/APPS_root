param(
  [Parameter(Mandatory = $true)][string]$ProjectRoot,
  [Parameter(Mandatory = $true)][string]$ProductId,
  [Parameter(Mandatory = $true)][string]$ManifestName,
  [Parameter(Mandatory = $true)][string]$SetupFile,
  [Parameter(Mandatory = $true)][string]$PayloadFile,
  [Parameter(Mandatory = $true)][string]$ReleaseSlug
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-Sha256Hex([string]$Path) {
  $stream = [IO.File]::OpenRead($Path)
  $algorithm = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '') }
  finally { $algorithm.Dispose(); $stream.Dispose() }
}
$ProjectRoot = [IO.Path]::GetFullPath($ProjectRoot)
$config = Get-Content -LiteralPath (Join-Path $ProjectRoot "distribution\windows-modern\setup.config.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$version = [string]$config.version
$workspace = [IO.DirectoryInfo]$ProjectRoot
while ($workspace -and -not (Test-Path -LiteralPath (Join-Path $workspace.FullName "shared\windows-release") -PathType Container)) { $workspace = $workspace.Parent }
if (-not $workspace) { throw "Workspace root was not found." }
$releaseRoot = Join-Path $workspace.FullName "releases"
New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
$setupPath = Join-Path $ProjectRoot $SetupFile
$payloadPath = Join-Path $ProjectRoot $PayloadFile
$releaseConfigPath = Join-Path $ProjectRoot "distribution\windows-modern\language-release-config.json"
$fallbackSetupPath = Join-Path $workspace.FullName "shared\windows-release\setup-language-payload.ps1"
foreach ($path in @($setupPath, $payloadPath, $releaseConfigPath, $fallbackSetupPath)) { if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Release input is missing: $path" } }
$releaseConfig = Get-Content -LiteralPath $releaseConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$releaseConfig.version -ne $version -or [string]$releaseConfig.productId -ne $ProductId) { throw "Language release configuration does not match setup.config.json." }
$packageName = "$ProductId-$version-Windows.zip"
$packagePath = Join-Path $releaseRoot $packageName
if (Test-Path -LiteralPath $packagePath) { Remove-Item -LiteralPath $packagePath -Force }
$staging = Join-Path ([IO.Path]::GetTempPath()) ("language-release-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $staging -Force | Out-Null
try {
  Copy-Item -LiteralPath $setupPath, $payloadPath -Destination $staging -Force
  Copy-Item -LiteralPath $releaseConfigPath -Destination (Join-Path $staging "language-release-config.json") -Force
  Copy-Item -LiteralPath $fallbackSetupPath -Destination (Join-Path $staging "setup-language-payload.ps1") -Force
  $batch = @"
@echo off
setlocal
set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=Menu"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-language-payload.ps1" -Action "%ACTION%" -Configuration "%~dp0language-release-config.json" -PayloadPath "%~dp0$PayloadFile"
endlocal
"@
  [IO.File]::WriteAllText((Join-Path $staging "SETUP-WINDOWS.bat"), $batch, [Text.Encoding]::ASCII)
  Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $packagePath -CompressionLevel Optimal
} finally {
  if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
}
$batchStaging = Join-Path ([IO.Path]::GetTempPath()) ("language-setup-" + [Guid]::NewGuid().ToString("N") + ".bat")
$batchForHash = @"
@echo off
setlocal
set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=Menu"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-language-payload.ps1" -Action "%ACTION%" -Configuration "%~dp0language-release-config.json" -PayloadPath "%~dp0$PayloadFile"
endlocal
"@
[IO.File]::WriteAllText($batchStaging, $batchForHash, [Text.Encoding]::ASCII)
$manifest = [ordered]@{
  schemaVersion = 1; productId = $ProductId; version = $version; publishedAt = (Get-Date -Format "yyyy-MM-dd")
  fileName = $packageName; localPackagePath = $packageName
  downloadUrl = "https://github.com/Hajimohammadi-KI/APPS_root_new/releases/download/$ReleaseSlug-v$version/$packageName"
  sha256 = Get-Sha256Hex $packagePath
  setupFile = "SETUP-WINDOWS.bat"; setupSha256 = Get-Sha256Hex $batchStaging
  payloadFile = $PayloadFile; payloadSha256 = Get-Sha256Hex $payloadPath
  integrity = "sha256"; codeSigningStatus = "not-signed"
  releaseNotes = @("Asks before installing a new version", "Verifies the package and both installer files with SHA-256", "Preserves learning data during update and repair")
}
$null = Remove-Item -LiteralPath $batchStaging -Force
$manifestPath = Join-Path $releaseRoot $ManifestName
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
[pscustomobject]@{version=$version;package=$packagePath;manifest=$manifestPath;sha256=$manifest.sha256;bytes=(Get-Item -LiteralPath $packagePath).Length} | ConvertTo-Json
