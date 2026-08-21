@echo off
REM One-time setup: allow phone (LAN) connections to the CashTrack server.
REM Run this ONCE as it will ask for Administrator permission.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Requesting Administrator access...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
echo Adding firewall rule "CashTrack 8000"...
powershell -NoProfile -Command "if (-not (Get-NetFirewallRule -DisplayName 'CashTrack 8000' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName 'CashTrack 8000' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000 | Out-Null }; Get-NetFirewallRule -DisplayName 'CashTrack 8000' | Select-Object -Property DisplayName,Enabled,Action | Format-List"
echo Adding firewall rule "CashTrack 8443"...
powershell -NoProfile -Command "if (-not (Get-NetFirewallRule -DisplayName 'CashTrack 8443' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName 'CashTrack 8443' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8443 | Out-Null }; Get-NetFirewallRule -DisplayName 'CashTrack 8443' | Select-Object -Property DisplayName,Enabled,Action | Format-List"
echo.
echo Done. You can close this window.
pause
