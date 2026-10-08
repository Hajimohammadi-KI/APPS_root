@echo off
setlocal EnableExtensions
title English Automaticity - Start Current Version

rem Starts the production build of this project folder only. Paths are
rem relative to this file, so the folder can be copied anywhere.
set "ENGLISH=%~dp0"
if "%ENGLISH:~-1%"=="\" set "ENGLISH=%ENGLISH:~0,-1%"
set "PORT=3202"

if not exist "%ENGLISH%\apps\web\.next\standalone\apps\web\server.js" goto missing_build

netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
if not errorlevel 1 goto open

powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'node.exe' -ArgumentList @('scripts/start-standalone.mjs','--port','%PORT%','--hostname','127.0.0.1') -WorkingDirectory '%ENGLISH%' -WindowStyle Hidden"
powershell.exe -NoProfile -Command "Start-Sleep -Seconds 3"

:open
start "" "http://127.0.0.1:%PORT%/"
exit /b 0

:missing_build
echo.
echo The compiled files are missing. Run these commands in this folder first:
echo   bun install
echo   bun run build
pause
exit /b 1
