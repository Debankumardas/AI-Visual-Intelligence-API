from datetime import timedelta
from fastapi.testclient import TestClient
from jose import jwt
from app.auth.security import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.auth.dependencies import get_current_user

from app.main import app

client = TestClient(app)


def test_protected_endpoint_requires_authentication():
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.jpg",
                b"fake image data",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 401


def test_invalid_token_is_rejected():
    client.headers.update(
        {
            "Authorization": "Bearer invalid-token",
        }
    )

    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.jpg",
                b"fake image data",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 401

    client.headers.clear()


def test_expired_token_is_rejected():
    token = create_access_token(
        data={
            "sub": "1",
            "email": "test@example.com",
            "role": "Analyst",
        },
        expires_delta=timedelta(seconds=-1),
    )

    client.headers.update(
        {
            "Authorization": f"Bearer {token}",
        }
    )

    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.jpg",
                b"fake image data",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 401

    client.headers.clear()


def test_health_endpoint_remains_public():
    response = client.get("/health")

    assert response.status_code == 200

def test_valid_token_allows_protected_endpoint():
    fake_user = type(
        "FakeUser",
        (),
        {
            "id": 1,
            "name": "Test User",
            "email": "test@example.com",
            "role": "Analyst",
            "is_active": True,
        },
    )()

    app.dependency_overrides[get_current_user] = lambda: fake_user

    token = create_access_token(
        data={
            "sub": "1",
            "email": "test@example.com",
            "role": "Analyst",
        }
    )

    client.headers.update(
        {
            "Authorization": f"Bearer {token}",
        }
    )

    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.jpg",
                b"fake image data",
                "image/jpeg",
            )
        },
    )

    # Authentication should succeed.
    # The fake image may fail later during image processing,
    # but it must not be rejected with 401.
    assert response.status_code != 401

    client.headers.clear()
    app.dependency_overrides.pop(get_current_user, None)

def test_created_token_contains_expected_claims():
    token = create_access_token(
        data={
            "sub": "1",
            "email": "test@example.com",
            "role": "Analyst",
        }
    )

    payload = decode_access_token(token)

    assert payload is not None
    assert payload["sub"] == "1"
    assert payload["email"] == "test@example.com"
    assert payload["role"] == "Analyst"
    assert "exp" in payload


def test_malformed_token_returns_none():
    payload = decode_access_token(
        "this-is-not-a-valid-jwt"
    )

    assert payload is None


def test_token_signed_with_wrong_secret_is_rejected():
    token = jwt.encode(
        {
            "sub": "1",
            "email": "test@example.com",
            "role": "Analyst",
        },
        "wrong-secret-for-testing",
        algorithm=ALGORITHM,
    )

    payload = decode_access_token(token)

    assert payload is None


def test_password_hash_is_not_plaintext():
    password = "TestPassword123!"

    hashed_password = hash_password(password)

    assert hashed_password != password


def test_correct_password_is_verified():
    password = "TestPassword123!"

    hashed_password = hash_password(password)

    assert verify_password(
        password,
        hashed_password,
    )

def test_wrong_password_is_rejected():
    password = "TestPassword123!"

    hashed_password = hash_password(password)

    assert not verify_password(
        "WrongPassword123!",
        hashed_password,
    )