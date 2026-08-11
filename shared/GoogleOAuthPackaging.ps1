Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-EnvValueFromFile {
  param(
    [Parameter(Mandatory = $true)][string]$EnvFile,
    [Parameter(Mandatory = $true)][string]$Name
  )

  if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) {
    return $null
  }

  $pattern = '^(?:export\s+)?' + [regex]::Escape($Name) + '\s*=\s*(.*)$'
  foreach ($line in Get-Content -LiteralPath $EnvFile) {
    if ($line -match '^\s*#') { continue }
    if ($line -match $pattern) {
      $value = $Matches[1].Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
          ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      return $value
    }
  }

  return $null
}

function Install-StudyGoogleOAuthResources {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][string]$WorkspaceRoot,
    [Parameter(Mandatory = $true)][string]$ResourcesDirectory,
    [switch]$IncludeDesktopBridge
  )

  $workspaceRoot = [System.IO.Path]::GetFullPath($WorkspaceRoot)
  $resourcesDirectory = [System.IO.Path]::GetFullPath($ResourcesDirectory)

  New-Item -ItemType Directory -Force -Path $resourcesDirectory | Out-Null

  $envFiles = @(
    (Join-Path $workspaceRoot '.env'),
    (Join-Path $workspaceRoot 'Apps\.env')
  )

  $clientId = $env:GOOGLE_CALENDAR_CLIENT_ID
  $clientSecret = $env:GOOGLE_CALENDAR_CLIENT_SECRET

  foreach ($envFile in $envFiles) {
    if ([string]::IsNullOrWhiteSpace($clientId)) {
      $clientId = Get-EnvValueFromFile -EnvFile $envFile -Name 'GOOGLE_CALENDAR_CLIENT_ID'
    }
    if ([string]::IsNullOrWhiteSpace($clientSecret)) {
      $clientSecret = Get-EnvValueFromFile -EnvFile $envFile -Name 'GOOGLE_CALENDAR_CLIENT_SECRET'
    }
  }

  $oauthConfig = [ordered]@{
    installed = [ordered]@{
      client_id = if ([string]::IsNullOrWhiteSpace($clientId)) { '' } else { $clientId }
      client_secret = if ([string]::IsNullOrWhiteSpace($clientSecret)) { '' } else { $clientSecret }
      auth_uri = 'https://accounts.google.com/o/oauth2/auth'
      token_uri = 'https://oauth2.googleapis.com/token'
      redirect_uris = @('http://127.0.0.1')
    }
  }

  $oauthJsonPath = Join-Path $resourcesDirectory 'google-oauth.json'
  $oauthConfig | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $oauthJsonPath -Encoding UTF8

  if ($IncludeDesktopBridge) {
    foreach ($bridgeName in @(
      'google-calendar-bridge.cjs',
      'learner-profile-bridge.cjs',
      'ai-provider-bridge.cjs'
    )) {
      $bridgeSource = Join-Path $workspaceRoot (Join-Path 'shared' $bridgeName)
      if (-not (Test-Path -LiteralPath $bridgeSource -PathType Leaf)) {
        throw "Required desktop bridge is missing: $bridgeSource"
      }
      Copy-Item `
        -LiteralPath $bridgeSource `
        -Destination (Join-Path $resourcesDirectory $bridgeName) `
        -Force
    }
  }
}
