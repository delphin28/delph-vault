from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user
from app.database.connection import get_db
from app.models.users import Users
from app.repositories.categories_repository import create_category, get_category, list_categories, update_category
from app.schemas import CategoryCreate, CategoryResponse

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return list_categories(db, current_user.id)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def add_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return create_category(db, name=category.name, user_id=current_user.id)


@router.put("/{category_id}", response_model=CategoryResponse)
def edit_category(
    category_id: int,
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    existing_category = get_category(db, category_id, current_user.id)
    if not existing_category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    return update_category(db, existing_category, name=category.name)
