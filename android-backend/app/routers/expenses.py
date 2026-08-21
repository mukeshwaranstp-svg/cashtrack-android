"""
Expense CRUD, scoped to the authenticated user.

Every query filters by user_id — the single most important line in each
handler. Without it, one account's request could read or delete another
account's rows (an Insecure Direct Object Reference vulnerability).
"""
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Expense
from app.categories import get_bucket_for_category
from app.streak import get_or_create_streak, apply_break_if_needed, register_log
from app.security import get_current_user
from app.models import User
from app.schemas import (
    ExpenseCreate, ExpenseUpdate, ExpenseReviewUpdate, ExpenseOut,
    ExpenseCreateResponse, ExpenseWriteResponse, StreakOut,
)

router = APIRouter(prefix="/api", tags=["expenses"])


def _utc_today() -> date:
    return datetime.now(timezone.utc).date()


def _streak_out(streak, today: date) -> StreakOut:
    return StreakOut(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_logged_date=streak.last_logged_date,
        logged_today=streak.last_logged_date == today,
    )


def _get_own_expense(db: Session, user_id: str, expense_id: str) -> Expense:
    expense = db.get(Expense, expense_id)
    if expense is None or expense.user_id != user_id:
        # Same 404 for "doesn't exist" and "exists but not yours" — never
        # confirm to a caller that another account's resource id is valid.
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("/expense", response_model=ExpenseCreateResponse)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense_date = payload.date or _utc_today()
    expense_timestamp = payload.timestamp or datetime.now(timezone.utc)

    expense = Expense(
        user_id=current_user.id,
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

    streak, milestone_reached, milestone_value = register_log(
        db, current_user.id, expense_date=expense_date
    )

    return ExpenseCreateResponse(
        success=True,
        expense=ExpenseOut.model_validate(expense),
        streak=_streak_out(streak, expense_date),
        milestone_reached=milestone_reached,
        milestone_value=milestone_value,
    )


@router.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(
    limit: int = Query(default=500, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.execute(
        select(Expense)
        .where(Expense.user_id == current_user.id)
        .order_by(Expense.timestamp.desc())
        .limit(limit)
    ).scalars().all()


@router.put("/expense/{expense_id}", response_model=ExpenseWriteResponse)
def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = _get_own_expense(db, current_user.id, expense_id)

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

    expense.goal_id = payload.goal_id
    expense.goal_name = payload.goal_name
    expense.goal_image = payload.goal_image
    expense.allocations = payload.allocations

    db.commit()
    db.refresh(expense)
    return ExpenseWriteResponse(success=True, expense=ExpenseOut.model_validate(expense))


@router.patch("/expense/{expense_id}", response_model=ExpenseWriteResponse)
def review_expense(
    expense_id: str,
    payload: ExpenseReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = _get_own_expense(db, current_user.id, expense_id)

    if payload.reviewed is not None:
        expense.reviewed = payload.reviewed
    if payload.justified is not None:
        expense.justified = payload.justified

    db.commit()
    db.refresh(expense)
    return ExpenseWriteResponse(success=True, expense=ExpenseOut.model_validate(expense))


@router.delete("/expense/{expense_id}")
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = _get_own_expense(db, current_user.id, expense_id)
    db.delete(expense)
    db.commit()
    return {"success": True}


@router.get("/streak", response_model=StreakOut, tags=["insights"])
def get_streak(
    today: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today_date = date.fromisoformat(today) if today else _utc_today()
    streak = get_or_create_streak(db, current_user.id)
    apply_break_if_needed(streak, today_date)
    db.commit()
    return _streak_out(streak, today_date)
