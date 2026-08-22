@echo off
setlocal EnableExtensions
title English Automaticity - Start Current Version

set "ROOT=D:\APPS_root"
set "ENGLISH=%ROOT%\Apps\English\English-07082026"
set "PDF=%ROOT%\Apps\Apps-For-Integeration\Reader-PDF-App"
set "SETTINGS=%ROOT%\Apps\Apps-For-Integeration\Einstellungen-APP"

if not exist "%ENGLISH%\apps\web\.next\standalone\apps\web\server.js" goto missing_build
if not exist "%PDF%\dist\server\index.js" goto missing_build
if not exist "%SETTINGS%\dist\server\index.js" goto missing_build

call :start_if_closed 3202 english
call :start_if_closed 4332 pdf
call :start_if_closed 4323 settings

powershell.exe -NoProfile -Command "Start-Sleep -Seconds 3"
start "" "%ROOT%\index.html"
exit /b 0

:start_if_closed
netstat -ano | findstr /r /c:":%~1 .*LISTENING" >nul
if not errorlevel 1 exit /b 0

if /i "%~2"=="english" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'node.exe' -ArgumentList @('scripts/start-standalone.mjs','--port','3202','--hostname','127.0.0.1') -WorkingDirectory '%ENGLISH%' -WindowStyle Hidden"
if /i "%~2"=="pdf" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'bun.exe' -ArgumentList @('run','start','--port','4332') -WorkingDirectory '%PDF%' -WindowStyle Hidden"
if /i "%~2"=="settings" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'bun.exe' -ArgumentList @('run','start','--port','4323') -WorkingDirectory '%SETTINGS%' -WindowStyle Hidden"
exit /b 0

:missing_build
echo.
echo The current compiled files are missing.
echo Open Codex and ask: Build the English, PDF Reader, and Settings apps once.
echo No installer is required.
pause
exit /b 1
