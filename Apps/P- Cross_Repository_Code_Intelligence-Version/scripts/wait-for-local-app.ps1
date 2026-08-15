param(
  [string]$HealthUrl = "http://127.0.0.1:4312/api/state",
  [string]$OpenUrl = "http://127.0.0.1:4312/",
  [int]$TimeoutSeconds = 120
)

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

do {
  try {
    $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
      Start-Process $OpenUrl
      exit 0
    }
  }
  catch {
    # The local server is still starting. Keep waiting.
  }

  Start-Sleep -Seconds 1
} while ((Get-Date) -lt $deadline)

Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show(
  "Der lokale Server wurde nicht rechtzeitig bereit. Bitte lies die Fehlermeldung im schwarzen Fenster.",
  "Cross Repository Code Intelligence Version2"
)
exit 1
