<#
  CashTrack mobile launcher.
  Runs the whole app (API + built frontend) on ALL network interfaces so a
  phone on the same Wi-Fi can open it at http://<PC-LAN-IP>:8000.

  Usage:
    .\start-mobile.cmd                start (uses existing dist build)
    .\start-mobile.cmd -Rebuild       rebuild the frontend, then start
    .\start-mobile.cmd -Port 9000     different port

  HTTPS: if certs\cert.pem + certs\key.pem exist, a second server starts on
  $($Port + 443) so a phone can install CashTrack as a real PWA over https.
#>
param(
  [int]$Port = 8000,
  [switch]$Rebuild
)

$HttpsPort = $Port + 443

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if ($Rebuild) {
  Write-Host "Rebuilding frontend..."
  & .\node_modules\.bin\vite.cmd build
  if ($LASTEXITCODE -ne 0) { Write-Error "vite build failed" }
}

# Pick a real LAN IPv4 (skip loopback, link-local, virtual/hotspot adapters).
$ip = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike '127.*' -and
    $_.IPAddress -notlike '169.254.*' -and
    $_.PrefixOrigin -ne 'WellKnown' -and
    $_.InterfaceAlias -notlike 'Local Area Connection*' -and
    $_.InterfaceAlias -notlike '*VMware*' -and
    $_.InterfaceAlias -notlike '*VirtualBox*'
  } |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) { $ip = '127.0.0.1' }

$fwRule = Get-NetFirewallRule -DisplayName 'CashTrack 8000' -ErrorAction SilentlyContinue
$certFile = Join-Path $PSScriptRoot 'certs\cert.pem'
$keyFile = Join-Path $PSScriptRoot 'certs\key.pem'
$hasHttps = (Test-Path $certFile) -and (Test-Path $keyFile)

Write-Host ""
Write-Host "CashTrack starting..."
Write-Host "  On this PC   : http://localhost:$Port"
Write-Host "  On your phone: http://$ip`:$Port"
if ($hasHttps) {
  Write-Host "  Phone install : https://$ip`:$HttpsPort  (trusted PWA - installable)"
}
Write-Host "  (phone and PC must be on the SAME Wi-Fi network)"
if (-not $fwRule) {
  Write-Host ""
  Write-Host "  WARNING: no firewall rule for port $Port yet."
  Write-Host "  If the phone can't connect, run setup-firewall.cmd once (as admin)."
}
Write-Host ""
Write-Host "  Keep this window OPEN - closing it stops the app."
Write-Host ""

# HTTPS server for the phone (PWA install needs a secure context).
if ($hasHttps) {
  Write-Host "Starting HTTPS server on port $HttpsPort ..."
  Start-Process -FilePath "python" -ArgumentList @(
    "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$HttpsPort",
    "--ssl-certfile", "`"$certFile`"", "--ssl-keyfile", "`"$keyFile`""
  ) -WorkingDirectory (Join-Path $PSScriptRoot 'cashtrack-backend') -WindowStyle Minimized
  Write-Host "  (HTTPS window opens minimized; close it when done)"
}

Set-Location -LiteralPath (Join-Path $PSScriptRoot 'cashtrack-backend')
python -m uvicorn app.main:app --host 0.0.0.0 --port $Port
