@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update-app.ps1" %*
