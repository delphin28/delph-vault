from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.categories import Category
from app.models.passwords import Passwords
from app.services.vault_crypto import decrypt_secret


def test_update_category_preserves_password_association(client, database):
    _, _, category_id, password_id = database

    response = client.put(f"/categories/{category_id}", json={"name": "Renamed"})

    assert response.status_code == 200
    assert response.json()["name"] == "Renamed"

    engine, _, _, _ = database
    with Session(engine) as session:
        password = session.get(Passwords, password_id)
        category = session.get(Category, category_id)
        assert password.category_id == category.id
        assert category.name == "Renamed"


def test_update_password_changes_metadata_and_secret(client, database):
    _, _, category_id, password_id = database

    response = client.put(
        f"/passwords/{password_id}",
        json={"name": "Updated", "url": "https://updated.example", "password": "new-secret", "category_id": category_id},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": password_id,
        "name": "Updated",
        "url": "https://updated.example",
        "category_id": category_id,
    }

    engine, _, _, _ = database
    with Session(engine) as session:
        password = session.get(Passwords, password_id)
        assert decrypt_secret(password.Password) == "new-secret"


def test_password_cannot_be_updated_through_another_users_category(client, database):
    _, _, _, password_id = database

    response = client.put(f"/passwords/{password_id}", json={"category_id": 999})

    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"