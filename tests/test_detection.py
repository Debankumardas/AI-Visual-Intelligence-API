from io import BytesIO

from app.main import app
from app.services.detection_service import detection_service
from fastapi.testclient import TestClient
from PIL import Image


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


# ============================================================
# OBJECT DETECTION
# ============================================================


def test_detect_returns_detections(monkeypatch):
    def mock_detect(image):
        return {
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
            "inference_time_ms": 15.5,
        }

    monkeypatch.setattr(
        "app.api.routes.detection.detection_service.detect",
        mock_detect,
    )

    response = client.post(
        "/api/v1/detect",
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

    assert len(data["detections"]) == 1
    assert data["detections"][0]["label"] == "person"
    assert data["detections"][0]["confidence"] == 0.95


def test_detect_annotated_returns_jpeg(monkeypatch):
    def mock_detect_and_annotate(image):
        return Image.new(
            "RGB",
            (100, 100),
            "white",
        )

    monkeypatch.setattr(
        "app.api.routes.detection.detection_service.detect_and_annotate",
        mock_detect_and_annotate,
    )

    response = client.post(
        "/api/v1/detect/annotated",
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
        'filename="test_annotated.jpg"'
        in response.headers["content-disposition"]
    )


def test_detect_returns_inference_error(monkeypatch):
    def mock_detect(image):
        raise RuntimeError("detection failed")

    monkeypatch.setattr(
        "app.api.routes.detection.detection_service.detect",
        mock_detect,
    )

    response = client.post(
        "/api/v1/detect",
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
    assert "Object detection failed" in data["detail"]


def test_detect_rejects_invalid_image():
    response = client.post(
        "/api/v1/detect",
        files={
            "file": (
                "test.txt",
                b"not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400


def test_detect_handles_detection_error(monkeypatch):
    def mock_detect(image):
        raise RuntimeError("detection failed")

    monkeypatch.setattr(
        "app.api.routes.detection.detection_service.detect",
        mock_detect,
    )

    response = client.post(
        "/api/v1/detect",
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
    assert "Object detection failed" in data["detail"]


def test_detect_annotated_handles_error(monkeypatch):
    def mock_detect_and_annotate(image):
        raise RuntimeError("annotation failed")

    monkeypatch.setattr(
        "app.api.routes.detection.detection_service.detect_and_annotate",
        mock_detect_and_annotate,
    )

    response = client.post(
        "/api/v1/detect/annotated",
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
        "Annotated object detection failed"
        in data["detail"]
    )


def test_detect_annotated_handles_filename_without_extension(
    monkeypatch,
):
    def mock_detect_and_annotate(image):
        return Image.new(
            "RGB",
            (100, 100),
            "white",
        )

    monkeypatch.setattr(
        "app.api.routes.detection.detection_service.detect_and_annotate",
        mock_detect_and_annotate,
    )

    response = client.post(
        "/api/v1/detect/annotated",
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
        'filename="testimage_annotated.jpg"'
        in response.headers["content-disposition"]
    )


# ============================================================
# OBJECT COUNTING
# ============================================================


def test_count_returns_object_counts(monkeypatch):
    def mock_count_objects(image):
        return {
            "total_objects": 3,
            "counts": [
                {
                    "label": "car",
                    "count": 1,
                },
                {
                    "label": "person",
                    "count": 2,
                },
            ],
        }

    monkeypatch.setattr(
        "app.api.routes.detection.detection_service.count_objects",
        mock_count_objects,
    )

    response = client.post(
        "/api/v1/detect/count",
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
    assert data["total_objects"] == 3

    assert data["counts"] == [
        {
            "label": "car",
            "count": 1,
        },
        {
            "label": "person",
            "count": 2,
        },
    ]


def test_count_handles_detection_error(monkeypatch):
    def mock_count_objects(image):
        raise RuntimeError("counting failed")

    monkeypatch.setattr(
        "app.api.routes.detection.detection_service.count_objects",
        mock_count_objects,
    )

    response = client.post(
        "/api/v1/detect/count",
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
    assert "Object counting failed" in data["detail"]


# ============================================================
# OBJECT TRACKING
# ============================================================


def test_tracking_success(monkeypatch):
    def fake_track(image):
        return {
            "tracks": [
                {
                    "track_id": 1,
                    "label": "person",
                    "confidence": 0.92,
                    "box": {
                        "x1": 10.0,
                        "y1": 20.0,
                        "x2": 100.0,
                        "y2": 200.0,
                    },
                }
            ]
        }

    monkeypatch.setattr(
        detection_service,
        "track",
        fake_track,
    )

    response = client.post(
        "/api/v1/detect/track",
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

    assert data["tracks"][0]["track_id"] == 1
    assert data["tracks"][0]["label"] == "person"


def test_tracking_error(monkeypatch):
    def fake_track(image):
        raise RuntimeError("Tracking failed")

    monkeypatch.setattr(
        detection_service,
        "track",
        fake_track,
    )

    response = client.post(
        "/api/v1/detect/track",
        files={
            "file": (
                "test.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 500


# ============================================================
# IMAGE SEGMENTATION
# ============================================================


def test_segmentation_success(monkeypatch):
    def mock_segment(image):
        return {
            "segmentations": [
                {
                    "label": "person",
                    "confidence": 0.95,
                    "box": {
                        "x1": 10.0,
                        "y1": 20.0,
                        "x2": 100.0,
                        "y2": 200.0,
                    },
                    "mask": [
                        [10.0, 20.0],
                        [100.0, 20.0],
                        [100.0, 200.0],
                        [10.0, 200.0],
                    ],
                }
            ]
        }

    monkeypatch.setattr(
        detection_service,
        "segment",
        mock_segment,
    )

    response = client.post(
        "/api/v1/detect/segment",
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

    assert len(data["segmentations"]) == 1

    segmentation = data["segmentations"][0]

    assert segmentation["label"] == "person"
    assert segmentation["confidence"] == 0.95

    assert segmentation["box"] == {
        "x1": 10.0,
        "y1": 20.0,
        "x2": 100.0,
        "y2": 200.0,
    }

    assert segmentation["mask"] == [
        [10.0, 20.0],
        [100.0, 20.0],
        [100.0, 200.0],
        [10.0, 200.0],
    ]


def test_segmentation_error(monkeypatch):
    def mock_segment(image):
        raise RuntimeError("Segmentation failed")

    monkeypatch.setattr(
        detection_service,
        "segment",
        mock_segment,
    )

    response = client.post(
        "/api/v1/detect/segment",
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
    assert "Image segmentation failed" in data["detail"]