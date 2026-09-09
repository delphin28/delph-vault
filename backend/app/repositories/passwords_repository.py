from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.passwords import Passwords


def list_passwords(db: Session, user_id: int) -> list[Passwords]:
	return list(
		db.scalars(
			select(Passwords)
			.where(Passwords.user_id == user_id)
			.order_by(Passwords.name)
		)
	)


def get_password(db: Session, password_id: int, user_id: int) -> Passwords | None:
	return db.scalar(
		select(Passwords).where(
			Passwords.id == password_id,
			Passwords.user_id == user_id,
		)
	)


def create_password(
	db: Session,
	*,
	name: str,
	url: str | None,
	encrypted_password: str,
	user_id: int,
	category_id: int,
) -> Passwords:
	password = Passwords(
		name=name,
		url=url,
		Password=encrypted_password,
		user_id=user_id,
		category_id=category_id,
	)
	db.add(password)
	db.commit()
	db.refresh(password)
	return password


def delete_password(db: Session, password: Passwords) -> None:
	db.delete(password)
	db.commit()
