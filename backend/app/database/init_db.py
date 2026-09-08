from app.database.base import Base
from app.database.connection import engine
from app.models import Category, Passwords, Users


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
