from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


client = TestClient(app)


def create_test_image():
    image = Image.new(
        "RGB",
        (100, 100),
        "white",
    )

    buffer = BytesIO()

    image.save(
        buffer,
        format="JPEG",
    )

    buffer.seek(0)

    return buffer


def test_analyze_returns_combined_results(monkeypatch):
    def mock_predict_image(image, top_k=5):
        return {
            "predictions": [
                {
                    "label": "cat",
                    "confidence": 0.95,
                }
            ],
            "inference_time_ms": 10.5,
        }

    def mock_detect(image):
        return {
            "detections": [
                {
                    "label": "person",
                    "confidence": 0.91,
                    "box": {
                        "x1": 10.0,
                        "y1": 20.0,
                        "x2": 80.0,
                        "y2": 90.0,
                    },
                }
            ],
            "inference_time_ms": 20.5,
        }

    monkeypatch.setattr(
        "app.api.routes.analysis.predict_image",
        mock_predict_image,
    )

    monkeypatch.setattr(
        "app.api.routes.analysis.detection_service.detect",
        mock_detect,
    )

    response = client.post(
        "/api/v1/analyze",
        files={
            "file": (
                "test.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == "test.jpg"
    assert data["content_type"] == "image/jpeg"

    assert len(data["predictions"]) == 1
    assert data["predictions"][0]["label"] == "cat"

    assert len(data["detections"]) == 1
    assert data["detections"][0]["label"] == "person"

    assert data["classification_inference_time_ms"] == 10.5
    assert data["detection_inference_time_ms"] == 20.5


def test_analyze_passes_top_k_five(monkeypatch):
    captured = {}

    def mock_predict_image(image, top_k=5):
        captured["top_k"] = top_k

        return {
            "predictions": [],
            "inference_time_ms": 5.0,
        }

    def mock_detect(image):
        return {
            "detections": [],
            "inference_time_ms": 6.0,
        }

    monkeypatch.setattr(
        "app.api.routes.analysis.predict_image",
        mock_predict_image,
    )

    monkeypatch.setattr(
        "app.api.routes.analysis.detection_service.detect",
        mock_detect,
    )

    response = client.post(
        "/api/v1/analyze",
        files={
            "file": (
                "test.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200
    assert captured["top_k"] == 5


def test_analyze_returns_classification_error(monkeypatch):
    def mock_predict_image(image, top_k=5):
        raise RuntimeError("classification failed")

    monkeypatch.setattr(
        "app.api.routes.analysis.predict_image",
        mock_predict_image,
    )

    response = client.post(
        "/api/v1/analyze",
        files={
            "file": (
                "test.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 500

    data = response.json()

    assert data["error"] == "Inference Error"
    assert (
        "Image classification failed during analysis"
        in data["detail"]
    )


def test_analyze_returns_detection_error(monkeypatch):
    def mock_predict_image(image, top_k=5):
        return {
            "predictions": [],
            "inference_time_ms": 10.0,
        }

    def mock_detect(image):
        raise RuntimeError("detection failed")

    monkeypatch.setattr(
        "app.api.routes.analysis.predict_image",
        mock_predict_image,
    )

    monkeypatch.setattr(
        "app.api.routes.analysis.detection_service.detect",
        mock_detect,
    )

    response = client.post(
        "/api/v1/analyze",
        files={
            "file": (
                "test.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 500

    data = response.json()

    assert data["error"] == "Inference Error"
    assert (
        "Object detection failed during analysis"
        in data["detail"]
    )


def test_analyze_annotated_returns_jpeg(monkeypatch):
    def mock_detect_and_annotate(image):
        return Image.new(
            "RGB",
            (100, 100),
            "white",
        )

    monkeypatch.setattr(
        "app.api.routes.analysis.detection_service.detect_and_annotate",
        mock_detect_and_annotate,
    )

    response = client.post(
        "/api/v1/analyze/annotated",
        files={
            "file": (
                "test.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert (
        'filename="annotated_test.jpg"'
        in response.headers["content-disposition"]
    )


def test_analyze_rejects_invalid_image():
    response = client.post(
        "/api/v1/analyze",
        files={
            "file": (
                "test.txt",
                b"not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400


def test_analyze_handles_classification_error(monkeypatch):
    def mock_predict_image(image, top_k=5):
        raise RuntimeError("classification failed")

    monkeypatch.setattr(
        "app.api.routes.analysis.predict_image",
        mock_predict_image,
    )

    response = client.post(
        "/api/v1/analyze",
        files={
            "file": (
                "test.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 500

    data = response.json()

    assert data["error"] == "Inference Error"
    assert (
        "Image classification failed during analysis"
        in data["detail"]
    )


def test_analyze_handles_detection_error(monkeypatch):
    def mock_predict_image(image, top_k=5):
        return {
            "predictions": [],
            "inference_time_ms": 10.0,
        }

    def mock_detect(image):
        raise RuntimeError("detection failed")

    monkeypatch.setattr(
        "app.api.routes.analysis.predict_image",
        mock_predict_image,
    )

    monkeypatch.setattr(
        "app.api.routes.analysis.detection_service.detect",
        mock_detect,
    )

    response = client.post(
        "/api/v1/analyze",
        files={
            "file": (
                "test.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 500

    data = response.json()

    assert data["error"] == "Inference Error"
    assert (
        "Object detection failed during analysis"
        in data["detail"]
    )


def test_analyze_annotated_handles_error(monkeypatch):
    def mock_detect_and_annotate(image):
        raise RuntimeError("annotation failed")

    monkeypatch.setattr(
        "app.api.routes.analysis.detection_service.detect_and_annotate",
        mock_detect_and_annotate,
    )

    response = client.post(
        "/api/v1/analyze/annotated",
        files={
            "file": (
                "test.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 500

    data = response.json()

    assert data["error"] == "Inference Error"
    assert (
        "Annotated image generation failed"
        in data["detail"]
    )
def test_analyze_annotated_handles_filename_without_extension(
    monkeypatch,
):
    def mock_detect_and_annotate(image):
        return Image.new(
            "RGB",
            (100, 100),
            "white",
        )

    monkeypatch.setattr(
        "app.api.routes.analysis.detection_service.detect_and_annotate",
        mock_detect_and_annotate,
    )

    response = client.post(
        "/api/v1/analyze/annotated",
        files={
            "file": (
                "testimage",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200
    assert (
        'filename="annotated_testimage.jpg"'
        in response.headers["content-disposition"]
    )