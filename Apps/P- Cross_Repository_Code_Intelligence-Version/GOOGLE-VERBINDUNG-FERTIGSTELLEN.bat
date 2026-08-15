@echo off
setlocal
cd /d "%~dp0"
title Google-Verbindung fertigstellen

node scripts\import-google-oauth.mjs %*
if errorlevel 1 (
  echo.
  echo Bitte zuerst im Google-Cloud-Client auf "JSON herunterladen" klicken.
  echo Die Datei darf im Downloads-Ordner bleiben. Danach diese Datei erneut doppelklicken.
  pause
  exit /b 1
)

echo.
echo Google-Verbindung ist eingerichtet. Der Tracker wird neu gestartet.
call STARTEN-WINDOWS.bat
