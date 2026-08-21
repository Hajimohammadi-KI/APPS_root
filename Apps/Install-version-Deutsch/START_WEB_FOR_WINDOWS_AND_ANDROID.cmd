@echo off
setlocal EnableExtensions
title DeutschFlow - Web for Windows and Android
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-web-on-lan.ps1"
if errorlevel 1 (
  echo.
  echo Die Web-Version konnte nicht gestartet werden. Fehler oben pruefen.
)
echo.
pause
