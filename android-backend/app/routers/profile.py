"""Profile, wallet (rewards) and companion singleton resources."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import get_current_user
from app.schemas import ProfileOut, WalletOut, CompanionOut
from app.state import (
    get_or_create_profile, get_or_create_wallet, get_or_create_companion,
)

router = APIRouter(prefix="/api", tags=["profile"])


@router.get("/profile", response_model=ProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_or_create_profile(db, current_user.id)


@router.put("/profile", response_model=ProfileOut)
def put_profile(
    payload: ProfileOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_or_create_profile(db, current_user.id)
    for field in ("avatar", "name", "username", "email", "bio", "profile_pic"):
        setattr(profile, field, getattr(payload, field))
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/wallet", response_model=WalletOut)
def get_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_or_create_wallet(db, current_user.id)


@router.put("/wallet", response_model=WalletOut)
def put_wallet(
    payload: WalletOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wallet = get_or_create_wallet(db, current_user.id)
    for field in (
        "xp", "coins", "total_xp_earned", "total_coins_earned", "freeze_count",
        "completed_missions_count", "completed_streak_dates", "unlocked_achievements",
    ):
        setattr(wallet, field, getattr(payload, field))
    db.commit()
    db.refresh(wallet)
    return wallet


@router.get("/companion", response_model=CompanionOut)
def get_companion(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_or_create_companion(db, current_user.id)


@router.put("/companion", response_model=CompanionOut)
def put_companion(
    payload: CompanionOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    companion = get_or_create_companion(db, current_user.id)
    for field in ("selected", "visibility", "custom_image", "custom_name", "onboarded"):
        setattr(companion, field, getattr(payload, field))
    db.commit()
    db.refresh(companion)
    return companion
