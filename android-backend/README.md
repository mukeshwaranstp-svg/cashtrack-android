# CashTrack Android Backend

Multi-user REST API for the CashTrack Android app.

**Stack:** FastAPI · Pydantic · SQLAlchemy · JWT (PyJWT) · SQLite (dev) / PostgreSQL (prod)

Rebuilt from the web backend (`../cashtrack-backend`): same proven domain logic
(streak engine, 70/20/10 summary, sync bundle), but restructured around real
user accounts — the web version was single-user with zero auth.

## Run locally

```bash
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Interactive docs: http://localhost:8000/docs

Run tests:

```bash
python -m pytest tests/ -v
```

## Auth model (what the Android app must implement)

1. `POST /api/auth/register` or `POST /api/auth/login` → returns
   `accessToken` (~30 min) + `refreshToken` (~30 days).
2. Every data call sends `Authorization: Bearer <accessToken>`.
3. On 401 "Token expired" → `POST /api/auth/refresh` with the refresh token,
   get a new pair, retry once.
4. Store both tokens in **EncryptedSharedPreferences** — never plain prefs.

## Endpoint map

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create account → tokens + user |
| POST | `/api/auth/login` | Login → tokens + user |
| POST | `/api/auth/refresh` | New token pair from refresh token |
| GET  | `/api/auth/me` | Current account (token sanity check) |
| GET  | `/health` | Connectivity probe (no auth) |
| POST | `/api/expense` | Log expense → returns streak + milestone |
| GET  | `/api/expenses` | List (newest first, `?limit=`) |
| PUT/PATCH/DELETE | `/api/expense/{id}` | Edit / review flags / delete |
| GET  | `/api/streak` · POST `/api/streak/reset` | Streak state |
| GET  | `/api/summary` | 70/20/10 analysis + heatmap + trend |
| GET/POST | `/api/settings` | Read / update budget & preferences |
| GET/PUT | `/api/sync` | Full state bundle (Room cache sync) |
| CRUD | `/api/goals`, `/api/savings-history`, `/api/todos` | Collections |
| GET/PUT | `/api/profile`, `/api/wallet`, `/api/companion` | Singletons |

All request/response bodies are **camelCase JSON** (e.g. `goalId`,
`monthlyBudget`, `currentStreak`) — one consistent rule for Kotlin DTOs.

## Retrofit quick reference (Android side)

```kotlin
interface CashTrackApi {
    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @GET("api/expenses")
    suspend fun expenses(): List<ExpenseDto>

    @POST("api/expense")
    suspend fun createExpense(@Body body: ExpenseCreate): ExpenseCreateResponse
}

// Auth interceptor — attaches the token to every call:
class AuthInterceptor(private val store: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val req = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer ${store.accessToken}")
            .build()
        return chain.proceed(req)
    }
}
```

Use a `CoroutineDispatcher`-backed `suspend` functions (Retrofit handles the
main-thread ban automatically), and an `Authenticator` for automatic refresh on
401 rather than manual retry logic in every ViewModel.

## Deploy (Render/Railway + Supabase Postgres)

1. Create a Supabase project → copy the Postgres URI.
2. Deploy this folder; set env vars:
   - `DATABASE_URL=postgresql://postgres:[pw]@[host]:5432/postgres`
   - `SECRET_KEY=<python -c "import secrets; print(secrets.token_hex(32))">`
   - `SECRET_KEY_STRICT=1`
3. A `Dockerfile` is included — Render/Railway detect it automatically.
4. The Android app needs the base URL as `https://...` (cleartext HTTP is
   blocked by default on Android 9+).

## Layout

```
app/
├── config.py        # env-driven settings (SECRET_KEY, token lifetimes)
├── database.py      # engine/session (SQLite dev → Postgres prod)
├── security.py      # PBKDF2 hashing, JWT issue/verify, get_current_user
├── models.py        # User + per-user tables (user_id FK everywhere)
├── schemas.py       # Pydantic contracts (camelCase wire format)
├── categories.py    # 17 categories → Needs/Wants/Savings buckets
├── streak.py        # streak engine (milestones at 3/7/14/30/50/100)
├── summary.py       # 70/20/10 aggregation, heatmap, weekly trend
├── state.py         # full-bundle assemble/apply for /api/sync
├── main.py          # app assembly + /health
└── routers/         # auth, expenses, insights, settings, sync,
                     # goals, todos, profile
tests/               # 15 tests incl. cross-user isolation attacks
```

## Security properties (tested)

- Passwords stored as salted PBKDF2-SHA256 (240k iterations) — never plaintext.
- Access tokens can't be reused as refresh tokens (type-checked claims).
- Every query filters by `user_id`; foreign ids return 404, not the data.
- Sync upserts are scoped per user — client-sent ids can't touch other accounts.
- Login errors don't reveal whether an email is registered.
