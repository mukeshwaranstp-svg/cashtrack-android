"""
Streak logic — a faithful port of server.ts's streak handling.

Behavior contract (identical to the reference Express backend):
  - The streak advances off the expense's `date` field (what the user logged),
    exactly like server.ts does. This is the single-user habit-tracking rule.
  - First-ever log            -> streak = 1
  - Consecutive-day log       -> streak += 1
  - Same-day log again        -> streak unchanged (no double count)
  - Log with a gap > 1 day    -> streak resets to 1 (a fresh start)
  - Log dated before last log -> streak untouched (can't game it backwards)
  - Milestones at 3, 7, 14, 30, 50, 100 days trigger the celebration modal.
"""
from datetime import date
from sqlalchemy.orm import Session
from app.models import UserStreak

MILESTONES = {3, 7, 14, 30, 50, 100}


def get_or_create_streak(db: Session) -> UserStreak:
    streak = db.get(UserStreak, 1)
    if streak is None:
        streak = UserStreak(id=1, current_streak=0, longest_streak=0, last_logged_date=None)
        db.add(streak)
        db.commit()
        db.refresh(streak)
    return streak


def apply_break_if_needed(streak: UserStreak, today: date) -> None:
    """If more than 1 day has passed since the last log, the streak is broken.
    Mirrors server.ts's checkAndUpdateStreakBreak. Call before reading state."""
    if streak.last_logged_date is None:
        return
    gap = (today - streak.last_logged_date).days
    if gap > 1 and today > streak.last_logged_date:
        streak.current_streak = 0


def register_log(db: Session, expense_date: date) -> tuple[UserStreak, bool, int | None]:
    """
    Call once per new expense logged. `expense_date` is the user-supplied date
    from the request body (server.ts parity).

    Returns (streak, milestone_reached, milestone_value).
    """
    streak = get_or_create_streak(db)
    apply_break_if_needed(streak, expense_date)

    streak_increased = False

    if streak.last_logged_date is None:
        streak.current_streak = 1
        streak.last_logged_date = expense_date
        streak_increased = True
    elif streak.last_logged_date == expense_date:
        pass  # already logged today — streak unchanged
    else:
        diff = (expense_date - streak.last_logged_date).days
        if diff == 1:
            streak.current_streak += 1
            streak.last_logged_date = expense_date
            streak_increased = True
        elif expense_date > streak.last_logged_date:
            # gap > 1 already zeroed by apply_break_if_needed; fresh start
            streak.current_streak = 1
            streak.last_logged_date = expense_date
            streak_increased = True
        # expense_date in the past: don't advance the streak backwards

    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    milestone_reached = streak_increased and streak.current_streak in MILESTONES
    milestone_value = streak.current_streak if milestone_reached else None

    db.commit()
    db.refresh(streak)
    return streak, milestone_reached, milestone_value
