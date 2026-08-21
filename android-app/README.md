# CashTrack Android App

Kotlin + Jetpack Compose client for the CashTrack FastAPI backend (`../android-backend`).

**Stack:** Kotlin · Jetpack Compose · Retrofit + OkHttp · Room · MVVM / Clean Architecture

## No Android Studio? Build the APK on GitHub (free)

Weak laptop? You never need to install anything — GitHub Actions builds the APK:

1. Push this project to a GitHub repo (`main` branch).
2. Repo **Settings → Secrets and variables → Actions → Variables** → add variable
   `BASE_URL` = your deployed backend URL, e.g. `https://cashtrack-api.onrender.com/`
3. Open the **Actions** tab → wait for "Build Debug APK" (green check).
4. Open the run → **Artifacts** → download `cashtrack-debug-apk`.
5. Unzip → copy `app-debug.apk` to your phone (USB / Drive / WhatsApp-to-self).
6. On the phone: tap the APK → allow "Install unknown apps" when prompted.
7. Start the backend on your laptop and keep phone + laptop on the same Wi-Fi,
   then set `BASE_URL` accordingly before pushing:
   - Emulator default `http://10.0.2.2:8000/` does NOT work from a real phone.
   - Same-Wi-Fi LAN testing: `http://<your-pc-ip>:8000/` (run `setup-firewall.cmd`
     in the repo root once to open port 8000; find your IP with `ipconfig`).
   - Proper setup: deploy the backend (see `android-backend/README.md`) and use
     its HTTPS URL — works from anywhere, including mobile data.

Every future push rebuilds the APK automatically.

## Open in Android Studio (if you ever get access to a stronger machine)

1. Android Studio → **Open** → select this `android-app` folder.
2. Let Studio sync (it downloads Gradle 8.9 + dependencies from the version catalog).
3. Start the backend first:
   ```bash
   cd ../android-backend
   venv\Scripts\activate
   python -m uvicorn app.main:app --port 8000
   ```
4. Run the app on an **emulator** — it reaches your machine's localhost as `10.0.2.2`
   (already the default `BASE_URL`). Register an account and you're in.

### Real device instead of emulator?

Change `BASE_URL` in `app/build.gradle.kts` to your PC's LAN IP:
`http://192.168.x.x:8000/` — and note plain HTTP to a raw IP only works in debug
builds (cleartext is enabled there). For release, deploy the backend with a real
HTTPS domain and point `BASE_URL` at it.

## Architecture

```
ui/            Compose screens + ViewModels (state holders)      ← knows nothing about network/db
domain/        Models + repository interfaces                     ← pure Kotlin, no framework imports
data/
 ├── remote/   Retrofit ApiService, DTOs, AuthInterceptor,
 │             TokenAuthenticator (401 → refresh → retry)
 ├── local/    Room database (offline cache), TokenStore
 │             (EncryptedSharedPreferences)
 └── repository/ Implementations wiring remote + local together
```

Data flow: `Screen → ViewModel → Repository(interface) → [Retrofit | Room]`.
Repositories return `Resource<T>` (Loading/Error/Success); screens render all three.

## What's implemented

- **Auth**: register/login, JWT storage in EncryptedSharedPreferences, automatic
  token refresh via OkHttp Authenticator (with concurrent-request race guard), logout.
- **Dashboard**: monthly spend vs budget, streak badge, 70/20/10 bucket bars,
  recent transactions — served from Room cache instantly, refreshed from `/api/summary`.
- **Log expense**: amount + 17 categories (chips) + note; server assigns the bucket;
  milestone celebration on streak milestones (3/7/14/30/50/100).
- **Goals**: list from Room cache, create/delete against `/api/goals`, progress bars.
- **Profile**: logout.

## Key files

| File | Role |
|------|------|
| `CashTrackApp.kt` | Manual DI container (object graph) |
| `data/remote/TokenAuthenticator.kt` | Auto-refresh on 401, retry once |
| `data/repository/AuthRepositoryImpl.kt` | Login/register + error mapping |
| `ui/navigation/CashTrackNavGraph.kt` | Auth gate + bottom-bar shell |
