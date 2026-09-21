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

def test_empty_file_returns_error():
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "empty.jpg",
                b"",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 400

    data = response.json()

    assert data["error"] == "Invalid Image"
    assert data["status_code"] == 400
    assert data["detail"] == "Uploaded image is empty."


def test_corrupted_image_returns_error():
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "corrupted.jpg",
                b"this is not actually a JPEG image",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 400

    data = response.json()

    assert data["error"] == "Invalid Image"
    assert data["status_code"] == 400
    assert data["detail"] == "Invalid or corrupted image file."


def test_unsupported_image_format_returns_error():
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "image.gif",
                b"fake gif content",
                "image/gif",
            )
        },
    )

    assert response.status_code == 400

    data = response.json()

    assert data["error"] == "Invalid Image"
    assert data["status_code"] == 400
    assert data["detail"] == (
        "Unsupported image format. Use JPEG, PNG, or WebP."
    )