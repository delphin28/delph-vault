from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.users import Users


def seed_users(db: Session):

    exists = (
        db.query(Users)
        .filter(Users.email == "admin@adsecure.com")
        .first()
    )

    if exists:
        return

    admin = Users(
        username="Admin",
        email="admin@adsecure.com",
        master_password_hash="HASHED_PASSWORD"
    )

    db.add(admin)
    db.commit()