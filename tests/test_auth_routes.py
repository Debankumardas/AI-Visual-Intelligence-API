import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.security import create_access_token
from app.database.connection import Base, get_db
from app.main import app
from app.models.user import User


TEST_DATABASE_URL = "sqlite://"


engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


TestingSessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture()
def client():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()

        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(client):
    """
    Provide a database session connected to the same
    temporary test database used by the FastAPI client.
    """
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


def test_register_user_successfully(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Auth Test User",
            "email": "auth-test@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Auth Test User"
    assert data["email"] == "auth-test@example.com"
    assert data["role"] == "Analyst"
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data

    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email_is_rejected(client):
    user_data = {
        "name": "Auth Test User",
        "email": "duplicate@example.com",
        "password": "TestPassword123!",
    }

    first_response = client.post(
        "/api/v1/auth/register",
        json=user_data,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/auth/register",
        json=user_data,
    )

    assert second_response.status_code == 409
    assert (
        second_response.json()["detail"]
        == "An account with this email already exists."
    )


def test_login_successfully(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Login Test User",
            "email": "login-test@example.com",
            "password": "TestPassword123!",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "login-test@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["access_token"]


def test_login_with_invalid_password_is_rejected(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Login Test User",
            "email": "invalid-password@example.com",
            "password": "TestPassword123!",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "invalid-password@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_login_with_unknown_email_is_rejected(client):
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "unknown@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_get_current_user_successfully(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Me Test User",
            "email": "me-test@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "me-test@example.com",
            "password": "TestPassword123!",
        },
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Me Test User"
    assert data["email"] == "me-test@example.com"
    assert data["role"] == "Analyst"
    assert data["is_active"] is True
    assert "password" not in data
    assert "password_hash" not in data


def test_get_current_user_requires_authentication(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_get_preferences_returns_defaults(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Preferences Test User",
            "email": "preferences@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "preferences@example.com",
            "password": "TestPassword123!",
        },
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/preferences",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["dashboard_enabled"] is True
    assert data["image_analysis_enabled"] is True
    assert data["video_analysis_enabled"] is True
    assert data["analysis_completed_notifications"] is True
    assert data["system_notifications"] is True


def test_update_preferences_successfully(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Preferences Update User",
            "email": "preferences-update@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "preferences-update@example.com",
            "password": "TestPassword123!",
        },
    )

    token = login_response.json()["access_token"]

    response = client.patch(
        "/api/v1/auth/preferences",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "dashboard_enabled": False,
            "image_analysis_enabled": False,
            "system_notifications": False,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["dashboard_enabled"] is False
    assert data["image_analysis_enabled"] is False
    assert data["video_analysis_enabled"] is True
    assert data["analysis_completed_notifications"] is True
    assert data["system_notifications"] is False


def test_updated_preferences_are_persisted(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Preferences Persistence User",
            "email": "preferences-persistence@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "preferences-persistence@example.com",
            "password": "TestPassword123!",
        },
    )

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}",
    }

    client.patch(
        "/api/v1/auth/preferences",
        headers=headers,
        json={
            "dashboard_enabled": False,
            "video_analysis_enabled": False,
        },
    )

    response = client.get(
        "/api/v1/auth/preferences",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["dashboard_enabled"] is False
    assert data["video_analysis_enabled"] is False
    assert data["image_analysis_enabled"] is True


def test_preferences_require_authentication(client):
    get_response = client.get(
        "/api/v1/auth/preferences"
    )

    patch_response = client.patch(
        "/api/v1/auth/preferences",
        json={
            "dashboard_enabled": False,
        },
    )

    assert get_response.status_code == 401
    assert patch_response.status_code == 401


def test_login_inactive_user_is_rejected(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Inactive User",
            "email": "inactive@example.com",
            "password": "TestPassword123!",
        },
    )

    user = db_session.query(User).filter(
        User.email == "inactive@example.com"
    ).first()

    assert user is not None

    user.is_active = False
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "inactive@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "This account is inactive."


def test_token_without_subject_is_rejected(client):
    token = create_access_token(
        data={
            "email": "test@example.com",
            "role": "Analyst",
        }
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid authentication token."


def test_token_with_invalid_subject_is_rejected(client):
    token = create_access_token(
        data={
            "sub": "not-an-integer",
            "email": "test@example.com",
            "role": "Analyst",
        }
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid authentication token."


def test_token_for_unknown_user_is_rejected(client):
    token = create_access_token(
        data={
            "sub": "999999",
            "email": "unknown@example.com",
            "role": "Analyst",
        }
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "User account not found."


def test_token_for_inactive_user_is_rejected(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Inactive Token User",
            "email": "inactive-token@example.com",
            "password": "TestPassword123!",
        },
    )

    user = db_session.query(User).filter(
        User.email == "inactive-token@example.com"
    ).first()

    assert user is not None

    user.is_active = False
    db_session.commit()

    user_id = user.id

    token = create_access_token(
        data={
            "sub": str(user_id),
            "email": "inactive-token@example.com",
            "role": "Analyst",
        }
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "This account is inactive."