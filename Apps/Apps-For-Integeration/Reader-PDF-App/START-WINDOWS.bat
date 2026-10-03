@echo off
setlocal
set "APP_ROOT=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_ROOT%resources\update\check-for-updates.ps1" -Configuration "%APP_ROOT%resources\update\update-config.json" -Automatic
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_ROOT%scripts\start-windows.ps1" -AppRoot "%APP_ROOT%"
endlocal
