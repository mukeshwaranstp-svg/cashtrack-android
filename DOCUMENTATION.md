# CashTrack — Full Documentation

CashTrack is a personal savings tracker with 70/20/10 budgeting, savings goals,
streak missions and a 70/20/10 analysis dashboard. This document covers how the
whole system works: the local app, the cloud deployment, and how to update and
ship it as a real Android APK.

---

## 1. System Overview

CashTrack is a **web app** (not a native app). It is built from three layers:

| Layer | What it is | Where it lives |
|---|---|---|
| Frontend | React + Vite + Tailwind UI | `src/` (project root) |
| Backend | Python FastAPI server | `cashtrack-backend/app/` |
| Database | PostgreSQL on Supabase (cloud) | Supabase project `xxgojycqzmrgjeygvgcx` |

There are **two ways to run** the same app:

- **Local (LAN):** your laptop runs the FastAPI server and serves the built
  frontend on port 8000 (and HTTPS on 8443). Phones on the same Wi-Fi connect
  to it.
- **Cloud (public):** the same app is deployed to **Render** at
  `https://cashtrack-um66.onrender.com` and talks to the same Supabase database.
  This is what the Android APK loads, so it works **anywhere, anytime**.

The database is shared, so data entered on your laptop appears on your phone and
vice-versa.

---

## 2. Folder Structure

```
cashtrack (1) final v3\            <- project root
├── src\                           <- frontend source (React)
│   ├── components\                <- Dashboard, Analysis, Goals, Mascot, etc.
│   ├── lib\                       <- API client + sync layer
│   ├── App.tsx                    <- main app shell / navigation
│   ├── types.ts                   <- data contracts (source of truth for API)
│   └── main.tsx                   <- React entry point (PWA registration)
├── public\                        <- static files copied verbatim into dist\
│   ├── icon-192.png               <- app logo (192x192) - CHANGE HERE for logo
│   ├── icon-512.png               <- app logo (512x512) - CHANGE HERE for logo
│   ├── manifest.json              <- PWA manifest (name, icons, theme)
│   ├── sw.js                      <- service worker
│   └── .well-known\assetlinks.json<- lets Android trust the APK as standalone
├── dist\                          <- BUILT frontend (created by `npm run build`)
├── cashtrack-backend\             <- Python FastAPI backend
│   ├── app\
│   │   ├── main.py                <- FastAPI app + serves dist\ + /ca.pem
│   │   ├── database.py            <- DB connection (Supabase / SQLite fallback)
│   │   ├── models.py, schemas.py  <- ORM models + Pydantic schemas
│   │   ├── summary.py, streak.py  <- business logic
│   │   └── routers\               <- sync, goals, todos, profile
│   ├── tests\                     <- pytest suite (39 tests)
│   ├── requirements.txt
│   └── .env                       <- LOCAL ONLY: DATABASE_URL (gitignored)
├── certs\                         <- LOCAL ONLY: mkcert HTTPS certs (gitignored)
├── start-mobile.cmd / .ps1        <- run the app for the local phone (LAN)
├── setup-firewall.cmd             <- allow phone through Windows Firewall (admin)
├── update-app.cmd / .ps1          <- THE update tool: build + push -> auto-live
└── cashtrack-deploy\              <- SEPARATE git repo for cloud deployment
```

---

## 3. How the Pieces Fit (concepts you should know)

### 3.1 Same-origin serving
The FastAPI backend **also serves the built frontend** (`dist/`). The React app
calls `/api/...` on the **same domain**, so there are no CORS problems and one
URL serves everything. This is why the same code works on the LAN and on Render.

### 3.2 Database connection (`app/database.py`)
- Reads `DATABASE_URL` from the environment (or `cashtrack-backend/.env` locally).
- Falls back to a local SQLite file if no `DATABASE_URL` is set.
- For Supabase URLs it automatically:
  1. Pins the `psycopg2` driver (`postgresql+psycopg2://`).
  2. Adds `sslmode=require` (Supabase requires TLS).
  3. Resolves the host to an **IPv4** address when it's a Supabase host —
     Supabase's direct host can be **IPv6-only**, and Render's free tier has no
     IPv6 route (the classic `Network is unreachable` failure). The pooler
     (`*.pooler.supabase.com`) has IPv4 and is the recommended connection.

