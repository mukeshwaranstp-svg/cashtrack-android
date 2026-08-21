"""
Auth routes — the first endpoints an Android app talks to.

Flow:
  POST /api/auth/register -> create account, return tokens + user
  POST /api/auth/login    -> verify credentials, return tokens + user
  POST /api/auth/refresh  -> exchange refresh token for a new token pair
  GET  /api/auth/me       -> current account (token sanity check)

Register also seeds the per-user singleton rows (profile, wallet, settings,
streak, companion) so a fresh login always has complete state to read.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User
from app.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user,
)
from app.schemas import (
    RegisterRequest, LoginRequest, RefreshRequest,
    AuthResponse, TokenPair, UserOut,
)
from app.state import (
    get_or_create_profile, get_or_create_wallet, get_or_create_companion,
    get_or_create_misc,
)
from app.streak import get_or_create_streak
from app.summary import get_or_create_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
_settings = get_settings()


def _auth_response(user: User) -> AuthResponse:
    return AuthResponse(
        user=UserOut.model_validate(user),
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        token_type="bearer",
        expires_in=_settings.access_token_expire_minutes * 60,
    )


def _seed_user_state(db: Session, user: User) -> None:
    """Create the per-user singleton rows so first sync has full state."""
    get_or_create_profile(db, user.id)
    get_or_create_wallet(db, user.id)
    get_or_create_companion(db, user.id)
    get_or_create_misc(db, user.id)
    get_or_create_streak(db, user.id)
    get_or_create_settings(db, user.id)


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.execute(
        select(User).where(User.email == payload.email.lower())
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=payload.email.lower(),
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _seed_user_state(db, user)
    return _auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Same generic message for unknown email and wrong password — otherwise
    # the error leaks which emails have accounts (user enumeration).
    user = db.execute(
        select(User).where(User.email == payload.email.lower())
    ).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return _auth_response(user)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    user_id = decode_token(payload.refresh_token, expected_type="refresh")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return TokenPair(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        token_type="bearer",
        expires_in=_settings.access_token_expire_minutes * 60,
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Token sanity check — the app calls this after restoring a saved token."""
    return current_user
