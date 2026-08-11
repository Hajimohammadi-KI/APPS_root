@echo off
setlocal
set "STARTER_DIR=D:\APPS_root\Apps\Starter-App"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%STARTER_DIR%\start-starter.ps1"
if errorlevel 1 pause

