@echo off
setlocal
set "APP_ROOT=%~dp0"
set "SETUP_ACTION=%~1"
if "%SETUP_ACTION%"=="" set "SETUP_ACTION=Menu"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_ROOT%scripts\setup-windows.ps1" -Action "%SETUP_ACTION%" -ScriptRoot "%APP_ROOT%scripts"
endlocal
