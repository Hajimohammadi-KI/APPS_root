@echo off
setlocal
cd /d "%~dp0" || goto :failed

set "SETUP_SCRIPT=%~dp0scripts\setup-windows.ps1"
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$path=$env:SETUP_SCRIPT; $source=[IO.File]::ReadAllText($path,[Text.Encoding]::UTF8); & ([ScriptBlock]::Create($source)) -Action Uninstall -ScriptRoot (Split-Path -Parent $path)"
exit /b 0

:failed
echo.
echo Die Deinstallation konnte nicht abgeschlossen werden.
pause
exit /b 1
