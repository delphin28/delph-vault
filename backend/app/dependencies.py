import os
import secrets
import time
from hashlib import sha256
from hmac import compare_digest, new

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.users import Users
from app.repositories.users_repository import get_user_by_id

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

ACCESS_TOKEN_COOKIE = "access_token"
CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"
RECENT_VERIFICATION_COOKIE = "recent_verification"


def issue_csrf_token() -> str:
    token = secrets.token_urlsafe(32)
    signature = new(JWT_SECRET_KEY.encode(), token.encode(), sha256).hexdigest()
    return f"{token}.{signature}"


def verify_csrf_token(token: str | None) -> bool:
    if not token or "." not in token:
        return False

    value, signature = token.rsplit(".", 1)
    expected_signature = new(JWT_SECRET_KEY.encode(), value.encode(), sha256).hexdigest()
    return compare_digest(signature, expected_signature)


def mark_recent_verification(response) -> None:
    timestamp = str(int(time.time()))
    signature = new(JWT_SECRET_KEY.encode(), timestamp.encode(), sha256).hexdigest()
    response.set_cookie(
        RECENT_VERIFICATION_COOKIE,
        f"{timestamp}.{signature}",
        httponly=True,
        secure=True,
        samesite=os.getenv("COOKIE_SAMESITE", "strict"),
        max_age=600,
        path="/",
    )


def require_recent_verification(
    recent: str | None = Cookie(default=None, alias=RECENT_VERIFICATION_COOKIE),
) -> None:
    try:
        timestamp, signature = recent.split(".", 1)
        expected_signature = new(JWT_SECRET_KEY.encode(), timestamp.encode(), sha256).hexdigest()
        valid = compare_digest(signature, expected_signature)
        is_recent = time.time() - int(timestamp) <= 600
    except (AttributeError, TypeError, ValueError):
        valid = False
        is_recent = False

    if not valid or not is_recent:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recent verification required")


def get_current_user(
    token: str | None = Cookie(default=None, alias=ACCESS_TOKEN_COOKIE),
    db: Session = Depends(get_db),
) -> Users:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
        if user_id <= 0:
            raise credentials_exception
    except (KeyError, jwt.InvalidTokenError, TypeError, ValueError):
        raise credentials_exception

    user = get_user_by_id(db, int(user_id))
    if not user:
        raise credentials_exception

    return user
