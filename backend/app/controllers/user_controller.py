from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories.users_repository import (
    create_user,
    get_user_by_email,
    get_user_by_username,
)
from app.schemas_users import UserCreate
from app.utils.security import hash_password
from app.rate_limit import limiter

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register_user(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if get_user_by_username(db, user_data.username):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already registered")

    user = create_user(
        db,
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )
    return {"id": user.id, "username": user.username, "email": user.email}