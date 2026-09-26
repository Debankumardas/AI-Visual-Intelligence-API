from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.main import app
from app.api.routes import video as video_route


client = TestClient(app)


def test_video_metadata_success(monkeypatch):
    monkeypatch.setattr(
        video_route.video_service,
        "get_metadata",
        lambda path: {
            "frame_count": 100,
            "fps": 25.0,
            "width": 640,
            "height": 480,
            "duration": 4.0,
        },
    )

    response = client.post(
        "/api/v1/video/metadata",
        files={
            "file": (
                "test.mp4",
                b"fake video",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == "test.mp4"
    assert data["content_type"] == "video/mp4"
    assert data["metadata"]["frame_count"] == 100
    assert data["metadata"]["fps"] == 25.0
    assert data["metadata"]["width"] == 640
    assert data["metadata"]["height"] == 480
    assert data["metadata"]["duration"] == 4.0


def test_video_metadata_invalid_video(monkeypatch):
    def fake_get_metadata(path):
        raise ValueError("Unable to open video file")

    monkeypatch.setattr(
        video_route.video_service,
        "get_metadata",
        fake_get_metadata,
    )

    response = client.post(
        "/api/v1/video/metadata",
        files={
            "file": (
                "broken.mp4",
                b"fake video",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"


def test_video_metadata_unsupported_format():
    response = client.post(
        "/api/v1/video/metadata",
        files={
            "file": (
                "test.txt",
                b"not a video",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"


def test_video_metadata_empty_file():
    response = client.post(
        "/api/v1/video/metadata",
        files={
            "file": (
                "empty.mp4",
                b"",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"


def test_annotate_video_success(monkeypatch):
    def fake_generate(video_path, output_path):
        with open(output_path, "wb") as file:
            file.write(b"annotated video")

    monkeypatch.setattr(
        video_route.video_processing_service,
        "generate_annotated_video",
        fake_generate,
    )

    response = client.post(
        "/api/v1/video/annotate",
        files={
            "file": (
                "input.mp4",
                b"fake video data",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "video/mp4"
    assert response.content == b"annotated video"
    assert response.headers["content-disposition"] == (
        'attachment; filename="annotated_input.mp4"'
    )


def test_annotate_video_processing_failure(monkeypatch):
    def fake_generate(video_path, output_path):
        raise ValueError("Processing failed")

    monkeypatch.setattr(
        video_route.video_processing_service,
        "generate_annotated_video",
        fake_generate,
    )

    response = client.post(
        "/api/v1/video/annotate",
        files={
            "file": (
                "input.mp4",
                b"fake video data",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"


def test_annotate_video_unexpected_exception_cleanup(monkeypatch):
    def fake_generate(video_path, output_path):
        with open(output_path, "wb") as file:
            file.write(b"partial output")
        raise RuntimeError("Unexpected processing error")

    monkeypatch.setattr(
        video_route.video_processing_service,
        "generate_annotated_video",
        fake_generate,
    )

    try:
        client.post(
            "/api/v1/video/annotate",
            files={
                "file": (
                    "input.mp4",
                    b"fake video data",
                    "video/mp4",
                )
            },
        )
    except RuntimeError as exc:
        assert str(exc) == "Unexpected processing error"
    else:
        raise AssertionError("Expected RuntimeError")


def test_annotate_video_output_missing(monkeypatch):
    monkeypatch.setattr(
        video_route.video_processing_service,
        "generate_annotated_video",
        MagicMock(),
    )

    response = client.post(
        "/api/v1/video/annotate",
        files={
            "file": (
                "test.mp4",
                b"fake video",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"


def test_annotate_video_unsupported_format():
    response = client.post(
        "/api/v1/video/annotate",
        files={
            "file": (
                "test.txt",
                b"not a video",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"


def test_annotate_video_empty_file():
    response = client.post(
        "/api/v1/video/annotate",
        files={
            "file": (
                "empty.mp4",
                b"",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"


def test_video_analyze_success(monkeypatch):
    monkeypatch.setattr(
        video_route.video_processing_service,
        "analyze_video",
        lambda video_path: {
            "frames_processed": 100,
            "processing_time_seconds": 4.0,
            "effective_fps": 25.0,
            "total_inference_time_ms": 2500.0,
            "average_inference_time_ms": 25.0,
            "min_inference_time_ms": 10.0,
            "max_inference_time_ms": 40.0,
            "total_detections": 150,
            "max_detections_per_frame": 4,
            "average_detections_per_frame": 1.5,
            "class_detection_counts": {
                "person": 100,
                "car": 50,
            },
            "max_detections_by_class": {
                "person": 3,
                "car": 2,
            },
            "average_detections_by_class": {
                "person": 1.0,
                "car": 0.5,
            },
            "total_track_observations": 120,
            "unique_track_ids": 20,
            "max_tracks_per_frame": 3,
            "average_tracks_per_frame": 1.2,
        },
    )

    response = client.post(
        "/api/v1/video/analyze",
        files={
            "file": (
                "test.mp4",
                b"fake video",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == "test.mp4"
    assert data["content_type"] == "video/mp4"

    assert data["frames_processed"] == 100
    assert data["processing_time_seconds"] == 4.0
    assert data["effective_fps"] == 25.0

    assert data["total_inference_time_ms"] == 2500.0
    assert data["average_inference_time_ms"] == 25.0
    assert data["min_inference_time_ms"] == 10.0
    assert data["max_inference_time_ms"] == 40.0

    assert data["total_detections"] == 150
    assert data["max_detections_per_frame"] == 4
    assert data["average_detections_per_frame"] == 1.5

    assert data["class_detection_counts"] == {
        "person": 100,
        "car": 50,
    }

    assert data["max_detections_by_class"] == {
        "person": 3,
        "car": 2,
    }

    assert data["average_detections_by_class"] == {
        "person": 1.0,
        "car": 0.5,
    }

    assert data["total_track_observations"] == 120
    assert data["unique_track_ids"] == 20
    assert data["max_tracks_per_frame"] == 3
    assert data["average_tracks_per_frame"] == 1.2


def test_video_analyze_processing_failure(monkeypatch):
    def fake_analyze(video_path):
        raise ValueError("Processing failed")

    monkeypatch.setattr(
        video_route.video_processing_service,
        "analyze_video",
        fake_analyze,
    )

    response = client.post(
        "/api/v1/video/analyze",
        files={
            "file": (
                "input.mp4",
                b"fake video data",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"


def test_video_analyze_unsupported_format():
    response = client.post(
        "/api/v1/video/analyze",
        files={
            "file": (
                "test.txt",
                b"not a video",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"


def test_video_analyze_empty_file():
    response = client.post(
        "/api/v1/video/analyze",
        files={
            "file": (
                "empty.mp4",
                b"",
                "video/mp4",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid Video"