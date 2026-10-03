@echo off
pwsh.exe -NoProfile -File "%~dp0scripts\start-language-devices.ps1" %*
if errorlevel 1 pause
