"""
Central state helpers for the sync layer (per-user).

Same single-row-per-resource pattern as the web backend, except "single row"
now means single row *for this user* — keyed by user_id, not a global id=1.
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


def get_or_create_wallet(db: Session, user_id: str) -> Wallet:
    return _get_or_create(db, Wallet, user_id)


def get_or_create_profile(db: Session, user_id: str) -> Profile:
    return _get_or_create(db, Profile, user_id)


def get_or_create_companion(db: Session, user_id: str) -> Companion:
    return _get_or_create(db, Companion, user_id)


def get_or_create_misc(db: Session, user_id: str) -> MiscState:
    row = _get_or_create(db, MiscState, user_id)
    if not isinstance(row.data, dict):
        row.data = {}
        db.commit()
    return row


def _get_or_create(db: Session, model, user_id: str):
    row = db.get(model, user_id)
    if row is None:
        row = model(user_id=user_id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _streak_out(streak, today: date) -> StreakOut:
    return StreakOut(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_logged_date=streak.last_logged_date,
        logged_today=streak.last_logged_date == today,
    )


def assemble_bundle(db: Session, user_id: str, today: date | None = None) -> SyncBundle:
    """Read every resource for this user and return the full client-state bundle."""
    today = today or _utc_today()
    wallet = get_or_create_wallet(db, user_id)
    profile = get_or_create_profile(db, user_id)
    companion = get_or_create_companion(db, user_id)
    settings = get_or_create_settings(db, user_id)
    streak = get_or_create_streak(db, user_id)
    apply_break_if_needed(streak, today)
    misc = get_or_create_misc(db, user_id)
    db.commit()

    goals = db.execute(
        select(SavingsGoal)
        .where(SavingsGoal.user_id == user_id)
        .order_by(SavingsGoal.completed, SavingsGoal.priority)
    ).scalars().all()
    history = db.execute(
        select(SavingsHistory)
        .where(SavingsHistory.user_id == user_id)
        .order_by(SavingsHistory.date.desc())
    ).scalars().all()
    todos = db.execute(
        select(Todo).where(Todo.user_id == user_id).order_by(Todo.sort_order)
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


def apply_bundle(
    db: Session, user_id: str, bundle: SyncBundle, today: date | None = None
) -> SyncBundle:
    """Persist a full bundle (replace-style upsert), then return what's saved."""
    profile = get_or_create_profile(db, user_id)
    for field in ("avatar", "name", "username", "email", "bio", "profile_pic"):
        setattr(profile, field, getattr(bundle.profile, field))

    wallet = get_or_create_wallet(db, user_id)
    for field in (
        "xp", "coins", "total_xp_earned", "total_coins_earned", "freeze_count",
        "completed_missions_count", "completed_streak_dates", "unlocked_achievements",
    ):
        setattr(wallet, field, getattr(bundle.wallet, field))

    _upsert_collection(db, user_id, SavingsGoal, bundle.goals, SavingsGoalOut)
    _upsert_collection(db, user_id, SavingsHistory, bundle.savings_history, SavingsHistoryOut)
    _upsert_collection(db, user_id, Todo, bundle.todos, TodoOut)

    companion = get_or_create_companion(db, user_id)
    for field in ("selected", "visibility", "custom_image", "custom_name", "onboarded"):
        setattr(companion, field, getattr(bundle.companion, field))

    settings = get_or_create_settings(db, user_id)
    for field in (
        "monthly_budget", "currency", "theme", "alert_enabled",
        "alert_threshold", "challenge_days",
    ):
        setattr(settings, field, getattr(bundle.settings, field))

    misc = get_or_create_misc(db, user_id)
    misc.data = bundle.misc.model_dump(by_alias=True)

    db.commit()
    return assemble_bundle(db, user_id, today)


def _upsert_collection(db: Session, user_id: str, model, items: list, schema):
    """Replace this user's collection: delete rows not in the bundle, upsert the rest.

    The id filter is scoped by user_id in both directions — a malicious client
    can never delete or overwrite another account's rows by sending their ids.
    """
    existing = {
        row.id: row
        for row in db.execute(select(model).where(model.user_id == user_id)).scalars().all()
    }
    incoming_ids = {i.id for i in items}
    for item in items:
        row = existing.get(item.id)
        if row is None:
            row = model(id=item.id, user_id=user_id)
            db.add(row)
        for field in model.__table__.columns.keys():
            if field in ("id", "created_at", "user_id") or not hasattr(item, field):
                continue
            setattr(row, field, getattr(item, field))
    for row_id, row in existing.items():
        if row_id not in incoming_ids:
            db.delete(row)
