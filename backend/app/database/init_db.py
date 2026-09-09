from app.database.base import Base
from app.database.connection import engine
from sqlalchemy import inspect, text
from app.models import Category, Passwords, Users


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

    if engine.dialect.name == "postgresql":
        password_column = next(
            column
            for column in inspect(engine).get_columns("passwords")
            if column["name"] == "Password"
        )
        if password_column["type"].length < 512:
            with engine.begin() as connection:
                connection.execute(
                    text('ALTER TABLE passwords ALTER COLUMN "Password" TYPE VARCHAR(512)')
                )


if __name__ == "__main__":
    init_db()
