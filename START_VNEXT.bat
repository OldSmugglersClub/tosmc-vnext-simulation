@echo off
setlocal
cd /d "%~dp0"
title TOSMC Admin vNext 2.0.0 - Repo Bootstrap SAFE
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0vnext-server.ps1"
if errorlevel 1 (
  echo.
  echo vNext wurde mit einem Fehler beendet.
  pause
)
endlocal
