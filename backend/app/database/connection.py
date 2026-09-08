# app/core/connection.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.base import Base

##We will use later .env
DATABASE_URL = (
    "postgresql+psycopg://postgres:password@localhost/adsecure"
)

engine = create_engine(
    DATABASE_URL,
    echo=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()