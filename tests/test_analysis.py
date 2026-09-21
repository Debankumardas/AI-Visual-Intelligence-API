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


@patch("app.api.routes.analysis.detection_service.detect")
@patch("app.api.routes.analysis.predict_image")
def test_analyze_returns_combined_results(
    mock_predict,
    mock_detect,
):
    mock_predict.return_value = {
        "predictions": [
            {
                "label": "golden retriever",
                "confidence": 0.91,
            }
        ],
        "inference_time_ms": 18.5,
    }

    mock_detect.return_value = {
        "detections": [
            {
                "label": "dog",
                "confidence": 0.94,
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
        "/api/v1/analyze",
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

    assert len(data["predictions"]) == 1
    assert data["predictions"][0]["label"] == "golden retriever"
    assert data["predictions"][0]["confidence"] == 0.91

    assert len(data["detections"]) == 1
    assert data["detections"][0]["label"] == "dog"
    assert data["detections"][0]["confidence"] == 0.94

    assert data["classification_inference_time_ms"] == 18.5
    assert data["detection_inference_time_ms"] == 25.5

    mock_predict.assert_called_once()
    mock_detect.assert_called_once()


@patch("app.api.routes.analysis.detection_service.detect")
@patch("app.api.routes.analysis.predict_image")
def test_analyze_passes_top_k_five(
    mock_predict,
    mock_detect,
):
    mock_predict.return_value = {
        "predictions": [],
        "inference_time_ms": 10.0,
    }

    mock_detect.return_value = {
        "detections": [],
        "inference_time_ms": 12.0,
    }

    image = create_test_image()

    response = client.post(
        "/api/v1/analyze",
        files={
            "file": (
                "test.jpg",
                image,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200

    _, kwargs = mock_predict.call_args

    assert kwargs["top_k"] == 5


@patch("app.api.routes.analysis.predict_image")
def test_analyze_returns_classification_error(
    mock_predict,
):
    mock_predict.side_effect = RuntimeError(
        "Classification model failed"
    )

    image = create_test_image()

    response = client.post(
        "/api/v1/analyze",
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
    assert "Classification model failed" in data["detail"]

    assert "X-Request-ID" in response.headers
    assert response.headers["X-Request-ID"]


@patch("app.api.routes.analysis.detection_service.detect")
@patch("app.api.routes.analysis.predict_image")
def test_analyze_returns_detection_error(
    mock_predict,
    mock_detect,
):
    mock_predict.return_value = {
        "predictions": [
            {
                "label": "dog",
                "confidence": 0.91,
            }
        ],
        "inference_time_ms": 15.0,
    }

    mock_detect.side_effect = RuntimeError(
        "Detection model failed"
    )

    image = create_test_image()

    response = client.post(
        "/api/v1/analyze",
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
    assert "Detection model failed" in data["detail"]

    assert "X-Request-ID" in response.headers
    assert response.headers["X-Request-ID"]


@patch(
    "app.api.routes.analysis.detection_service.detect_and_annotate"
)
def test_analyze_annotated_returns_jpeg(
    mock_annotate,
):
    annotated_image = Image.new(
        "RGB",
        (100, 100),
        "white",
    )

    mock_annotate.return_value = annotated_image

    image = create_test_image()

    response = client.post(
        "/api/v1/analyze/annotated",
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
        "annotated_test.jpg"
        in response.headers["content-disposition"]
    )

    assert response.content
    assert response.content.startswith(b"\xff\xd8")

    mock_annotate.assert_called_once()


def test_analyze_rejects_invalid_image():
    response = client.post(
        "/api/v1/analyze",
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