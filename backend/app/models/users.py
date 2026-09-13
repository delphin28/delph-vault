# Model: user.py
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Users(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    email : Mapped[str] = mapped_column(String(30), unique= True,nullable=False)
    master_password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    totp_secret: Mapped[str | None] = mapped_column(String(512), nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    backup_codes: Mapped[str | None] = mapped_column(String(4096), nullable=True)
    session_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    passwords = relationship(
        "Passwords",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    categories = relationship(
        "Category",
        back_populates="user",
        cascade="all, delete-orphan"
    )

