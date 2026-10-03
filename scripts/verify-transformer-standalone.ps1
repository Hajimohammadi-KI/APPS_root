Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$workspace=[IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$output=Join-Path $workspace ('artifacts\transformer-standalone\'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $output -Force | Out-Null
$report=[ordered]@{status='running';scope='Production standalone servers on temporary ports; no normal profile or model activation';cases=@()}
try {
  foreach($spec in @(@{Language='en';Source='Apps\English\English-Automaticity';Port=3422},@{Language='de';Source='Apps\Deutsch-Automaticity';Port=3423})){
    $directory=Join-Path $workspace ($spec.Source+'\apps\web\.next\standalone\apps\web')
    if(-not(Test-Path -LiteralPath (Join-Path $directory 'server.js'))){throw ('Standalone entry missing: '+$directory)}
    if(Get-NetTCPConnection -LocalPort $spec.Port -State Listen -ErrorAction SilentlyContinue){throw 'Temporary verification port already occupied'}
    $startInfo=[Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName=(Get-Command bun.exe).Source
    $startInfo.Arguments='server.js'
    $startInfo.WorkingDirectory=$directory
    $startInfo.UseShellExecute=$false
    $startInfo.CreateNoWindow=$true
    $startInfo.RedirectStandardOutput=$true
    $startInfo.RedirectStandardError=$true
    $startInfo.EnvironmentVariables['PORT']=[string]$spec.Port
    $startInfo.EnvironmentVariables['HOSTNAME']='127.0.0.1'
    $startInfo.EnvironmentVariables.Remove('AUTOMATICITY_TRANSFORMER_RELEASE')
    $startInfo.EnvironmentVariables.Remove('AUTOMATICITY_TRANSFORMER_RELEASE_SHA256')
    $server=[Diagnostics.Process]::Start($startInfo)
    $stdout=$server.StandardOutput.ReadToEndAsync();$stderr=$server.StandardError.ReadToEndAsync()
    try {
      $base='http://127.0.0.1:'+$spec.Port
      $endpoint=$base+'/api/automaticity/transformer'
      $deadline=(Get-Date).AddSeconds(45);$ready=$false
      do{try{$capability=Invoke-RestMethod -Uri $endpoint -TimeoutSec 2;$ready=$true}catch{Start-Sleep -Milliseconds 250};if($server.HasExited){throw 'Standalone server exited before readiness'}}while(-not $ready -and (Get-Date) -lt $deadline)
      if(-not $ready -or $capability.enabled -ne $false -or @($capability.approvals).Count -ne 0){throw 'Unexpected standalone capability response'}
      $response=Invoke-WebRequest -Uri $endpoint -Method Post -Headers @{Origin=$base} -ContentType 'application/json' -Body '{}' -UseBasicParsing -TimeoutSec 5
      if($response.StatusCode -ne 200 -or ($response.Content|ConvertFrom-Json).reason -ne 'no_qualified_scope'){throw 'Same-origin request was not accepted with safe disabled fallback'}
      $crossStatus=$null
      try{$cross=Invoke-WebRequest -Uri $endpoint -Method Post -Headers @{Origin='https://unrelated.example'} -ContentType 'application/json' -Body '{}' -UseBasicParsing -TimeoutSec 5;$crossStatus=[int]$cross.StatusCode}catch{if($_.Exception.Response){$crossStatus=[int]$_.Exception.Response.StatusCode}else{throw}}
      if($crossStatus -ne 403){throw 'Cross-origin request was not rejected'}
      $report.cases+=@{language=$spec.Language;port=$spec.Port;capability='disabled';sameOrigin=200;crossOrigin=403}
    }finally{
      $server.Refresh();if(-not $server.HasExited){$server.Kill();$server.WaitForExit()}
      [IO.File]::WriteAllText((Join-Path $output ($spec.Language+'.stdout.log')),$stdout.GetAwaiter().GetResult())
      [IO.File]::WriteAllText((Join-Path $output ($spec.Language+'.stderr.log')),$stderr.GetAwaiter().GetResult())
      $server.Dispose()
    }
  }
  $report.status='passed'
}catch{$report.status='failed';$report.error=$_.Exception.Message;throw}finally{$report|ConvertTo-Json -Depth 5|Set-Content -LiteralPath (Join-Path $output 'report.json') -Encoding UTF8;Write-Output ('Evidence: '+$output)}
