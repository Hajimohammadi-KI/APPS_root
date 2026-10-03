param(
  [string]$AppRoot = "",
  [int]$Port = 4332,
  [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$AppRoot = if ([string]::IsNullOrWhiteSpace($AppRoot)) {
  [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
} else {
  [IO.Path]::GetFullPath($AppRoot)
}
$bun = Join-Path $AppRoot "runtime\bun.exe"
$entry = Join-Path $AppRoot "scripts\start-local.mjs"
$dataRoot = Join-Path ([Environment]::GetFolderPath("ApplicationData")) "Research PDF Studio"
$imports = Join-Path $dataRoot "PDF Imports"
$logRoot = Join-Path $dataRoot "logs"
$version = (Get-Content -LiteralPath (Join-Path $AppRoot "version.txt") -Raw -Encoding UTF8).Trim()

foreach ($required in @($bun, $entry, (Join-Path $AppRoot "dist\server\index.js"))) {
  if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { throw "Research PDF Studio installation is incomplete: $required" }
}
New-Item -ItemType Directory -Path $imports -Force | Out-Null
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null

function Test-Ready {
  try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 2
    return $response.service -eq "research-pdf-studio" -and $response.ready -eq $true -and $response.contractVersion -eq 1
  } catch { return $false }
}

if (-not (Test-Ready)) {
  $env:PDF_READER_IMPORT_ROOT = $imports
  $env:PDF_READER_RELEASE_VERSION = $version
  $env:PORT = [string]$Port
  $stdout = Join-Path $logRoot "reader-out.log"
  $stderr = Join-Path $logRoot "reader-error.log"
  Start-Process -FilePath $bun -ArgumentList @($entry, "--hostname", "127.0.0.1", "--port", [string]$Port) -WorkingDirectory $AppRoot -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr | Out-Null
  $deadline = (Get-Date).AddSeconds(45)
  while ((Get-Date) -lt $deadline -and -not (Test-Ready)) { Start-Sleep -Milliseconds 400 }
}
if (-not (Test-Ready)) { throw "Research PDF Studio did not become ready. See $logRoot" }
if (-not $NoBrowser) { Start-Process "http://127.0.0.1:$Port/" }
