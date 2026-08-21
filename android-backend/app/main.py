"""
CashTrack Android API — pure JSON backend for the mobile app.

Differences from the web backend (deliberate):
  - Every route requires a Bearer token; there is no anonymous access.
  - No static frontend serving / SPA fallback — the Android app is the client.
  - POST /api/sync alias removed: it existed for browsers' sendBeacon;
    Retrofit sends proper PUTs.
"""
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import (
    auth as auth_router,
    expenses as expenses_router,
    insights as insights_router,
    settings as settings_router,
    sync as sync_router,
    goals as goals_router,
    todos as todos_router,
    profile as profile_router,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CashTrack Android API",
    version="1.0.0",
    description="Multi-user REST backend for the CashTrack Android app.",
)

# Android apps don't enforce CORS, but the web dashboard may point at this
# server too — allow it explicitly rather than silently.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(expenses_router.router)
app.include_router(insights_router.router)
app.include_router(settings_router.router)
app.include_router(sync_router.router)
app.include_router(goals_router.router)
app.include_router(todos_router.router)
app.include_router(profile_router.router)


@app.get("/health", tags=["meta"])
def health():
    """Connectivity probe for the app's startup check and platform health checks."""
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}
