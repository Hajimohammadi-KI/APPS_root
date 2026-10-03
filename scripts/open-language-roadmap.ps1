param([switch]$NoOpen)
$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$url = 'http://127.0.0.1:3317'
try {
    $snapshot = Invoke-RestMethod -Uri "$url/snapshot" -TimeoutSec 2
    if ($snapshot.backlog.schemaVersion -ne 1 -or -not $snapshot.sourceSha256) { throw 'A different service occupies port 3317.' }
} catch {
    if (Get-NetTCPConnection -LocalPort 3317 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 3317 is occupied. Close that service before opening the roadmap.' }
    $logs = Join-Path $workspace 'artifacts/roadmap-live'
    New-Item -ItemType Directory -Force -Path $logs | Out-Null
    $bun = (Get-Command bun -ErrorAction Stop).Source
    Start-Process -FilePath $bun -ArgumentList @('scripts/language-roadmap.ts', '--serve') -WorkingDirectory $workspace -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logs 'stdout.log') -RedirectStandardError (Join-Path $logs 'stderr.log') | Out-Null
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        try { $snapshot = Invoke-RestMethod -Uri "$url/snapshot" -TimeoutSec 1; $ready = [bool]$snapshot.sourceSha256; if ($ready) { break } } catch {}
        Start-Sleep -Milliseconds 300
    }
    if (-not $ready) { throw "Roadmap did not start. See $logs\stderr.log" }
}
if (-not $NoOpen) { Start-Process -FilePath $url -WindowStyle Hidden }
