"""
Streak logic edge cases, ported to the server.ts-compatible contract
(register_log advances off the user-supplied expense date).
"""
from datetime import date
from sqlalchemy.orm import Session
from app.streak import register_log, get_or_create_streak


def test_first_log_starts_streak_at_1(db: Session):
    streak, milestone, _ = register_log(db, expense_date=date(2026, 1, 1))
    assert streak.current_streak == 1
    assert streak.longest_streak == 1
    assert milestone is False


def test_consecutive_days_increment(db: Session):
    register_log(db, expense_date=date(2026, 1, 1))
    streak, _, _ = register_log(db, expense_date=date(2026, 1, 2))
    assert streak.current_streak == 2


def test_same_day_twice_does_not_double_count(db: Session):
    register_log(db, expense_date=date(2026, 1, 1))
    streak, _, _ = register_log(db, expense_date=date(2026, 1, 1))
    assert streak.current_streak == 1


def test_gap_breaks_streak(db: Session):
    register_log(db, expense_date=date(2026, 1, 1))
    register_log(db, expense_date=date(2026, 1, 2))
    # skip Jan 3, log on Jan 4 -> gap of 2 days -> streak resets to 1
    streak, _, _ = register_log(db, expense_date=date(2026, 1, 4))
    assert streak.current_streak == 1


def test_backdated_log_does_not_advance_or_break(db: Session):
    register_log(db, expense_date=date(2026, 1, 5))
    # logging with a past date (before last_logged_date) is ignored
    streak, _, _ = register_log(db, expense_date=date(2026, 1, 3))
    assert streak.current_streak == 1
    assert streak.last_logged_date == date(2026, 1, 5)


def test_longest_streak_persists_after_break(db: Session):
    for d in range(1, 8):  # 7-day streak
        register_log(db, expense_date=date(2026, 1, d))
    # break it
    streak, _, _ = register_log(db, expense_date=date(2026, 1, 20))
    assert streak.current_streak == 1
    assert streak.longest_streak == 7


def test_milestone_detected_at_3_days(db: Session):
    register_log(db, expense_date=date(2026, 1, 1))
    register_log(db, expense_date=date(2026, 1, 2))
    streak, milestone, value = register_log(db, expense_date=date(2026, 1, 3))
    assert milestone is True
    assert value == 3


def test_milestone_only_on_streak_increasing_days(db: Session):
    register_log(db, expense_date=date(2026, 1, 1))
    register_log(db, expense_date=date(2026, 1, 2))
    # same-day log again must NOT re-trigger the 3-day milestone
    streak, milestone, value = register_log(db, expense_date=date(2026, 1, 2))
    assert milestone is False
    assert streak.current_streak == 2


def test_streak_break_checked_on_read(db: Session):
    # log once, then simulate reading the streak 5 days later
    register_log(db, expense_date=date(2026, 1, 1))
    streak = get_or_create_streak(db)
    from app.streak import apply_break_if_needed

    apply_break_if_needed(streak, date(2026, 1, 6))
    assert streak.current_streak == 0
