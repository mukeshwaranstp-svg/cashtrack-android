"""
Central state helpers for the sync layer.

Every singleton table (Wallet, Profile, Companion, MiscState, Settings,
UserStreak) follows the same single-row pattern: get-or-create row id=1.
The bundle functions assemble/disassemble the full client state that
GET/PUT /api/sync exchange.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Wallet, Profile, Companion, MiscState, SavingsGoal, SavingsHistory, Todo,
    Settings,
)
from app.streak import get_or_create_streak, apply_break_if_needed
from app.summary import get_or_create_settings
from app.schemas import (
    WalletOut, ProfileOut, CompanionOut, SavingsGoalOut, SavingsHistoryOut,
    TodoOut, SettingsOut, StreakOut, MiscOut, SyncBundle,
)


def _utc_today() -> date:
    return datetime.now(timezone.utc).date()


def _get_or_create(db: Session, model, id_: int = 1):
    row = db.get(model, id_)
    if row is None:
        row = model(id=id_)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def get_or_create_wallet(db: Session) -> Wallet:
    return _get_or_create(db, Wallet)


def get_or_create_profile(db: Session) -> Profile:
    return _get_or_create(db, Profile)


def get_or_create_companion(db: Session) -> Companion:
    return _get_or_create(db, Companion)


def get_or_create_misc(db: Session) -> MiscState:
    row = _get_or_create(db, MiscState)
    if not isinstance(row.data, dict):
        row.data = {}
        db.commit()
    return row


def _streak_out(streak, today: date) -> StreakOut:
    return StreakOut(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_logged_date=streak.last_logged_date,
        logged_today=streak.last_logged_date == today,
    )


def assemble_bundle(db: Session, today: date | None = None) -> SyncBundle:
    """Read every resource and return the full client-state bundle."""
    today = today or _utc_today()
    wallet = get_or_create_wallet(db)
    profile = get_or_create_profile(db)
    companion = get_or_create_companion(db)
    settings = get_or_create_settings(db)
    streak = get_or_create_streak(db)
    apply_break_if_needed(streak, today)
    misc = get_or_create_misc(db)
    db.commit()

    goals = db.execute(
        select(SavingsGoal).order_by(SavingsGoal.completed, SavingsGoal.priority)
    ).scalars().all()
    history = db.execute(
        select(SavingsHistory).order_by(SavingsHistory.date.desc())
    ).scalars().all()
    todos = db.execute(
        select(Todo).order_by(Todo.sort_order)
    ).scalars().all()

    return SyncBundle(
        profile=ProfileOut.model_validate(profile),
        wallet=WalletOut.model_validate(wallet),
        goals=[SavingsGoalOut.model_validate(g) for g in goals],
        savings_history=[SavingsHistoryOut.model_validate(h) for h in history],
        todos=[TodoOut.model_validate(t) for t in todos],
        companion=CompanionOut.model_validate(companion),
        settings=SettingsOut.model_validate(settings),
        streak=_streak_out(streak, today),
        misc=MiscOut(**misc.data),
    )


def apply_bundle(db: Session, bundle: SyncBundle, today: date | None = None) -> SyncBundle:
    """Persist a full bundle (replace-style upsert), then return what's saved."""
    profile = get_or_create_profile(db)
    for field in ("avatar", "name", "username", "email", "bio", "profile_pic"):
        setattr(profile, field, getattr(bundle.profile, field))

    wallet = get_or_create_wallet(db)
    for field in (
        "xp", "coins", "total_xp_earned", "total_coins_earned", "freeze_count",
        "completed_missions_count", "completed_streak_dates", "unlocked_achievements",
    ):
        setattr(wallet, field, getattr(bundle.wallet, field))

    _upsert_collection(db, SavingsGoal, bundle.goals, SavingsGoalOut)
    _upsert_collection(db, SavingsHistory, bundle.savings_history, SavingsHistoryOut)
    _upsert_collection(db, Todo, bundle.todos, TodoOut)

    companion = get_or_create_companion(db)
    for field in ("selected", "visibility", "custom_image", "custom_name", "onboarded"):
        setattr(companion, field, getattr(bundle.companion, field))

    settings = get_or_create_settings(db)
    for field in (
        "monthly_budget", "currency", "theme", "alert_enabled",
        "alert_threshold", "challenge_days",
    ):
        setattr(settings, field, getattr(bundle.settings, field))

    misc = get_or_create_misc(db)
    misc.data = bundle.misc.model_dump(by_alias=True)

    db.commit()
    return assemble_bundle(db, today)


def _upsert_collection(db: Session, model, items: list, schema):
    """Replace a whole collection: delete rows not in the bundle, upsert the rest."""
    existing = {row.id: row for row in db.execute(select(model)).scalars().all()}
    for item in items:
        row = existing.get(item.id)
        if row is None:
            row = model(id=item.id)
            db.add(row)
        for field in model.__table__.columns.keys():
            if field in ("id", "created_at") or not hasattr(item, field):
                continue
            setattr(row, field, getattr(item, field))
    for row_id, row in existing.items():
        if row_id not in {i.id for i in items}:
            db.delete(row)
