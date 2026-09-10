from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies import get_current_user
from app.models.users import Users
from app.repositories.categories_repository import get_category
from app.repositories.passwords_repository import (
    create_password,
    delete_password,
    get_password,
    list_passwords,
)
from app.schemas import PasswordCreate, PasswordResponse, PasswordRevealResponse, PasswordUpdate
from app.services.export_crypto import encrypt_export
from app.services.vault_crypto import decrypt_secret, encrypt_secret
from app.utils.security import verify_password

router = APIRouter(
    prefix="/passwords",
    tags=["Passwords"],
    dependencies=[Depends(get_current_user)],
)


def to_response(password) -> PasswordResponse:
    return PasswordResponse(
        id=password.id,
        name=password.name,
        url=password.url,
        category_id=password.category_id,
    )


@router.get("", response_model=list[PasswordResponse])
def get_passwords(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return [to_response(item) for item in list_passwords(db, current_user.id)]


@router.post("/export")
def export_passwords(
    password: str = Form(...),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    if not verify_password(password, current_user.master_password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid master password")

    exported_entries = []

    for entry in list_passwords(db, current_user.id):
        try:
            plaintext = decrypt_secret(entry.Password)
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Stored vault secret cannot be decrypted",
            ) from error

        exported_entries.append(
            {
                "name": entry.name,
                "url": entry.url,
                "category": entry.category.name if entry.category else None,
                "password": plaintext,
            }
        )

    return encrypt_export({
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
        },
        "entries": exported_entries,
    }, password)


@router.post("", response_model=PasswordResponse, status_code=status.HTTP_201_CREATED)
def add_password(
    entry: PasswordCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    category = get_category(db, entry.category_id, current_user.id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    password = create_password(
        db,
        name=entry.name,
        url=entry.url,
        encrypted_password=encrypt_secret(entry.password),
        user_id=current_user.id,
        category_id=entry.category_id,
    )
    return to_response(password)


@router.get("/{password_id}/reveal", response_model=PasswordRevealResponse)
def reveal_password(
    password_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    password = get_password(db, password_id, current_user.id)
    if not password:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Password not found")

    try:
        return {"password": decrypt_secret(password.Password)}
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored vault secret cannot be decrypted",
        ) from error


@router.get("/{password_id}", response_model=PasswordResponse)
def get_password_entry(
    password_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    password = get_password(db, password_id, current_user.id)
    if not password:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Password not found")

    return to_response(password)


@router.put("/{password_id}", response_model=PasswordResponse)
def update_password(
    password_id: int,
    entry: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    password = get_password(db, password_id, current_user.id)
    if not password:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Password not found")

    updates = entry.model_dump(exclude_unset=True)
    if "category_id" in updates and not get_category(db, updates["category_id"], current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if "password" in updates:
        password.Password = encrypt_secret(updates.pop("password"))

    for field, value in updates.items():
        setattr(password, field, value)

    db.commit()
    db.refresh(password)
    return to_response(password)


@router.delete("/{password_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_password(
    password_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    password = get_password(db, password_id, current_user.id)
    if not password:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Password not found")

    delete_password(db, password)