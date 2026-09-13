import os

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-with-32-bytes-minimum")
os.environ.setdefault("VAULT_ENCRYPTION_KEY", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
os.environ.setdefault("COOKIE_SECURE", "false")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient

from app.database.base import Base
from app.database.connection import get_db
from app.dependencies import CSRF_COOKIE, CSRF_HEADER, get_current_user, issue_csrf_token
from app.main import app
from app.models.categories import Category
from app.models.passwords import Passwords
from app.models.users import Users
from app.services.vault_crypto import encrypt_secret


@pytest.fixture()
def database():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        user = Users(username="Test User", email="test@example.com", master_password_hash="hash")
        session.add(user)
        session.flush()
        category = Category(name="Personal", user_id=user.id)
        session.add(category)
        session.flush()
        password = Passwords(
            name="Example",
            url="https://example.com",
            Password=encrypt_secret("old-secret"),
            user_id=user.id,
            category_id=category.id,
        )
        session.add(password)
        session.commit()
        yield engine, user.id, category.id, password.id
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client(database):
    engine, user_id, _, _ = database

    def override_db():
        with Session(engine) as session:
            yield session

    def override_user():
        with Session(engine) as session:
            return session.get(Users, user_id)

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    with TestClient(app) as test_client:
        csrf_token = issue_csrf_token()
        test_client.cookies.set(CSRF_COOKIE, csrf_token)
        test_client.headers.update({CSRF_HEADER: csrf_token})
        yield test_client
    app.dependency_overrides.clear()