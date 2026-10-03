param([switch]$SkipBuild)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
function Get-Sha256Hex([string]$Path) {
  $stream = [IO.File]::OpenRead($Path)
  $algorithm = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '') }
  finally { $algorithm.Dispose(); $stream.Dispose() }
}
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$workspaceRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot "..\..\.."))
$package = Get-Content -LiteralPath (Join-Path $projectRoot "package.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$version = [string]$package.version
$artifactRoot = Join-Path $workspaceRoot "artifacts\research-pdf-studio-$version"
$releaseRoot = Join-Path $workspaceRoot "releases"
$zipPath = Join-Path $releaseRoot "ResearchPDFStudio-$version-Windows.zip"

if (-not $SkipBuild) { Push-Location $projectRoot; try { & bun run build; if ($LASTEXITCODE -ne 0) { throw "PDF Reader build failed." } } finally { Pop-Location } }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "dist\server\index.js") -PathType Leaf)) { throw "Verified Reader build is missing." }
if (Test-Path -LiteralPath $artifactRoot) { Remove-Item -LiteralPath $artifactRoot -Recurse -Force }
New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null
foreach ($directory in @("dist", "resources")) { Copy-Item -LiteralPath (Join-Path $projectRoot $directory) -Destination (Join-Path $artifactRoot $directory) -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $artifactRoot "scripts") -Force | Out-Null
foreach ($file in @("start-local.mjs", "start-windows.ps1", "setup-windows.ps1")) { Copy-Item -LiteralPath (Join-Path $projectRoot "scripts\$file") -Destination (Join-Path $artifactRoot "scripts\$file") -Force }
foreach ($file in @("package.json", "START-WINDOWS.bat", "SETUP-WINDOWS.bat", "UPDATE-CHECK-WINDOWS.bat", "UNINSTALL-WINDOWS.bat")) { Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination (Join-Path $artifactRoot $file) -Force }
Copy-Item -LiteralPath (Join-Path $workspaceRoot "shared\windows-release\check-for-updates.ps1") -Destination (Join-Path $artifactRoot "resources\update\check-for-updates.ps1") -Force
New-Item -ItemType Directory -Path (Join-Path $artifactRoot "runtime") -Force | Out-Null
Copy-Item -LiteralPath (Get-Command bun.exe).Source -Destination (Join-Path $artifactRoot "runtime\bun.exe") -Force
[IO.File]::WriteAllText((Join-Path $artifactRoot "version.txt"), $version, [Text.UTF8Encoding]::new($false))
New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
Compress-Archive -Path (Join-Path $artifactRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal

$setupHash = Get-Sha256Hex (Join-Path $artifactRoot "SETUP-WINDOWS.bat")
$packageHash = Get-Sha256Hex (Join-Path $artifactRoot "package.json")
$zipHash = Get-Sha256Hex $zipPath
$manifest = [ordered]@{
  schemaVersion = 1; productId = "ResearchPDFStudio"; version = $version; publishedAt = (Get-Date -Format "yyyy-MM-dd")
  fileName = [IO.Path]::GetFileName($zipPath); localPackagePath = [IO.Path]::GetFileName($zipPath)
  downloadUrl = "https://github.com/Hajimohammadi-KI/APPS_root_new/releases/download/research-pdf-studio-v$version/$([IO.Path]::GetFileName($zipPath))"
  sha256 = $zipHash; setupFile = "SETUP-WINDOWS.bat"; setupSha256 = $setupHash; payloadFile = "package.json"; payloadSha256 = $packageHash
  integrity = "sha256"; codeSigningStatus = "not-signed"
  releaseNotes = @("Consent-based update checks", "Per-user install, repair, and uninstall", "PDFs and reader data remain separate from program files")
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $releaseRoot "research-pdf-studio-update.json") -Encoding UTF8
[pscustomobject]@{version=$version;package=$zipPath;sha256=$zipHash;bytes=(Get-Item -LiteralPath $zipPath).Length} | ConvertTo-Json
