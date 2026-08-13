@echo off
setlocal
cd /d "%~dp0" || goto :failed

if not exist "dist\server\index.js" goto :not_installed

echo Research PDF Studio wird gestartet ...
echo Bitte dieses Fenster geoeffnet lassen.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local-app.ps1"
if errorlevel 1 goto :failed
exit /b 0

:not_installed
echo Die App ist noch nicht installiert.
echo Bitte zuerst SETUP-WINDOWS.bat ausfuehren.
goto :failed

:failed
pause
exit /b 1
