from datetime import timedelta

from fastapi.testclient import TestClient

from app.auth.security import create_access_token
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