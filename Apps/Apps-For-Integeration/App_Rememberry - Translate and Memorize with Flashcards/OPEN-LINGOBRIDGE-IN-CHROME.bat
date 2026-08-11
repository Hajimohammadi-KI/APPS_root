@echo off
setlocal
set "EXTENSION_FOLDER=%~dp0dist"

if not exist "%EXTENSION_FOLDER%\manifest.json" (
  echo The Chrome build is missing. Run bun run build in this folder first.
  pause
  exit /b 1
)

start "LingoBridge build folder" explorer.exe "%EXTENSION_FOLDER%"
start "Chrome extensions" chrome.exe "chrome://extensions"
exit /b 0