### 3.3 PWA / APK relationship
- The site is a **PWA**: `public/manifest.json` + `public/sw.js` + the icons.
- The **APK is a wrapper** (Trusted Web Activity) that opens the URL full-screen.
- Android verifies the APK against `/.well-known/assetlinks.json` on the site.
  If that file is missing or served as HTML, the app opens **in a browser tab**
  instead of as a standalone app. (This was a bug — now fixed and documented.)

---

## 4. Local Development

### Prerequisites
- Python 3.11+ (`python --version`)
- Node.js + npm (Vite is installed locally)

### Install dependencies (one time)
```bash
# frontend
npm install

# backend
cd cashtrack-backend
pip install -r requirements.txt
```

### Run locally (development)
```bash
# terminal 1: backend (auto-reload)
cd cashtrack-backend
uvicorn app.main:app --reload

# terminal 2: frontend dev server
npm run dev
```
Open the Vite URL (usually `http://localhost:5173`). The dev server proxies
`/api` to the backend.

### Run for your phone on the LAN (the way you normally use it)
1. Build the frontend: `npm run build`
2. Double-click `start-mobile.cmd`
   - Serves on `http://<PC-IP>:8000`
   - If `certs\` exist, also serves HTTPS on port 8443 (for PWA install)
3. On your phone (same Wi-Fi): open `http://<PC-IP>:8000`

### Firewall (only needed for phone -> PC connections)
Run `setup-firewall.cmd` once **as administrator** (accept the UAC prompt).
It creates allow rules for TCP ports 8000 and 8443.

### HTTPS certificate on the LAN (one time)
Used to make Chrome allow a PWA install over the LAN:
```bash
# install mkcert (once)
winget install FiloSottile.mkcert
mkcert -install

# make a certificate for your PC's current LAN IP
mkcert -cert-file certs\cert.pem -key-file certs\key.pem <LAN-IP> localhost 127.0.0.1
```
The phone downloads the CA from `http://<PC-IP>:8000/ca.pem` once and installs it
as a user certificate. Note: the certificate is tied to the LAN IP — if your IP
changes you must regenerate it.

---

## 5. Cloud Deployment (Render + Supabase) — DONE

### The deployment pipeline
```
edit code -> npm run build -> copy to cashtrack-deploy\ -> git push -> Render auto-deploys
```

### How it was set up
1. A clean git repo `cashtrack-deploy\` contains:
   - `cashtrack-backend/` (source, secrets excluded via `.gitignore`)
   - `dist/` (already-built frontend)
   - `render.yaml` (build + start commands, DATABASE_URL placeholder)
   - `Procfile`
2. Pushed to GitHub: `https://github.com/mukeshwaranstp-svg/cashtrack`
3. Connected to a free **Render** web service: `https://cashtrack-um66.onrender.com`
4. `DATABASE_URL` env var set on Render to the **Supabase pooler** URL:
   ```
   postgresql://postgres.xxgojycqzmrgjeygvgcx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
   (Pooler, not the direct host — the direct host is IPv6-only.)

### render.yaml (reference)
```yaml
services:
  - type: web
    name: cashtrack
    runtime: python
    plan: free
    autoDeploy: true
    buildCommand: pip install -r cashtrack-backend/requirements.txt
    startCommand: cd cashtrack-backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
```

### Render free-tier notes
- The service **sleeps after ~15 min idle** and cold-starts on the next request
  (first load can take ~30–60 s). This is normal for the free plan.
- **No IPv6 outbound** — always use IPv4-reachable hosts (the pooler).

---

## 6. Making Updates (THE important workflow)

### Website / app updates (UI, features, logo, backend) — no new APK needed
1. Edit code under `src/` or `cashtrack-backend/`.
2. **Double-click `update-app.cmd`**. It:
   - Runs `vite build` (rebuilds `dist/`)
   - Copies the backend (excluding secrets) into `cashtrack-deploy\`
   - Copies the fresh `dist\`
   - Commits + pushes to GitHub
3. Render auto-deploys (~4 min) → the change is live on the website **and in the
   installed APK on every phone automatically** (the APK just points at the URL).

### The manual commands (what the script does)
```bash
npm run build
# copy dist\ and cashtrack-backend\ into cashtrack-deploy\
cd C:\Users\mugeshwaran\Downloads\cashtrack-deploy
git add -A
git commit -m "my update"
git push origin main
```

### Changing the LOGO (the classic task)
The logo is two files referenced by `public/manifest.json` and `index.html`:
- `public\icon-192.png` (must be exactly 192x192)
- `public\icon-512.png` (must be exactly 512x512)

To change the logo:
1. Get your image.
2. Make two PNG copies sized exactly 192x192 and 512x512.
   (PIL example: `Image.open("logo.png").convert("RGBA").resize((512,512)).save("public/icon-512.png")`)
3. Replace the two files (keep the same names).
4. Run `update-app.cmd`.

That updates the website, browser tab icon, and PWA icon. The **APK home-screen
icon** is baked in at APK build time (see section 7) and needs a rebuild only if
you want the launcher icon to match.

### Changing the API/backend
Edit `cashtrack-backend/app/...`, run the backend tests
(`cd cashtrack-backend && python -m pytest`), then `update-app.cmd`.

---

## 7. The Android APK

### What the APK is
A **Trusted Web Activity** (TWA) generated by **PWABuilder** that wraps
`https://cashtrack-um66.onrender.com`. It shows the site full-screen with no
browser bar. All data lives in the cloud, so the app can be uninstalled and
reinstalled without losing anything.

