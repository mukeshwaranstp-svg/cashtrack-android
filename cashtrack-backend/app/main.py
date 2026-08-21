"""
FastAPI app. Endpoint surface mirrors server.ts's routes so the frontend's
fetch() calls work unchanged:

  POST   /api/expense            -> log an expense, updates streak + milestone
  GET    /api/expenses           -> list all expenses (newest first)
  PUT    /api/expense/{id}       -> edit an expense
  PATCH  /api/expense/{id}       -> update reviewed/justified flags
  DELETE /api/expense/{id}       -> delete an expense
  GET    /api/streak             -> current streak state
  POST   /api/streak/reset       -> reset streak (dev/testing utility)
  GET    /api/summary            -> 70/20/10 analysis + heatmap + streak
  POST   /api/settings           -> update monthly budget

In production the same process also serves the built frontend from ../dist
(SPA fallback included), so one origin serves the whole app.
"""
import os
from datetime import date, datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import Base, engine, get_db
from app.models import Expense
from app.categories import get_bucket_for_category
from app.streak import get_or_create_streak, apply_break_if_needed, register_log
from app.summary import build_summary, get_or_create_settings
from app.schemas import (
    ExpenseCreate, ExpenseUpdate, ExpenseReviewUpdate, ExpenseOut,
    ExpenseCreateResponse, ExpenseWriteResponse, StreakOut, StreakResetResponse,
    SummaryOut, SettingsUpdate, SettingsResponse, SettingsOut,
)
from app.routers import sync as sync_router
from app.routers import goals as goals_router
from app.routers import todos as todos_router
from app.routers import profile as profile_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CashTrack API")

# Local dev CORS — tighten to your real frontend origin before deploying.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sync_router.router)
app.include_router(goals_router.router)
app.include_router(todos_router.router)
app.include_router(profile_router.router)

# Built frontend (vite build) lives at <project root>/dist. Override the
# location with FRONTEND_DIST if the backend and frontend are deployed apart.
FRONTEND_DIST = Path(os.environ.get("FRONTEND_DIST", str(Path(__file__).resolve().parents[2] / "dist")))


