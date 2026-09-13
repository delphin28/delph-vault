from app.database.base import Base
from app.database.connection import engine
from sqlalchemy import inspect, text
from app.models import Category, Passwords, Users


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

    if engine.dialect.name == "postgresql":
        columns = {column["name"] for column in inspect(engine).get_columns("users")}
        with engine.begin() as connection:
            if "totp_secret" not in columns:
                connection.execute(text('ALTER TABLE users ADD COLUMN totp_secret VARCHAR(512)'))
            if "totp_enabled" not in columns:
                connection.execute(text('ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT FALSE'))
            if "backup_codes" not in columns:
                connection.execute(text('ALTER TABLE users ADD COLUMN backup_codes VARCHAR(4096)'))
            if "session_version" not in columns:
                connection.execute(text('ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0'))

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
