@echo off
setlocal
rem %~dp0 is this file's own folder, so the collection can live on any drive.
set "STARTER_DIR=%~dp0Apps\Starter-App"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%STARTER_DIR%\start-starter.ps1"
if errorlevel 1 pause

