param([ValidateSet('English','German','Both')][string]$Product = 'Both')
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Request the normal WM_CLOSE path, including hidden windows created by the
# release verification launcher. Never terminate a process forcibly.
Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class LanguageAppWindows {
  public delegate bool Callback(IntPtr window, IntPtr parameter);
  [DllImport("user32.dll")] public static extern bool EnumWindows(Callback callback, IntPtr parameter);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window, out uint process);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr window, StringBuilder name, int length);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
}
'@
$paths = @()
if ($Product -in @('English','Both')) { $paths += Join-Path $env:LOCALAPPDATA 'Programs\English Grammar Automaticity Desktop\English Grammar Automaticity.exe' }
if ($Product -in @('German','Both')) { $paths += Join-Path $env:LOCALAPPDATA 'Programs\DeutschFlow\DeutschFlow.exe' }
$processes = @(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -in $paths -and $_.CommandLine -notmatch '--type=' })
$ids = @($processes | ForEach-Object { [uint32]$_.ProcessId })
$rows = [System.Collections.Generic.List[object]]::new()
$callback = [LanguageAppWindows+Callback] {
  param([IntPtr]$window, [IntPtr]$parameter)
  [uint32]$owner = 0
  [void][LanguageAppWindows]::GetWindowThreadProcessId($window, [ref]$owner)
  if ($owner -in $ids) {
    $className = [Text.StringBuilder]::new(256)
    [void][LanguageAppWindows]::GetClassName($window, $className, 256)
    if ($className.ToString() -eq 'Chrome_WidgetWin_1') {
      $sent = [LanguageAppWindows]::PostMessage($window, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)
      $rows.Add([pscustomobject]@{processId=$owner;window=$window.ToInt64();class=$className.ToString();closeRequested=$sent})
    }
  }
  return $true
}
[void][LanguageAppWindows]::EnumWindows($callback, [IntPtr]::Zero)
$rows | ConvertTo-Json