### Files in the PWABuilder package (`Downloads\cashtrack-apk\`)
| File | Purpose |
|---|---|
| `CashTrack.apk` | The installable app (side-load this) |
| `CashTrack.aab` | For uploading to the Google Play Store |
| `signing.keystore` | Your app signing key — **KEEP SAFE** (needed for Play updates) |
| `assetlinks.json` | Must be hosted at `/.well-known/assetlinks.json` on the site |
| `signing-key-info.txt` | Details of the signing key |

### Requirements for standalone (full-screen) behavior
1. The site is HTTPS (it is — Render gives HTTPS).
2. `/.well-known/assetlinks.json` is served as **real JSON** matching the APK's
   package name + signing fingerprint. (Now deployed — don't delete it.)

### Rebuilding the APK (when you change the app icon / want a new APK)
1. Go to **https://www.pwabuilder.com**
2. Enter `https://cashtrack-um66.onrender.com` → **Start**
3. **Package for Android** → **Generate Package** → **Download**
4. Extract the zip → use `CashTrack.apk`.
5. **IMPORTANT:** each PWABuilder build gets a **new signing key**. The new
   `assetlinks.json` in the package must be copied to
   `public\.well-known\assetlinks.json` and deployed (via `update-app.cmd`)
   **before** installing the new APK — otherwise it opens in a browser.
6. On the phone: **uninstall the old app**, install the new APK.

> For smooth future updates (install over old app without uninstalling), keep
> the `signing.keystore` and upload it to PWABuilder's signing section so every
> build uses the same key. Losing the keystore means you can never update a
> published app.

### Play Store publishing (optional, later)
- Create a Play Console account (one-time $25 fee).
- Upload `CashTrack.aab` (rebuild via PWABuilder first).
- Keep `signing.keystore` — Play uses it for your app's identity.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Deploy fails: `Network is unreachable` on IPv6 | Supabase direct host is IPv6-only; Render has no IPv6 | Use the pooler URL (`*.pooler.supabase.com:6543`) + `sslmode=require` |
| App opens in browser tab, not standalone | `/.well-known/assetlinks.json` missing or served as HTML | Keep the file in `public\.well-known\` and redeploy |
| Phone can't reach PC locally | Windows Firewall blocking inbound | Run `setup-firewall.cmd` as admin |
| Certificate warning on LAN | LAN IP changed since cert was made | Regenerate the mkcert cert for the new IP |
| Render first load is slow | Free tier cold start after idle | Just wait ~1 min; it wakes on request |
| `%402007` looks odd in the DB URL | `@` must be URL-encoded in passwords | Keep it as `%40` |

---

## 9. Quick Reference (links & commands)

- Live app: https://cashtrack-um66.onrender.com
- GitHub repo: https://github.com/mukeshwaranstp-svg/cashtrack
- Supabase project: `xxgojycqzmrgjeygvgcx` (ap-south-1, use pooler)
- Run local-for-phone: `start-mobile.cmd`
- Ship an update: `update-app.cmd`
- Frontend build: `npm run build`
- Backend tests: `cd cashtrack-backend && python -m pytest`
- APK builder: https://www.pwabuilder.com
- Deploy host: https://render.com

---

*Last updated: 2026-08-05. Companion files: `cashtrack-backend/README.md`,
`cashtrack-deploy/README.md`.*
