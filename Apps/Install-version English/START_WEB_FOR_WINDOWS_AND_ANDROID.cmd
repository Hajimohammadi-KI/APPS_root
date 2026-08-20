@echo off
setlocal EnableExtensions
title English Automaticity - Web for Windows and Android
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-web-on-lan.ps1"
if errorlevel 1 (
  echo.
  echo The web version could not start. Review the error above.
)
echo.
pause
