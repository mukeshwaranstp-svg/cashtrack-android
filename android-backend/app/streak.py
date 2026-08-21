"""
Streak logic, ported per-user from the web backend.

Same behavior contract:
  - First-ever log        -> streak = 1
  - Consecutive-day log   -> streak += 1
  - Same-day log again    -> unchanged
  - Gap > 1 day           -> reset to 1 on next log
  - Backdated log         -> streak untouched
  - Milestones at 3/7/14/30/50/100 days

The only change: state is keyed by user_id instead of the global id=1 row.
"""
from datetime import date

from sqlalchemy.orm import Session

from app.models import UserStreak

MILESTONES = {3, 7, 14, 30, 50, 100}


def get_or_create_streak(db: Session, user_id: str) -> UserStreak:
    streak = db.get(UserStreak, user_id)
    if streak is None:
        streak = UserStreak(
            user_id=user_id, current_streak=0, longest_streak=0, last_logged_date=None
        )
        db.add(streak)
        db.commit()
        db.refresh(streak)
    return streak


def apply_break_if_needed(streak: UserStreak, today: date) -> None:
    if streak.last_logged_date is None:
        return
    gap = (today - streak.last_logged_date).days
    if gap > 1 and today > streak.last_logged_date:
        streak.current_streak = 0


def register_log(
    db: Session, user_id: str, expense_date: date
) -> tuple[UserStreak, bool, int | None]:
    """Call once per new expense logged. Returns (streak, milestone_reached, milestone_value)."""
    streak = get_or_create_streak(db, user_id)
    apply_break_if_needed(streak, expense_date)

    streak_increased = False

    if streak.last_logged_date is None:
        streak.current_streak = 1
        streak.last_logged_date = expense_date
        streak_increased = True
    elif streak.last_logged_date == expense_date:
        pass
    else:
        diff = (expense_date - streak.last_logged_date).days
        if diff == 1:
            streak.current_streak += 1
            streak.last_logged_date = expense_date
            streak_increased = True
        elif expense_date > streak.last_logged_date:
            streak.current_streak = 1
            streak.last_logged_date = expense_date
            streak_increased = True

    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    milestone_reached = streak_increased and streak.current_streak in MILESTONES
    milestone_value = streak.current_streak if milestone_reached else None

    db.commit()
    db.refresh(streak)
    return streak, milestone_reached, milestone_value
