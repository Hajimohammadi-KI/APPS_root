@echo off
setlocal
cd /d "%~dp0" || goto :failed

where powershell.exe >nul 2>nul || goto :powershell_missing

set "SETUP_SCRIPT=%~dp0scripts\setup-windows.ps1"
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$path=$env:SETUP_SCRIPT; $source=[IO.File]::ReadAllText($path,[Text.Encoding]::UTF8); & ([ScriptBlock]::Create($source)) -Action Menu -ScriptRoot (Split-Path -Parent $path)"
exit /b 0

:powershell_missing
echo Windows PowerShell wurde nicht gefunden.

:failed
echo.
echo Das Setup konnte nicht abgeschlossen werden.
pause
exit /b 1
