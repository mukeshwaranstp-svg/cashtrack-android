$ErrorActionPreference = 'Stop'

$src = $PSScriptRoot
$deploy = "C:\Users\mugeshwaran\Downloads\cashtrack-deploy"

if (-not (Test-Path -LiteralPath $deploy)) {
  Write-Error "Deploy folder not found: $deploy`nCreate it by cloning your GitHub repo (git clone https://github.com/mukeshwaranstp-svg/cashtrack.git)."
}

# ---- Pre-deploy guard: block Android-Chrome GPU-corruption regressions ----
# backdrop-filter / backdrop-blur and CSS filter/blur promote GPU compositor
# layers. On Android Chrome these corrupt rendering (static noise, duplicated
# cards, horizontal glitch lines). Any re-introduction must abort the deploy.
Write-Host "== 0/4 Mobile rendering guard =="
$guardFailures = 0
Get-ChildItem -Recurse -File "$src\src\components", "$src\src" -Filter *.tsx -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch 'artifacts' } |
  ForEach-Object {
    Select-String -LiteralPath $_.FullName -Pattern 'backdrop-blur|backdrop-filter|-webkit-backdrop-filter|filter blur|blur-\[|blur-md|blur-lg|blur-xl|blur-2xl|blur-3xl|drop-shadow\[|bg-gradient' |
      ForEach-Object {
        Write-Host "  BLOCKED: $($_.Path):$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Red
        $script:guardFailures++
      }
  }
if ($script:guardFailures -gt 0) {
  Write-Error "Mobile-rendering regression guard FAILED ($($script:guardFailures) occurrence(s)). Fix or remove the backdrop-filter/filter/blur above before deploying."
}
Write-Host "  OK - no mobile-unsafe patterns found." -ForegroundColor Green

Write-Host "== 1/4 Building the frontend =="
Push-Location $src
& .\node_modules\.bin\vite.cmd build
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Error "vite build failed" }
Pop-Location

Write-Host "== 2/4 Copying backend (no secrets) =="
$exclude = '\.env$|__pycache__|\.pyc$|\.pytest_cache|server\.log|server\.err\.log|cashtrack\.db'
Get-ChildItem -Recurse -Directory "$src\cashtrack-backend" |
  Where-Object { $_.FullName -notmatch '__pycache__|\.pytest_cache' } |
  ForEach-Object { New-Item -ItemType Directory -Path ($_.FullName.Replace($src, $deploy)) -Force | Out-Null }
Get-ChildItem -Recurse -File "$src\cashtrack-backend" |
  Where-Object { $_.FullName -notmatch $exclude } |
  ForEach-Object { Copy-Item $_.FullName ($_.FullName.Replace($src, $deploy)) -Force }

Write-Host "== 3/4 Copying built frontend (dist) =="
if (Test-Path "$src\dist") { Remove-Item "$deploy\dist" -Recurse -Force }
Copy-Item -Recurse "$src\dist" "$deploy\dist" -Force

Write-Host "== 4/4 Committing + pushing to GitHub (Render auto-deploys) =="
Push-Location $deploy
$msg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git add -A
git commit -m $msg
git push origin main
Pop-Location

Write-Host ""
Write-Host "Done! Changes are live at https://cashtrack-um66.onrender.com in a few minutes."
Write-Host "Phones that installed the APK get the update automatically - no new APK needed."
Write-Host ""
pause
