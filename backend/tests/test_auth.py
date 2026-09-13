import time

import jwt
from app.dependencies import CSRF_COOKIE, CSRF_HEADER, issue_csrf_token

from app.dependencies import get_current_user
from sqlalchemy.orm import Session
from app.models.users import Users


def test_expired_jwt_is_rejected(database):
    _, user_id, _, _ = database
    token = jwt.encode(
        {"sub": str(user_id), "exp": int(time.time()) - 1},
        "test-jwt-secret-with-32-bytes-minimum",
        algorithm="HS256",
    )

    try:
        get_current_user(token=token, db=None)
    except Exception as error:
        assert getattr(error, "status_code", None) == 401
    else:
        raise AssertionError("Expired JWT was accepted")

def test_old_session_version_jwt_is_rejected(database):
    engine, user_id, _, _ = database
    token = jwt.encode(
        {"sub": str(user_id), "sv": 0, "exp": int(time.time()) + 60},
        "test-jwt-secret-with-32-bytes-minimum",
        algorithm="HS256",
    )

    with Session(engine) as session:
        user = session.get(Users, user_id)
        user.session_version = 1
        session.commit()
        try:
            get_current_user(token=token, db=session)
        except Exception as error:
            assert getattr(error, "status_code", None) == 401
        else:
            raise AssertionError("Revoked session token was accepted")


def test_state_changing_request_requires_csrf_token(client):
    client.cookies.clear()
    client.headers.pop(CSRF_HEADER, None)

    response = client.post("/categories", json={"name": "Blocked"})

    assert response.status_code == 403
    assert response.json()["detail"] == "CSRF validation failed"


def test_state_changing_request_rejects_forged_csrf_token(client):
    forged_token = issue_csrf_token() + "forged"
    client.cookies.set(CSRF_COOKIE, forged_token)
    client.headers[CSRF_HEADER] = forged_token

    response = client.post("/categories", json={"name": "Blocked"})

    assert response.status_code == 403
    assert response.json()["detail"] == "CSRF validation failed"


def test_state_changing_request_accepts_matching_signed_csrf_token(client):
    response = client.post("/categories", json={"name": "Allowed"})

    assert response.status_code == 201
    assert response.json()["name"] == "Allowed"