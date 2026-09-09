import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.categories import Category
from app.models.passwords import Passwords
from app.models.users import Users
from app.services.vault_crypto import encrypt_secret
from app.utils.security import hash_password

SEED_DATA_PATH = Path(__file__).with_name("seed_data.json")


def seed_users(db: Session) -> Users:

    exists = (
        db.query(Users)
        .filter(Users.email == "admin@adsecure.com")
        .first()
    )

    if exists:
        return exists

    admin = Users(
        username="Admin",
        email="admin@adsecure.com",
        # The master password should be hashed before being stored in the database.
        master_password_hash=hash_password("your_master_password")
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def seed_vault(db: Session, user: Users) -> None:
    with SEED_DATA_PATH.open("r", encoding="utf-8") as seed_file:
        seed_data = json.load(seed_file)

    categories = {}
    for category_name in seed_data.get("categories", []):
        category = (
            db.query(Category)
            .filter(Category.user_id == user.id, Category.name == category_name)
            .first()
        )
        if not category:
            category = Category(name=category_name, user_id=user.id)
            db.add(category)
            db.flush()
        categories[category_name] = category

    for entry in seed_data.get("passwords", []):
        category = categories.get(entry["category"])
        if not category:
            raise ValueError(f"Unknown seed category: {entry['category']}")

        exists = (
            db.query(Passwords)
            .filter(Passwords.user_id == user.id, Passwords.name == entry["name"])
            .first()
        )
        if exists:
            continue

        db.add(
            Passwords(
                name=entry["name"],
                url=entry.get("url"),
                Password=encrypt_secret(entry["password"]),
                user_id=user.id,
                category_id=category.id,
            )
        )

    db.commit()