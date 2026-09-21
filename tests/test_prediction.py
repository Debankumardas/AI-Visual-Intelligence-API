from io import BytesIO
from unittest.mock import patch

from PIL import Image
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def create_test_image():
    image = Image.new(
        "RGB",
        (100, 100),
        "white",
    )

    image_buffer = BytesIO()

    image.save(
        image_buffer,
        format="JPEG",
    )

    image_buffer.seek(0)

    return image_buffer


@patch("app.api.routes.prediction.predict_image")
def test_predict_returns_predictions(mock_predict):
    mock_predict.return_value = {
        "predictions": [
            {
                "label": "golden retriever",
                "confidence": 0.91,
            },
            {
                "label": "Labrador retriever",
                "confidence": 0.05,
            },
        ],
        "inference_time_ms": 18.5,
    }

    image = create_test_image()

    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.jpg",
                image,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == "test.jpg"
    assert data["content_type"] == "image/jpeg"
    assert len(data["predictions"]) == 2

    assert data["predictions"][0]["label"] == "golden retriever"
    assert data["predictions"][0]["confidence"] == 0.91

    assert data["predictions"][1]["label"] == "Labrador retriever"
    assert data["predictions"][1]["confidence"] == 0.05

    assert data["inference_time_ms"] == 18.5

    mock_predict.assert_called_once()


@patch("app.api.routes.prediction.predict_image")
def test_predict_passes_top_k_five(mock_predict):
    mock_predict.return_value = {
        "predictions": [],
        "inference_time_ms": 10.0,
    }

    image = create_test_image()

    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.jpg",
                image,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200

    mock_predict.assert_called_once()

    _, kwargs = mock_predict.call_args

    assert kwargs["top_k"] == 5


@patch("app.api.routes.prediction.predict_image")
def test_predict_returns_inference_error(mock_predict):
    mock_predict.side_effect = RuntimeError(
        "Model inference failed"
    )

    image = create_test_image()

    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "test.jpg",
                image,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 500

    data = response.json()

    assert data["error"] == "Inference Error"
    assert data["status_code"] == 500
    assert "Model inference failed" in data["detail"]

    assert "X-Request-ID" in response.headers
    assert response.headers["X-Request-ID"]


def test_predict_rejects_invalid_image():
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "invalid.txt",
                b"not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400

    data = response.json()

    assert data["error"] == "Invalid Image"
    assert data["status_code"] == 400
    assert "detail" in data

    assert "X-Request-ID" in response.headers
    assert response.headers["X-Request-ID"]