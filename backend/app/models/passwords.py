# Model: password.py
from typing import Optional
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Passwords(Base):
    __tablename__ = "passwords"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    name: Mapped[str] = mapped_column(
        String(15),
        nullable=False
    )

    url: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )

    Password: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )
    

    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"),
        nullable=False
    )

    user = relationship(
        "Users",
        back_populates="passwords"
    )

    category = relationship(
        "Categories",
        back_populates="passwords",
        cascade="all, delete-orphan"
    )