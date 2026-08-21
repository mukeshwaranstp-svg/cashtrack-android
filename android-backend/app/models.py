"""
ORM models (Android backend).

The web backend was single-user: every table had exactly one row (id=1) and no
auth. An Android app is inherently multi-user — each install belongs to an
account — so every model here carries a `user_id` FK and every query filters
by it. The "singleton" tables (streak, settings, wallet, profile, companion,
misc) are now singletons *per user*: primary key = user_id.

Field names still mirror the frontend's TypeScript shapes so the Android
client can reuse the same JSON contract as the web app.
"""
from __future__ import annotations

import uuid
from datetime import date as Date, datetime, timezone

from sqlalchemy import String, Float, Boolean, Date, DateTime, JSON, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), default="")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    bucket: Mapped[str] = mapped_column(String, nullable=False)
    note: Mapped[str] = mapped_column(String, default="")
    date: Mapped[Date] = mapped_column(Date, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    justified: Mapped[bool] = mapped_column(Boolean, default=False)
    goal_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    goal_name: Mapped[str | None] = mapped_column(String, nullable=True)
    goal_image: Mapped[str | None] = mapped_column(String, nullable=True)
    allocations: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class UserStreak(Base):
    """Per-user streak state; advances off the expense's `date` field."""
    __tablename__ = "user_streaks"

    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_logged_date: Mapped[Date | None] = mapped_column(Date, nullable=True)


class Settings(Base):
    __tablename__ = "settings"

    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    monthly_budget: Mapped[float] = mapped_column(Float, default=15000.0)
    currency: Mapped[str] = mapped_column(String(10), default="₹")
    theme: Mapped[str] = mapped_column(String(10), default="system")
    alert_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    alert_threshold: Mapped[float] = mapped_column(Float, default=1000.0)
    challenge_days: Mapped[int] = mapped_column(Integer, default=7)


class Wallet(Base):
    """Per-user XP/coins wallet + progression stats."""
    __tablename__ = "wallets"

    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    xp: Mapped[int] = mapped_column(Integer, default=0)
    coins: Mapped[int] = mapped_column(Integer, default=0)
    total_xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    total_coins_earned: Mapped[int] = mapped_column(Integer, default=0)
    freeze_count: Mapped[int] = mapped_column(Integer, default=0)
    completed_missions_count: Mapped[int] = mapped_column(Integer, default=0)
    completed_streak_dates: Mapped[list] = mapped_column(JSON, default=list)
    unlocked_achievements: Mapped[list] = mapped_column(JSON, default=list)


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    avatar: Mapped[str] = mapped_column(String(20), default="🦁")
    name: Mapped[str] = mapped_column(String(100), default="")
    username: Mapped[str] = mapped_column(String(100), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    bio: Mapped[str] = mapped_column(String(500), default="")
    profile_pic: Mapped[str | None] = mapped_column(Text, nullable=True)


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class SavingsHistory(Base):
    __tablename__ = "savings_history"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    goal_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    goal_name: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[Date] = mapped_column(Date, nullable=False)
    type: Mapped[str] = mapped_column(String(20), default="deposit")
    notes: Mapped[str] = mapped_column(String(500), default="")


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_id)
    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    text: Mapped[str] = mapped_column(String(300), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    category: Mapped[str] = mapped_column(String(50), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Companion(Base):
    __tablename__ = "companions"

    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    selected: Mapped[str] = mapped_column(String(20), default="waguri")
    visibility: Mapped[str] = mapped_column(String(20), default="events")
    custom_image: Mapped[str | None] = mapped_column(Text, nullable=True)
    custom_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    onboarded: Mapped[bool] = mapped_column(Boolean, default=False)


class MiscState(Base):
    """Per-user bucket for small app-level flags that don't deserve a table."""
    __tablename__ = "misc_state"

    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    data: Mapped[dict] = mapped_column(JSON, default=dict)
