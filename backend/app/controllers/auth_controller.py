from datetime import datetime, timedelta, timezone
import json
import os
import secrets

import jwt
import pyotp
from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, status
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories.users_repository import get_user_by_email
from app.dependencies import (
    ACCESS_TOKEN_COOKIE,
    CSRF_COOKIE,
    get_current_user,
    issue_csrf_token,
    mark_recent_verification,
    require_recent_verification,
)
from app.models.users import Users
from app.rate_limit import limiter
from app.services.vault_crypto import decrypt_secret, encrypt_secret
from app.utils.security import hash_password


password_hash = PasswordHash.recommended()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
)
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "strict")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not configured")

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.get("/csrf")
def csrf_token(request: Request, response: Response):
    token = request.cookies.get(CSRF_COOKIE) or issue_csrf_token()
    if not request.cookies.get(CSRF_COOKIE):
        response.set_cookie(
            CSRF_COOKIE,
            token,
            httponly=False,
            secure=True,
            samesite=COOKIE_SAMESITE,
            max_age=3600,
            path="/",
        )
    return {"csrf_token": token}


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    otp: str | None = Form(default=None),
    backup_code: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    user = get_user_by_email(db, username)

    if not user or not password_hash.verify(password, user.master_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.totp_enabled:
        if otp and user.totp_secret:
            try:
                secret = decrypt_secret(user.totp_secret)
            except ValueError as error:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="MFA configuration is invalid") from error
            if not pyotp.TOTP(secret).verify(otp, valid_window=1):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticator code")
        elif backup_code:
            stored_codes = json.loads(user.backup_codes or "[]")
            matched_code = next((stored for stored in stored_codes if password_hash.verify(backup_code, stored)), None)
            if not matched_code:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid backup code")
            stored_codes.remove(matched_code)
            user.backup_codes = json.dumps(stored_codes)
            db.commit()
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MFA_REQUIRED")

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    token = jwt.encode(
        {
            "sub": str(user.id),
            "email": user.email,
            "username": user.username,
            "exp": expires_at,
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

    response = Response(content='{"authenticated":true}', media_type="application/json")
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=token,
        httponly=True,
        secure=True,
        samesite=COOKIE_SAMESITE,
        max_age=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return response


@router.post("/mfa/setup")
@limiter.limit("3/minute")
def setup_mfa(
    request: Request,
    password: str = Form(...),
    current_user: Users = Depends(get_current_user),
):
    if not password_hash.verify(password, current_user.master_password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid master password")

    secret = pyotp.random_base32()
    uri = pyotp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="Delph Vault",
    )
    response = Response(
        content=json.dumps({"secret": secret, "otpauth_uri": uri}),
        media_type="application/json",
    )
    mark_recent_verification(response)
    return response


@router.post("/mfa/verify")
@limiter.limit("5/minute")
def verify_mfa(
    request: Request,
    code: str = Form(...),
    secret: str = Form(...),
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
    _recent: None = Depends(require_recent_verification),
):
    if not pyotp.TOTP(secret).verify(code, valid_window=1):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid authenticator code")

    current_user.totp_secret = encrypt_secret(secret)
    current_user.totp_enabled = True
    backup_codes = [secrets.token_hex(4).upper() for _ in range(10)]
    current_user.backup_codes = json.dumps([hash_password(code) for code in backup_codes])
    db.commit()
    return {"enabled": True, "backup_codes": backup_codes}


@router.post("/mfa/backup-codes")
@limiter.limit("3/minute")
def regenerate_backup_codes(
    request: Request,
    password: str = Form(...),
    otp: str = Form(...),
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not password_hash.verify(password, current_user.master_password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid master password")
    if not current_user.totp_secret or not pyotp.TOTP(decrypt_secret(current_user.totp_secret)).verify(otp, valid_window=1):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticator code")

    backup_codes = [secrets.token_hex(4).upper() for _ in range(10)]
    current_user.backup_codes = json.dumps([hash_password(code) for code in backup_codes])
    db.commit()
    return {"backup_codes": backup_codes}


@router.post("/mfa/disable")
@limiter.limit("3/minute")
def disable_mfa(
    request: Request,
    password: str = Form(...),
    otp: str = Form(...),
    current_user: Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not password_hash.verify(password, current_user.master_password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid master password")
    if not current_user.totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA is not enabled")
    if not pyotp.TOTP(decrypt_secret(current_user.totp_secret)).verify(otp, valid_window=1):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticator code")
    current_user.totp_secret = None
    current_user.totp_enabled = False
    current_user.backup_codes = None
    db.commit()
    return {"enabled": False}


@router.get("/me")
def current_user(current_user: Users = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "mfa_enabled": current_user.totp_enabled,
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=ACCESS_TOKEN_COOKIE, path="/")
    return {"authenticated": False}
