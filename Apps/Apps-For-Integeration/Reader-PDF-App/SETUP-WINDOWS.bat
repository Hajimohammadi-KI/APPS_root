@echo off
setlocal
cd /d "%~dp0" || goto :failed

where powershell.exe >nul 2>nul || goto :powershell_missing

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows.ps1"
if errorlevel 1 goto :failed
exit /b 0

:powershell_missing
echo Windows PowerShell wurde nicht gefunden.
goto :failed

:failed
echo.
echo Das Setup konnte nicht abgeschlossen werden.
pause
exit /b 1
