"""
ORM models.

The Expense model is a 1:1 mirror of the frontend's Expense interface
(src/types.ts) and the reference Express backend (server.ts). Field names are
kept identical (`date`, `timestamp`, `goalId`...) so the API contract needs
no translation layer.

Single-user app: the singleton tables (UserStreak, Settings) hold exactly one
row, with id fixed to 1, enforced at the application layer.
"""
from __future__ import annotations

import uuid
from datetime import date as Date, datetime, timezone
from sqlalchemy import String, Float, Boolean, Date, DateTime, JSON, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_id)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    bucket: Mapped[str] = mapped_column(String, nullable=False)
    note: Mapped[str] = mapped_column(String, default="")

    # `date` = the date the user says they spent the money (user-editable).
    # `timestamp` = full log timestamp, drives "recent transactions" ordering.
    date: Mapped[Date] = mapped_column(Date, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    justified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Optional link to a savings goal (only set for Savings/Investment entries).
    goal_id: Mapped[str | None] = mapped_column(String, nullable=True)
    goal_name: Mapped[str | None] = mapped_column(String, nullable=True)
    goal_image: Mapped[str | None] = mapped_column(String, nullable=True)
    allocations: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class UserStreak(Base):
    """
    Single-row table (single-user app). Streak advances off the expense
    `date` field — the exact behavior of the reference server.ts backend.
    """
    __tablename__ = "user_streak"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    current_streak: Mapped[int] = mapped_column(default=0)
    longest_streak: Mapped[int] = mapped_column(default=0)
    last_logged_date: Mapped[Date | None] = mapped_column(Date, nullable=True)


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    monthly_budget: Mapped[float] = mapped_column(Float, default=15000.0)
    currency: Mapped[str] = mapped_column(String(10), default="₹")
    theme: Mapped[str] = mapped_column(String(10), default="system")
    alert_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    alert_threshold: Mapped[float] = mapped_column(Float, default=1000.0)
    challenge_days: Mapped[int] = mapped_column(Integer, default=7)


class Wallet(Base):
    """
    Single-row XP/coins wallet + progression stats (cashtrack_xp,
    cashtrack_coins, cashtrack_streak_stats). Kept separate from the
    expense-based user_streak so client missions and server streak stay
    independent, matching how the frontend treats them today.
    """
    __tablename__ = "wallet"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    coins: Mapped[int] = mapped_column(Integer, default=0)
    total_xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    total_coins_earned: Mapped[int] = mapped_column(Integer, default=0)
    freeze_count: Mapped[int] = mapped_column(Integer, default=0)
    completed_missions_count: Mapped[int] = mapped_column(Integer, default=0)
    completed_streak_dates: Mapped[list] = mapped_column(JSON, default=list)
    unlocked_achievements: Mapped[list] = mapped_column(JSON, default=list)


class Profile(Base):
    """Single-row user profile (cashtrack_profile + cashtrack_profile_pic)."""
    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    avatar: Mapped[str] = mapped_column(String(20), default="🦁")
    name: Mapped[str] = mapped_column(String(100), default="")
    username: Mapped[str] = mapped_column(String(100), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    bio: Mapped[str] = mapped_column(String(500), default="")
    profile_pic: Mapped[str | None] = mapped_column(Text, nullable=True)


class SavingsGoal(Base):
    """Mirror of the frontend SavingsGoal shape (SavingsHub.tsx)."""
    __tablename__ = "savings_goals"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    target: Mapped[float] = mapped_column(Float, nullable=False)
    current: Mapped[float] = mapped_column(Float, default=0.0)
    image: Mapped[str] = mapped_column(String(20), default="🎯")
    deadline: Mapped[Date | None] = mapped_column(Date, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[str] = mapped_column(String(500), default="")
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completion_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(20), default="Common")
    status: Mapped[str] = mapped_column(String(40), default="On Track")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SavingsHistory(Base):
    """Savings deposit history (cashtrack_savings_history)."""
    __tablename__ = "savings_history"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_id)
    goal_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    goal_name: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[Date] = mapped_column(Date, nullable=False)
    type: Mapped[str] = mapped_column(String(20), default="deposit")
    notes: Mapped[str] = mapped_column(String(500), default="")


class Todo(Base):
    """To-do list item (cashtrack_todos)."""
    __tablename__ = "todos"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_id)
    text: Mapped[str] = mapped_column(String(300), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    category: Mapped[str] = mapped_column(String(50), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Companion(Base):
    """Single-row companion/mascot settings."""
    __tablename__ = "companion"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    selected: Mapped[str] = mapped_column(String(20), default="waguri")
    visibility: Mapped[str] = mapped_column(String(20), default="events")
    custom_image: Mapped[str | None] = mapped_column(Text, nullable=True)
    custom_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    onboarded: Mapped[bool] = mapped_column(Boolean, default=False)


class MiscState(Base):
    """
    Single-row bucket for small app-level flags that don't deserve their own
    table (cashtrack_last_export, cashtrack_last_budget_update,
    cashtrack_first_expense_logged). Data is a JSON dict keyed by the same
    camelCase names the frontend uses.
    """
    __tablename__ = "misc_state"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
