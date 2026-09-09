"""
The purpose of this file is to provide user database computation logic
"""

# app/repositories/password_repository.py

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.users import Users

def get_user_by_email(db: Session, email: str) -> Users | None:
    """
    Get a user by email.

    Args:
        db (Session): The database session.
        email (str): The email of the user.

    Returns:
        Users | None: The user object if found, otherwise None.
    """
    return db.scalar(select(Users).where(Users.email == email))

def get_user_by_username(db: Session, username: str) -> Users | None:
    """
    Get a user by username.

    Args:
        db (Session): The database session.
        username (str): The username of the user.

    Returns:
        Users | None: The user object if found, otherwise None.
    """
    return db.scalar(select(Users).where(Users.username == username))


