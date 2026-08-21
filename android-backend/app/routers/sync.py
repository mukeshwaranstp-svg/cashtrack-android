"""GET/PUT /api/sync — the full client-state bundle endpoint (per-user)."""
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import get_current_user
from app.schemas import SyncBundle
from app.state import assemble_bundle, apply_bundle

router = APIRouter(prefix="/api", tags=["sync"])


@router.get("/sync", response_model=SyncBundle)
def get_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return assemble_bundle(db, current_user.id)


@router.put("/sync", response_model=SyncBundle)
def put_sync(
    bundle: SyncBundle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return apply_bundle(db, current_user.id, bundle)
