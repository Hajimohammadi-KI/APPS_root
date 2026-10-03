param([switch]$Stop)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$folder = Join-Path $workspace 'artifacts\transformer-local'
$record = Join-Path $folder 'owned-processes.json'
$executable = Join-Path $folder 'runtime\llama-server.exe'
if ($Stop) {
  if (-not (Test-Path -LiteralPath $record)) { throw 'No launcher-owned process record exists.' }
  $owned = Get-Content -LiteralPath $record -Raw | ConvertFrom-Json
  foreach ($entry in @($owned.processes)) {
    $running = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + [int]$entry.processId)
    if ($running) {
      if ($running.ExecutablePath -ne $entry.executable -or $running.CommandLine -ne $entry.commandLine -or $running.CreationDate.ToUniversalTime().ToString('o') -ne $entry.createdAt) { throw 'Process identity changed; no stop was performed for this entry.' }
      Stop-Process -Id $running.ProcessId
    }
  }
  Write-Output 'Stopped the two launcher-owned diagnostic processes.'
  exit
}
$model = Join-Path $folder 'Qwen3-8B-Q4_K_M.gguf'
$runtimeZip = Join-Path $folder 'runtime.zip'
$config = Get-Content -LiteralPath (Join-Path $workspace 'docs\model-evaluation\transformer-candidate.json') -Raw | ConvertFrom-Json
if ((Get-FileHash -LiteralPath $model -Algorithm SHA256).Hash.ToLowerInvariant() -ne $config.modelSha256) { throw 'Model bytes differ from the pinned candidate.' }
if ((Get-FileHash -LiteralPath $runtimeZip -Algorithm SHA256).Hash -ne '97E50B3EF0CDD2CB4D5AFD446A9006B3496BEE6C0D0BA7083D32F36075771870') { throw 'Runtime archive differs from the official release.' }
# Check every extracted runtime binary against the already verified archive.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead($runtimeZip)
try {
  foreach ($entry in $archive.Entries) {
    if (-not $entry.Name) { continue }
    $path = [IO.Path]::GetFullPath((Join-Path (Join-Path $folder 'runtime') $entry.FullName))
    $prefix = [IO.Path]::GetFullPath((Join-Path $folder 'runtime')).TrimEnd('\') + '\'
    if (-not $path.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected runtime archive path.' }
    $stream = $entry.Open(); $hasher = [Security.Cryptography.SHA256]::Create()
    try { $expected = [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-','') } finally { $stream.Dispose(); $hasher.Dispose() }
    if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne $expected) { throw ('Extracted runtime changed: ' + $entry.FullName) }
  }
} finally { $archive.Dispose() }
foreach ($port in @(8082,8083)) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw ('Port already in use: ' + $port) }
}
$arguments = @('-m',('"'+$model+'"'),'--alias',$config.modelAlias,'--host','127.0.0.1','--port','8083','-ngl','99','-c','8192','--parallel','1','--jinja','--no-webui','--cors-origins','http://127.0.0.1:8082','--no-cors-credentials')
$processes = @()
try {
  $server = Start-Process -FilePath $executable -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $folder 'launcher-server.stdout.log') -RedirectStandardError (Join-Path $folder 'launcher-server.stderr.log')
  $processes += $server
  $deadline = (Get-Date).AddSeconds(55); $ready = $false
  do {
    try { $props=Invoke-RestMethod 'http://127.0.0.1:8083/props' -TimeoutSec 2; $ready=$true } catch { Start-Sleep -Milliseconds 300 }
    $server.Refresh(); if ($server.HasExited) { throw 'Local model server exited; inspect its stderr log.' }
  } while (-not $ready -and (Get-Date) -lt $deadline)
  if (-not $ready -or $props.build_info -ne $config.runtimeFingerprint -or [IO.Path]::GetFullPath($props.model_path) -ne $model) { throw 'Runtime identity/readiness verification failed.' }
  $bridge = Start-Process -FilePath (Get-Command bun.exe).Source -ArgumentList @('scripts/serve-local-transformer.ts') -WorkingDirectory $workspace -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $folder 'launcher-bridge.stdout.log') -RedirectStandardError (Join-Path $folder 'launcher-bridge.stderr.log')
  $processes += $bridge
  $entries = @($processes | ForEach-Object { $info=Get-CimInstance Win32_Process -Filter ('ProcessId = '+$_.Id); [ordered]@{processId=$info.ProcessId;executable=$info.ExecutablePath;commandLine=$info.CommandLine;createdAt=$info.CreationDate.ToUniversalTime().ToString('o')} })
  [ordered]@{createdAt=(Get-Date).ToUniversalTime().ToString('o');qualified=$false;processes=$entries} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $record -Encoding UTF8
  Write-Output 'Local diagnostic candidate started. No learner assessment scope is activated. Stop with this script -Stop.'
} catch {
  foreach ($process in $processes) { $process.Refresh(); if (-not $process.HasExited) { $process.Kill() } }
  throw
}
