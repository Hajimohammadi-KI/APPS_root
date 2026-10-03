@echo off
setlocal
set "APP_ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_ROOT%scripts\setup-windows.ps1" -Action Uninstall -ScriptRoot "%APP_ROOT%scripts"
endlocal
