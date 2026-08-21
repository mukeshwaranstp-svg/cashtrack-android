"""
Insights endpoints: dashboard summary + streak management.
"""
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import get_current_user
from app.streak import get_or_create_streak, apply_break_if_needed
from app.summary import build_summary
from app.schemas import SummaryOut, StreakOut, StreakResetResponse

router = APIRouter(prefix="/api", tags=["insights"])


def _utc_today() -> date:
    return datetime.now(timezone.utc).date()


def _streak_out(streak, today: date) -> StreakOut:
    return StreakOut(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_logged_date=streak.last_logged_date,
        logged_today=streak.last_logged_date == today,
    )


@router.get("/summary", response_model=SummaryOut)
def get_summary(
    today: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today_date = date.fromisoformat(today) if today else _utc_today()

    streak = get_or_create_streak(db, current_user.id)
    apply_break_if_needed(streak, today_date)
    db.commit()

    summary = build_summary(db, current_user.id, today_date)
    return SummaryOut(**summary, streak=_streak_out(streak, today_date))


@router.post("/streak/reset", response_model=StreakResetResponse)
def reset_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    streak = get_or_create_streak(db, current_user.id)
    streak.current_streak = 0
    streak.longest_streak = 0
    streak.last_logged_date = None
    db.commit()
    return StreakResetResponse(success=True, streak=_streak_out(streak, _utc_today()))
