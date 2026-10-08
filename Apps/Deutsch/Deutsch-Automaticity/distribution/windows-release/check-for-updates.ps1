param(
  [string]$Configuration = "",
  [string]$InstalledRoot = "",
  [string]$ManifestSource = "",
  [switch]$Automatic,
  [switch]$ForcePrompt,
  [switch]$NoDialogs,
  [switch]$CheckOnly,
  [string]$UpdateRootOverride = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.IO.Compression.FileSystem

if ([string]::IsNullOrWhiteSpace($Configuration)) {
  $Configuration = Join-Path $PSScriptRoot "update-config.json"
}
$Configuration = [IO.Path]::GetFullPath($Configuration)
if (-not (Test-Path -LiteralPath $Configuration -PathType Leaf)) {
  throw "Update configuration was not found: $Configuration"
}
$config = Get-Content -LiteralPath $Configuration -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($required in @(
    "productId", "productName", "versionFile", "dataFolder", "environmentPrefix",
    "defaultManifestUrl", "localManifestPath", "setupFile", "payloadFile", "locale")) {
  if ([string]::IsNullOrWhiteSpace([string]$config.$required)) {
    throw "Update configuration value '$required' is required."
  }
}

$AppName = [string]$config.productName
$ProductId = [string]$config.productId
$IsGerman = [string]::Equals([string]$config.locale, "de", [StringComparison]::OrdinalIgnoreCase)
$AppRoot = if ([string]::IsNullOrWhiteSpace($InstalledRoot)) {
  [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
} else {
  [IO.Path]::GetFullPath($InstalledRoot)
}
$UserDataRoot = Join-Path ([Environment]::GetFolderPath("ApplicationData")) ([string]$config.dataFolder)
$UpdateRoot = if ([string]::IsNullOrWhiteSpace($UpdateRootOverride)) {
  Join-Path $env:LOCALAPPDATA ("{0}-Updates" -f $ProductId)
} else {
  [IO.Path]::GetFullPath($UpdateRootOverride)
}
$StatePath = Join-Path $UserDataRoot "update-state.json"
$UpdateLog = Join-Path $UserDataRoot "update-check.log"

function T([string]$German, [string]$English) {
  if ($IsGerman) { return $German }
  return $English
}

function Get-Sha256Hex([string]$Path) {
  $stream = [IO.File]::OpenRead($Path)
  $algorithm = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '') }
  finally { $algorithm.Dispose(); $stream.Dispose() }
}

function Write-UpdateLog([string]$Message) {
  New-Item -ItemType Directory -Path $UserDataRoot -Force | Out-Null
  Add-Content -LiteralPath $UpdateLog -Value ("[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message) -Encoding UTF8
}

function Show-Info([string]$Message) {
  if ($NoDialogs) { Write-Host $Message; return }
  [void][Windows.Forms.MessageBox]::Show(
    $Message, $AppName, [Windows.Forms.MessageBoxButtons]::OK,
    [Windows.Forms.MessageBoxIcon]::Information)
}

function Show-Error([string]$Message) {
  if ($Automatic) { Write-UpdateLog ((T "Update-Prüfung fehlgeschlagen: " "Update check failed: ") + $Message); return }
  if ($NoDialogs) { Write-Host $Message -ForegroundColor Red; return }
  [void][Windows.Forms.MessageBox]::Show(
    $Message, "$AppName - Update", [Windows.Forms.MessageBoxButtons]::OK,
    [Windows.Forms.MessageBoxIcon]::Error)
}

function ConvertTo-AppVersion([string]$Value) {
  $match = [Regex]::Match($Value, "^\s*(\d+)\.(\d+)\.(\d+)")
  if (-not $match.Success) { throw ((T "Ungültige Versionsnummer: " "Invalid version: ") + $Value) }
  return [Version]::new([int]$match.Groups[1].Value, [int]$match.Groups[2].Value, [int]$match.Groups[3].Value)
}

function Get-InstalledVersion {
  $path = Join-Path $AppRoot ([string]$config.versionFile)
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $null }
  return (Get-Content -LiteralPath $path -Raw -Encoding UTF8).Trim()
}

