"""To-do list CRUD (per-user)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Todo, User
from app.security import get_current_user
from app.schemas import TodoOut, TodoCreate, TodoUpdate

router = APIRouter(prefix="/api", tags=["todos"])


@router.get("/todos", response_model=list[TodoOut])
def list_todos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.execute(
        select(Todo)
        .where(Todo.user_id == current_user.id)
        .order_by(Todo.sort_order)
    ).scalars().all()


@router.post("/todos", response_model=TodoOut, status_code=201)
def create_todo(
    payload: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = Todo(**payload.model_dump(), user_id=current_user.id)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


def _get_own_todo(db: Session, user_id: str, todo_id: str) -> Todo:
    todo = db.get(Todo, todo_id)
    if todo is None or todo.user_id != user_id:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.put("/todos/{todo_id}", response_model=TodoOut)
def update_todo(
    todo_id: str,
    payload: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = _get_own_todo(db, current_user.id, todo_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = _get_own_todo(db, current_user.id, todo_id)
    db.delete(todo)
    db.commit()
    return {"success": True}
