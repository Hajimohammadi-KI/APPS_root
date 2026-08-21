@echo off
setlocal EnableExtensions
title Deutsch-Automatik - Start Current Version

set "ROOT=D:\APPS_root"
for %%I in ("%~dp0.") do set "DEUTSCH=%%~fI"
set "LOGS=%DEUTSCH%\runtime-logs"
if not exist "%LOGS%" mkdir "%LOGS%"

if not exist "%DEUTSCH%\apps\web\.next\standalone\apps\web\server.js" goto missing_build
if not exist "%DEUTSCH%\apps\api\dist\main.js" goto missing_build

call :start_if_closed 3210 deutsch
call :start_if_closed 4210 deutsch_api

rem Give the server a few seconds to actually bind before trusting it, then
rem report success/failure by name instead of opening the hub page
rem regardless -- a hidden Start-Process that fails to bind used to fail
rem completely silently, with no visible error and no log to check.
powershell.exe -NoProfile -Command "Start-Sleep -Seconds 4"
set "ALL_UP=1"
call :report_status 3210 "Deutsch-Automatik"
call :report_status 4210 "Deutsch API"
if "%ALL_UP%"=="0" (
  echo.
  echo One or more services did not start. Check %LOGS%\ and try again.
  pause
) else (
  start "" "%ROOT%\index.html"
)
exit /b 0

:start_if_closed
netstat -ano | findstr /r /c:":%~1 .*LISTENING" >nul
if not errorlevel 1 exit /b 0

if /i "%~2"=="deutsch" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'node.exe' -ArgumentList @('scripts/start-standalone.mjs','--port','3210','--hostname','127.0.0.1') -WorkingDirectory '%DEUTSCH%' -WindowStyle Hidden -RedirectStandardOutput '%LOGS%\deutsch.log' -RedirectStandardError '%LOGS%\deutsch.err.log'"
if /i "%~2"=="deutsch_api" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'bun.exe' -ArgumentList @('run','--cwd','apps/api','start') -WorkingDirectory '%DEUTSCH%' -WindowStyle Hidden -RedirectStandardOutput '%LOGS%\deutsch-api.log' -RedirectStandardError '%LOGS%\deutsch-api.err.log'"
exit /b 0

:report_status
netstat -ano | findstr /r /c:":%~1 .*LISTENING" >nul
if errorlevel 1 (
  echo [FAILED]  %~2 never bound to port %~1 -- see %LOGS%\
  set "ALL_UP=0"
) else (
  echo [OK]      %~2 is listening on port %~1
)
exit /b 0

:missing_build
echo.
echo The current compiled files are missing.
echo Open Codex and ask: Build the Deutsch-Automatik app once.
echo No installer is required.
pause
exit /b 1
