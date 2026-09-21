from io import BytesIO
from unittest.mock import patch

from PIL import Image
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def create_test_image():
    image = Image.new("RGB", (100, 100), "white")
    image_buffer = BytesIO()
    image.save(image_buffer, format="JPEG")
    image_buffer.seek(0)
    return image_buffer


@patch("app.api.routes.detection.detection_service.detect")
def test_detect_returns_detections(mock_detect):
    mock_detect.return_value = {
        "detections": [
            {
                "label": "person",
                "confidence": 0.95,
                "box": {
                    "x1": 10.0,
                    "y1": 20.0,
                    "x2": 80.0,
                    "y2": 90.0,
                },
            }
        ],
        "inference_time_ms": 25.5,
    }

    image = create_test_image()

    response = client.post(
        "/api/v1/detect",
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
    assert len(data["detections"]) == 1

    detection = data["detections"][0]

    assert detection["label"] == "person"
    assert detection["confidence"] == 0.95
    assert detection["box"]["x1"] == 10.0
    assert detection["box"]["y1"] == 20.0
    assert detection["box"]["x2"] == 80.0
    assert detection["box"]["y2"] == 90.0

    mock_detect.assert_called_once()


@patch(
    "app.api.routes.detection.detection_service.detect_and_annotate"
)
def test_detect_annotated_returns_jpeg(mock_detect):
    annotated_image = Image.new(
        "RGB",
        (100, 100),
        "white",
    )

    mock_detect.return_value = annotated_image

    image = create_test_image()

    response = client.post(
        "/api/v1/detect/annotated",
        files={
            "file": (
                "test.jpg",
                image,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert (
        "test_annotated.jpg"
        in response.headers["content-disposition"]
    )

    assert response.content
    assert response.content.startswith(b"\xff\xd8")

    mock_detect.assert_called_once()

@patch("app.api.routes.detection.detection_service.detect")
def test_detect_returns_inference_error(mock_detect):
    mock_detect.side_effect = RuntimeError(
        "Model inference failed"
    )

    image = create_test_image()

    response = client.post(
        "/api/v1/detect",
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


def test_detect_rejects_invalid_image():
    response = client.post(
        "/api/v1/detect",
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