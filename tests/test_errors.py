from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_invalid_image_returns_standard_error():
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.txt",
                b"this is not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400

    data = response.json()

    assert data["error"] == "Invalid Image"
    assert data["status_code"] == 400
    assert "detail" in data


def test_invalid_image_returns_request_id():
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.txt",
                b"this is not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Request-ID"]


def test_oversized_image_returns_error():
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "large.jpg",
                b"x" * (10 * 1024 * 1024 + 1),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 413

    data = response.json()

    assert data["error"] == "Image Too Large"
    assert data["status_code"] == 413
    assert "detail" in data


def test_unsupported_content_type_returns_error():
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.pdf",
                b"fake pdf content",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 400

    data = response.json()

    assert data["error"] == "Invalid Image"
    assert data["status_code"] == 400
    assert "detail" in data