function Read-State {
  if (-not (Test-Path -LiteralPath $StatePath -PathType Leaf)) { return $null }
  try { return Get-Content -LiteralPath $StatePath -Raw -Encoding UTF8 | ConvertFrom-Json } catch { return $null }
}

function Write-State([string]$OfferedVersion, [string]$Decision) {
  New-Item -ItemType Directory -Path $UserDataRoot -Force | Out-Null
  [ordered]@{
    schemaVersion = 1
    productId = $ProductId
    currentVersion = Get-InstalledVersion
    lastOfferedVersion = $OfferedVersion
    lastDecision = $Decision
    lastCheckedAt = (Get-Date).ToUniversalTime().ToString("o")
  } | ConvertTo-Json | Set-Content -LiteralPath $StatePath -Encoding UTF8
}

function Assert-TrustedHttps([string]$Value, [string[]]$AllowedHosts) {
  $uri = [Uri]$Value
  if (-not $uri.IsAbsoluteUri -or $uri.Scheme -ne "https") {
    throw (T "Remote-Update-Adressen müssen HTTPS verwenden." "Remote update addresses must use HTTPS.")
  }
  if ($AllowedHosts -notcontains $uri.Host.ToLowerInvariant()) {
    throw ((T "Nicht vertrauenswürdiger Update-Host: " "Untrusted update host: ") + $uri.Host)
  }
  return $uri
}

function Resolve-Manifest {
  if (-not [string]::IsNullOrWhiteSpace($ManifestSource)) { return $ManifestSource }
  $environmentName = ([string]$config.environmentPrefix) + "_UPDATE_MANIFEST"
  $environmentValue = [Environment]::GetEnvironmentVariable($environmentName)
  if (-not [string]::IsNullOrWhiteSpace($environmentValue)) { return $environmentValue }
  $local = [Environment]::ExpandEnvironmentVariables([string]$config.localManifestPath)
  if (Test-Path -LiteralPath $local -PathType Leaf) { return [IO.Path]::GetFullPath($local) }
  return [string]$config.defaultManifestUrl
}

function Get-Manifest {
  $source = Resolve-Manifest
  $isRemote = $source -match '^https://'
  if ($isRemote) {
    [void](Assert-TrustedHttps $source @("raw.githubusercontent.com"))
    $manifest = Invoke-RestMethod -Uri $source -Headers @{"User-Agent"="$ProductId-Updater";"Cache-Control"="no-cache"} -TimeoutSec 20
    $base = $null
  } else {
    $source = [IO.Path]::GetFullPath($source)
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw (T "Lokales Update-Manifest fehlt." "Local update manifest is missing.") }
    $manifest = Get-Content -LiteralPath $source -Raw -Encoding UTF8 | ConvertFrom-Json
    $base = Split-Path -Parent $source
  }
  if ($manifest.schemaVersion -ne 1 -or [string]$manifest.productId -ne $ProductId) {
    throw (T "Das Update-Manifest gehört nicht zu dieser Anwendung." "The update manifest belongs to another application.")
  }
  [void](ConvertTo-AppVersion ([string]$manifest.version))
  foreach ($hashName in @("sha256", "setupSha256", "payloadSha256")) {
    if ([string]$manifest.$hashName -notmatch '^[A-Fa-f0-9]{64}$') { throw ((T "Ungültiger SHA-256-Wert: " "Invalid SHA-256 value: ") + $hashName) }
  }
  if ([string]$manifest.setupFile -ne [string]$config.setupFile -or [string]$manifest.payloadFile -ne [string]$config.payloadFile) {
    throw (T "Die Dateinamen des Update-Pakets stimmen nicht." "The update package filenames do not match.")
  }
  return @{ Manifest = $manifest; IsRemote = $isRemote; Base = $base }
}

