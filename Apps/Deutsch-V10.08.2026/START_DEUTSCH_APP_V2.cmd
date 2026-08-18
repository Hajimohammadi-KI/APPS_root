@echo off
setlocal EnableExtensions
title Deutsch-Automatik - Start Current Version

set "ROOT=D:\APPS_root"
set "DEUTSCH=%ROOT%\Apps\Deutsch-V10.08.2026"
set "LOGS=%DEUTSCH%\runtime-logs"
if not exist "%LOGS%" mkdir "%LOGS%"

if not exist "%DEUTSCH%\apps\web\.next\standalone\apps\web\server.js" goto missing_build

call :start_if_closed 3210 deutsch

rem Give the server a few seconds to actually bind before trusting it, then
rem report success/failure by name instead of opening the hub page
rem regardless -- a hidden Start-Process that fails to bind used to fail
rem completely silently, with no visible error and no log to check.
powershell.exe -NoProfile -Command "Start-Sleep -Seconds 4"
netstat -ano | findstr /r /c:":3210 .*LISTENING" >nul
if errorlevel 1 (
  echo.
  echo [FAILED]  Deutsch-Automatik never bound to port 3210 -- see %LOGS%\
  echo Close any partially-started windows and try again.
  pause
) else (
  echo [OK]      Deutsch-Automatik is listening on port 3210
  start "" "%ROOT%\index.html"
)
exit /b 0

:start_if_closed
netstat -ano | findstr /r /c:":%~1 .*LISTENING" >nul
if not errorlevel 1 exit /b 0

if /i "%~2"=="deutsch" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'node.exe' -ArgumentList @('scripts/start-standalone.mjs','--port','3210','--hostname','127.0.0.1') -WorkingDirectory '%DEUTSCH%' -WindowStyle Hidden -RedirectStandardOutput '%LOGS%\deutsch.log' -RedirectStandardError '%LOGS%\deutsch.err.log'"
exit /b 0

:missing_build
echo.
echo The current compiled files are missing.
echo Open Codex and ask: Build the Deutsch-Automatik app once.
echo No installer is required.
pause
exit /b 1
