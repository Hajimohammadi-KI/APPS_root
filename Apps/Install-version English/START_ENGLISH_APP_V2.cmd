@echo off
setlocal EnableExtensions
title English Automaticity - Start Current Version

set "ROOT=D:\APPS_root"
for %%I in ("%~dp0.") do set "ENGLISH=%%~fI"
set "PDF=%ROOT%\Apps\Apps-For-Integeration\Reader-PDF-App"
set "SETTINGS=%ROOT%\Apps\Apps-For-Integeration\Einstellungen-APP"
set "LOGS=%ENGLISH%\runtime-logs"
if not exist "%LOGS%" mkdir "%LOGS%"

if not exist "%ENGLISH%\apps\web\.next\standalone\apps\web\server.js" goto missing_build
if not exist "%ENGLISH%\apps\api\dist\main.js" goto missing_build
if not exist "%PDF%\dist\server\index.js" goto missing_build
if not exist "%SETTINGS%\dist\server\index.js" goto missing_build

call :start_if_closed 3202 english
call :start_if_closed 4201 english_api
call :start_if_closed 4322 pdf
call :start_if_closed 4323 settings

rem Give each server a few seconds to actually bind before trusting it, then
rem report per-service success/failure by name instead of opening the hub
rem page regardless -- a hidden Start-Process that fails to bind used to
rem fail completely silently, with no visible error and no log to check.
powershell.exe -NoProfile -Command "Start-Sleep -Seconds 4"
set "ALL_UP=1"
call :report_status 3202 "English app"
call :report_status 4201 "English API"
call :report_status 4322 "PDF Reader"
call :report_status 4323 "Settings"

if "%ALL_UP%"=="1" (
  start "" "%ROOT%\index.html"
) else (
  echo.
  echo One or more services did not start. Check the log files above for the
  echo real error, then close any partially-started windows and try again.
  echo Log folder: %LOGS%
  pause
)
exit /b 0

:start_if_closed
netstat -ano | findstr /r /c:":%~1 .*LISTENING" >nul
if not errorlevel 1 exit /b 0

if /i "%~2"=="english" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'node.exe' -ArgumentList @('scripts/start-standalone.mjs','--port','3202','--hostname','127.0.0.1') -WorkingDirectory '%ENGLISH%' -WindowStyle Hidden -RedirectStandardOutput '%LOGS%\english.log' -RedirectStandardError '%LOGS%\english.err.log'"
if /i "%~2"=="english_api" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'bun.exe' -ArgumentList @('run','--cwd','apps/api','start') -WorkingDirectory '%ENGLISH%' -WindowStyle Hidden -RedirectStandardOutput '%LOGS%\english-api.log' -RedirectStandardError '%LOGS%\english-api.err.log'"
if /i "%~2"=="pdf" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'bun.exe' -ArgumentList @('run','start','--port','4322') -WorkingDirectory '%PDF%' -WindowStyle Hidden -RedirectStandardOutput '%LOGS%\pdf.log' -RedirectStandardError '%LOGS%\pdf.err.log'"
if /i "%~2"=="settings" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'bun.exe' -ArgumentList @('run','start','--port','4323') -WorkingDirectory '%SETTINGS%' -WindowStyle Hidden -RedirectStandardOutput '%LOGS%\settings.log' -RedirectStandardError '%LOGS%\settings.err.log'"
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
echo Open Codex and ask: Build the English, PDF Reader, and Settings apps once.
echo No installer is required.
pause
exit /b 1