function Expand-SafeArchive([string]$ArchivePath, [string]$Destination) {
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  $root = [IO.Path]::GetFullPath($Destination).TrimEnd('\') + '\'
  $archive = [IO.Compression.ZipFile]::OpenRead($ArchivePath)
  try {
    foreach ($entry in $archive.Entries) {
      $target = [IO.Path]::GetFullPath((Join-Path $Destination $entry.FullName))
      if (-not $target.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { throw (T "Ungültiger Pfad im Update-Paket." "Invalid path in update package.") }
      if ([string]::IsNullOrEmpty($entry.Name)) { New-Item -ItemType Directory -Path $target -Force | Out-Null; continue }
      New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
      [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
    }
  } finally { $archive.Dispose() }
}

function Assert-PayloadVersion([string]$Payload, [string]$ExpectedVersion) {
  if ([string]$config.packageKind -eq "powershell") {
    $package = Get-Content -LiteralPath $Payload -Raw -Encoding UTF8 | ConvertFrom-Json
    if ([string]$package.version -ne $ExpectedVersion) {
      throw (T "Paket-Version und Manifest stimmen nicht überein." "Package version and manifest do not match.")
    }
    return
  }
  $archive = [IO.Compression.ZipFile]::OpenRead($Payload)
  try {
    $entries = @($archive.Entries | Where-Object { $_.FullName.Replace('\','/') -eq 'version.txt' })
    if ($entries.Count -ne 1) { throw (T "Versionsdatei im Payload fehlt." "Payload version file is missing.") }
    $reader = New-Object IO.StreamReader($entries[0].Open(), [Text.Encoding]::UTF8)
    try { $actual = $reader.ReadToEnd().Trim() } finally { $reader.Dispose() }
    if ($actual -ne $ExpectedVersion) { throw (T "Payload-Version und Manifest stimmen nicht überein." "Payload version and manifest do not match.") }
  } finally { $archive.Dispose() }
}

function Copy-Or-DownloadPackage($ManifestInfo, [string]$Destination) {
  $manifest = $ManifestInfo.Manifest
  if ($ManifestInfo.IsRemote) {
    [void](Assert-TrustedHttps ([string]$manifest.downloadUrl) @("github.com", "objects.githubusercontent.com", "raw.githubusercontent.com"))
    Invoke-WebRequest -Uri ([string]$manifest.downloadUrl) -UseBasicParsing -OutFile $Destination -TimeoutSec 600
  } else {
    $relative = [string]$manifest.localPackagePath
    if ([string]::IsNullOrWhiteSpace($relative) -or [IO.Path]::IsPathRooted($relative) -or $relative.Contains("..")) {
      throw (T "Lokaler Paketpfad im Manifest ist ungültig." "Local package path in the manifest is invalid.")
    }
    Copy-Item -LiteralPath (Join-Path $ManifestInfo.Base $relative) -Destination $Destination -Force
  }
}

function Start-VerifiedUpdate($ManifestInfo) {
  $manifest = $ManifestInfo.Manifest
  New-Item -ItemType Directory -Path $UpdateRoot -Force | Out-Null
  $download = Join-Path $UpdateRoot ([IO.Path]::GetFileName([string]$manifest.fileName))
  $staging = Join-Path $UpdateRoot ("staging-" + [Guid]::NewGuid().ToString("N"))
  try {
    Copy-Or-DownloadPackage $ManifestInfo $download
    $item = Get-Item -LiteralPath $download
    if ($item.Length -le 0 -or $item.Length -gt 1GB) { throw (T "Unerwartete Paketgröße." "Unexpected update package size.") }
    $actual = Get-Sha256Hex $download
    if (-not $actual.Equals([string]$manifest.sha256, [StringComparison]::OrdinalIgnoreCase)) { throw (T "SHA-256-Prüfung des Pakets fehlgeschlagen." "Package SHA-256 verification failed.") }
    Expand-SafeArchive $download $staging
    $setup = Join-Path $staging ([string]$manifest.setupFile)
    $payload = Join-Path $staging ([string]$manifest.payloadFile)
    foreach ($pair in @(@($setup,[string]$manifest.setupSha256), @($payload,[string]$manifest.payloadSha256))) {
      if (-not (Test-Path -LiteralPath $pair[0] -PathType Leaf)) { throw (T "Update-Paket ist unvollständig." "The update package is incomplete.") }
      $fileHash = Get-Sha256Hex $pair[0]
      if (-not $fileHash.Equals($pair[1], [StringComparison]::OrdinalIgnoreCase)) { throw (T "Dateiprüfung des Update-Pakets fehlgeschlagen." "Update file verification failed.") }
      Unblock-File -LiteralPath $pair[0] -ErrorAction SilentlyContinue
    }
    Assert-PayloadVersion $payload ([string]$manifest.version)
    Write-State ([string]$manifest.version) "accepted"
    $setupArguments = if ([string]$config.packageKind -like "powershell*") { "Update" } else { "--update" }
    Start-Process -FilePath $setup -ArgumentList $setupArguments -WorkingDirectory $staging | Out-Null
    Write-UpdateLog ((T "Geprüftes Setup geöffnet: " "Verified setup opened: ") + [string]$manifest.version)
  } catch {
    if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path -LiteralPath $download) { Remove-Item -LiteralPath $download -Force -ErrorAction SilentlyContinue }
    throw
  }
}

try {
  $disableName = ([string]$config.environmentPrefix) + "_DISABLE_UPDATE_CHECK"
  if ([Environment]::GetEnvironmentVariable($disableName) -eq "1") { exit 0 }
  $current = Get-InstalledVersion
  if ([string]::IsNullOrWhiteSpace($current)) { throw (T "Installierte Versionsnummer fehlt. Bitte Reparatur ausführen." "Installed version is missing. Please run Repair.") }
  $manifestInfo = Get-Manifest
  $manifest = $manifestInfo.Manifest
  $remote = [string]$manifest.version
  if ((ConvertTo-AppVersion $remote) -le (ConvertTo-AppVersion $current)) {
    Write-State $remote "current"
    Write-UpdateLog ((T "Aktuell: " "Current: ") + $current)
    if (-not $Automatic -and -not $CheckOnly) { Show-Info ((T "Die installierte Version ist aktuell: " "The installed version is current: ") + $current) }
    exit 0
  }

  if ($CheckOnly -or $NoDialogs) {
    [pscustomobject]@{updateAvailable=$true;currentVersion=$current;availableVersion=$remote;source=(Resolve-Manifest)} | ConvertTo-Json
    exit 20
  }
  $state = Read-State
  if ($Automatic -and -not $ForcePrompt -and $state -and $state.lastOfferedVersion -eq $remote -and $state.lastDecision -eq "later") { exit 0 }
  $notes = if ($manifest.releaseNotes -is [Array]) { (($manifest.releaseNotes | ForEach-Object { "• $_" }) -join "`n") } else { "" }
  $question = T `
    "Eine neue Version ist verfügbar.`n`nInstalliert: $current`nNeu: $remote`n`n$notes`n`nJetzt prüfen und aktualisieren? Das Update startet nur mit Ihrer Zustimmung. Ihre Daten bleiben erhalten." `
    "A new version is available.`n`nInstalled: $current`nNew: $remote`n`n$notes`n`nVerify and update now? The update starts only with your consent. Your data is preserved."
  $answer = [Windows.Forms.MessageBox]::Show($question, "$AppName - Update", [Windows.Forms.MessageBoxButtons]::YesNo, [Windows.Forms.MessageBoxIcon]::Information)
  if ($answer -ne [Windows.Forms.DialogResult]::Yes) { Write-State $remote "later"; exit 0 }
  Start-VerifiedUpdate $manifestInfo
  exit 10
} catch {
  Show-Error $_.Exception.Message
  if ($Automatic) { exit 0 }
  exit 1
}
