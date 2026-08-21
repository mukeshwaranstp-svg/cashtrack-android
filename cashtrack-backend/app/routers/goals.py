"""Savings goals + savings history CRUD."""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SavingsGoal, SavingsHistory
from app.schemas import (
    SavingsGoalOut, SavingsGoalCreate, SavingsGoalUpdate,
    SavingsHistoryOut, SavingsHistoryCreate,
)

router = APIRouter(prefix="/api")


@router.get("/goals", response_model=list[SavingsGoalOut])
def list_goals(completed: bool | None = None, db: Session = Depends(get_db)):
    query = select(SavingsGoal)
    if completed is not None:
        query = query.where(SavingsGoal.completed == completed)
    query = query.order_by(SavingsGoal.completed, SavingsGoal.priority)
    return db.execute(query).scalars().all()


@router.post("/goals", response_model=SavingsGoalOut, status_code=201)
def create_goal(payload: SavingsGoalCreate, db: Session = Depends(get_db)):
    goal = SavingsGoal(**payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/goals/{goal_id}", response_model=SavingsGoalOut)
def update_goal(goal_id: str, payload: SavingsGoalUpdate, db: Session = Depends(get_db)):
    goal = db.get(SavingsGoal, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(goal, field, value)

    if goal.completed and goal.completion_date is None:
        goal.completion_date = date.today()
    if not goal.completed:
        goal.completion_date = None

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: str, db: Session = Depends(get_db)):
    goal = db.get(SavingsGoal, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"success": True}


@router.get("/savings-history", response_model=list[SavingsHistoryOut])
def list_history(db: Session = Depends(get_db)):
    return db.execute(
        select(SavingsHistory).order_by(SavingsHistory.date.desc())
    ).scalars().all()


@router.post("/savings-history", response_model=SavingsHistoryOut, status_code=201)
def create_history(payload: SavingsHistoryCreate, db: Session = Depends(get_db)):
    entry = SavingsHistory(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
