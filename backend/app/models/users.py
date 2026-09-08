# Model: user.py
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Users(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    email : Mapped[str] = mapped_column(String(30), unique= True,nullable=False)
    master_password_hash: Mapped[str] = mapped_column(String(60), nullable=False)
    
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

