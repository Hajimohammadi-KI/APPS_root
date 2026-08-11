@echo off
setlocal
cd /d "%~dp0" || goto :failed

where node >nul 2>nul || goto :node_missing
if not exist "node_modules\.bin\bun.cmd" goto :not_installed
if not exist "dist\server\index.js" goto :not_built
if not exist "apps\api\dist\main.js" goto :not_built

powershell.exe -NoProfile -Command "try { $web = Invoke-WebRequest -Uri 'http://127.0.0.1:4312/api/state' -UseBasicParsing -TimeoutSec 2; $api = Invoke-WebRequest -Uri 'http://127.0.0.1:4313/v1/health' -UseBasicParsing -TimeoutSec 2; if ($web.StatusCode -eq 200 -and $api.StatusCode -eq 200) { exit 0 } } catch { }; exit 1" >nul 2>nul
if not errorlevel 1 (
  start "" "http://127.0.0.1:4312/"
  exit /b 0
)

call node scripts\generate-local-env.mjs
if errorlevel 1 goto :failed

echo Starte Cross Repository Code Intelligence Version2 lokal auf Port 4312...
echo Bitte dieses Fenster geoeffnet lassen.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local-app.ps1"
if errorlevel 1 goto :server_failed
exit /b 0

:node_missing
echo Node.js 22.13.0 oder neuer ist nicht installiert.
goto :failed

:not_installed
echo Bitte zuerst SETUP-WINDOWS.bat ausfuehren und Erstinstallation waehlen.
goto :failed

:not_built
echo Die kompilierten Programmdateien fehlen.
echo Bitte SETUP-WINDOWS.bat ausfuehren und Reparieren waehlen.
goto :failed

:server_failed
echo.
echo Der lokale Server konnte nicht gestartet werden oder wurde beendet.
echo Das Startprotokoll liegt unter runtime-startup.log.
echo Bitte SETUP-WINDOWS.bat ausfuehren und Reparieren waehlen.

:failed
pause
exit /b 1
