"""
Authentication primitives: password hashing, JWT issuing/verifying, and the
`get_current_user` dependency every protected route depends on.

Why JWT for mobile: the app can't rely on browser cookies. A bearer token in
the Authorization header works identically from Kotlin/Java HTTP clients, and
the token itself carries the user id — no session store lookup per request.

Password hashing uses PBKDF2-HMAC-SHA256 (stdlib). Deliberately NOT plaintext,
NOT MD5/SHA1: PBKDF2 is deliberately slow so a leaked DB can't be brute-forced
cheaply, and it avoids native bcrypt build issues across platforms.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User

_settings = get_settings()

# HTTPBearer auto-extracts "Authorization: Bearer <token>" and returns 403
# with no header; we convert that to 401 below via auto_error=False handling.
_bearer = HTTPBearer(auto_error=False)

PBKDF2_ITERATIONS = 240_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS
    ).hex()
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, iterations, salt, digest = stored.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), salt.encode(), int(iterations)
        ).hex()
        return hmac.compare_digest(candidate, digest)
    except (ValueError, TypeError):
        return False


def _create_token(user_id: str, token_type: str, lifetime: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": token_type,
        "iat": now,
        "exp": now + lifetime,
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, _settings.secret_key, algorithm=_settings.algorithm)


def create_access_token(user_id: str) -> str:
    return _create_token(
        user_id, "access", timedelta(minutes=_settings.access_token_expire_minutes)
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        user_id, "refresh", timedelta(days=_settings.refresh_token_expire_days)
    )


def decode_token(token: str, expected_type: str) -> str:
    """Verify signature/expiry/type and return the user id (`sub`)."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, _settings.secret_key, algorithms=[_settings.algorithm]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise credentials_error

    if payload.get("type") != expected_type:
        # e.g. a refresh token presented where an access token is required.
        raise credentials_error
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_error
    return user_id


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Dependency for protected routes: resolves the User or raises 401."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = decode_token(credentials.credentials, expected_type="access")
    user = db.get(User, user_id)
    if user is None:
        # Token valid but account deleted since issuance.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