@app.middleware("http")
async def frontend_cache_control(request: Request, call_next):
    """Correct Cache-Control for the static frontend so new deploys propagate.

    /assets/* are content-hashed by vite -> safe to cache forever (immutable).
    Everything else (index.html, sw.js, manifest.json) must be revalidated on
    every visit; otherwise Chrome heuristically caches the old index.html,
    which references old hashed assets, and the service worker never sees the
    update -> users keep the previous (glitchy) build forever.
    """
    response = await call_next(request)
    if request.url.path.startswith("/assets/"):
        if not response.headers.get("Cache-Control"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    else:
        if not response.headers.get("Cache-Control"):
            response.headers["Cache-Control"] = "no-cache, must-revalidate"
    return response


def _utc_today() -> date:
    """Default 'today' used when the frontend doesn't pass one (server.ts parity)."""
    return datetime.now(timezone.utc).date()


def _streak_out(streak, today: date) -> StreakOut:
    return StreakOut(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_logged_date=streak.last_logged_date,
        logged_today=streak.last_logged_date == today,
    )


@app.post("/api/expense", response_model=ExpenseCreateResponse)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    expense_date = payload.date or _utc_today()
    expense_timestamp = payload.timestamp or datetime.now(timezone.utc)

    expense = Expense(
        amount=payload.amount,
        category=payload.category.value,
        bucket=get_bucket_for_category(payload.category).value,
        note=payload.note,
        date=expense_date,
        timestamp=expense_timestamp,
        reviewed=False,
        justified=False,
        goal_id=payload.goal_id,
        goal_name=payload.goal_name,
        goal_image=payload.goal_image,
        allocations=payload.allocations,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Streak advances off the user-supplied expense date (server.ts parity).
    streak, milestone_reached, milestone_value = register_log(db, expense_date=expense_date)

    return ExpenseCreateResponse(
        success=True,
        expense=ExpenseOut.model_validate(expense),
        streak=_streak_out(streak, expense_date),
        milestone_reached=milestone_reached,
        milestone_value=milestone_value,
    )


@app.get("/api/expenses", response_model=list[ExpenseOut])
def list_expenses(db: Session = Depends(get_db)):
    expenses = db.execute(select(Expense).order_by(Expense.timestamp.desc())).scalars().all()
    return expenses


@app.put("/api/expense/{expense_id}", response_model=ExpenseWriteResponse)
def update_expense(expense_id: str, payload: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    if payload.amount is not None:
        expense.amount = payload.amount
    if payload.category is not None:
        expense.category = payload.category.value
        expense.bucket = get_bucket_for_category(payload.category).value
    if payload.note is not None:
        expense.note = payload.note
    if payload.date is not None:
        expense.date = payload.date
    if payload.timestamp is not None:
        expense.timestamp = payload.timestamp

    # server.ts sets these unconditionally (clears them when omitted)
    expense.goal_id = payload.goal_id
    expense.goal_name = payload.goal_name
    expense.goal_image = payload.goal_image
    expense.allocations = payload.allocations

    db.commit()
    db.refresh(expense)
    return ExpenseWriteResponse(success=True, expense=ExpenseOut.model_validate(expense))


@app.patch("/api/expense/{expense_id}", response_model=ExpenseWriteResponse)
def review_expense(expense_id: str, payload: ExpenseReviewUpdate, db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")

    if payload.reviewed is not None:
        expense.reviewed = payload.reviewed
    if payload.justified is not None:
        expense.justified = payload.justified

    db.commit()
    db.refresh(expense)
    return ExpenseWriteResponse(success=True, expense=ExpenseOut.model_validate(expense))


@app.delete("/api/expense/{expense_id}")
def delete_expense(expense_id: str, db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"success": True}


@app.get("/api/streak", response_model=StreakOut)
def get_streak(today: str | None = Query(default=None), db: Session = Depends(get_db)):
    today_date = date.fromisoformat(today) if today else _utc_today()
    streak = get_or_create_streak(db)
    apply_break_if_needed(streak, today_date)
    db.commit()
    return _streak_out(streak, today_date)


@app.post("/api/streak/reset", response_model=StreakResetResponse)
def reset_streak(db: Session = Depends(get_db)):
    streak = get_or_create_streak(db)
    streak.current_streak = 0
    streak.longest_streak = 0
    streak.last_logged_date = None
    db.commit()
    return StreakResetResponse(success=True, streak=_streak_out(streak, _utc_today()))


@app.get("/api/summary", response_model=SummaryOut)
def get_summary(today: str | None = Query(default=None), db: Session = Depends(get_db)):
    today_date = date.fromisoformat(today) if today else _utc_today()

    streak = get_or_create_streak(db)
    apply_break_if_needed(streak, today_date)
    db.commit()

    summary = build_summary(db, today_date)
    return SummaryOut(**summary, streak=_streak_out(streak, today_date))


@app.post("/api/settings", response_model=SettingsResponse)
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    settings = get_or_create_settings(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return SettingsResponse(success=True, settings=SettingsOut.model_validate(settings))


# Serve the mkcert root CA so a phone can download and trust it (one-time).
# Used for the HTTPS-on-LAN setup (see start-mobile.ps1). Safe to keep around.
CERTS_DIR = Path(__file__).resolve().parents[2] / "certs"
CA_FILE = CERTS_DIR / "rootCA.pem"


@app.get("/ca.pem", include_in_schema=False)
def serve_root_ca():
    if not CA_FILE.is_file():
        raise HTTPException(status_code=404, detail="ca.pem not found")
    return FileResponse(CA_FILE, media_type="application/x-pem-file")


# ---- Production frontend serving (registered last so /api/* wins) ----
if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    if full_path == "api" or full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")
    if not FRONTEND_DIST.is_dir():
        raise HTTPException(status_code=503, detail="Frontend not built — run vite build first")
    target = FRONTEND_DIST / full_path
    if full_path and target.is_file():
        return FileResponse(target)
    index = FRONTEND_DIST / "index.html"
    if not index.is_file():
        raise HTTPException(status_code=503, detail="Frontend not built — run vite build first")
    return FileResponse(index, media_type="text/html")
