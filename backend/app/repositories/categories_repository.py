from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.categories import Category


def list_categories(db: Session, user_id: int) -> list[Category]:
	return list(
		db.scalars(
			select(Category)
			.where(Category.user_id == user_id)
			.order_by(Category.name)
		)
	)


def get_category(db: Session, category_id: int, user_id: int) -> Category | None:
	return db.scalar(
		select(Category).where(
			Category.id == category_id,
			Category.user_id == user_id,
		)
	)


def create_category(db: Session, *, name: str, user_id: int) -> Category:
	category = Category(name=name, user_id=user_id)
	db.add(category)
	db.commit()
	db.refresh(category)
	return category


def update_category(db: Session, category: Category, *, name: str) -> Category:
	category.name = name
	db.commit()
	db.refresh(category)
	return category
