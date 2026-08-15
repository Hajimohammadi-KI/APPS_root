@echo off
setlocal
cd /d "%~dp0" || goto :failed

call "%~dp0SETUP-WINDOWS.bat"
exit /b %errorlevel%

:failed
echo Der Projektordner konnte nicht geoeffnet werden.
pause
exit /b 1
