from unittest.mock import patch

from fastapi import UploadFile

from app.core.exceptions import (
    InvalidVideoError,
    VideoTooLargeError,
)
from app.main import app


def test_video_metadata_success():

    mock_metadata = {
        "frame_count": 300,
        "fps": 30.0,
        "width": 1920,
        "height": 1080,
        "duration": 10.0,
    }

    with patch(
        "app.api.routes.video.load_uploaded_video",
        return_value="fake_video.mp4",
    ), patch(
        "app.api.routes.video.video_service.get_metadata",
        return_value=mock_metadata,
    ), patch(
        "app.api.routes.video.os.path.exists",
        return_value=True,
    ), patch(
        "app.api.routes.video.os.remove",
    ) as remove_mock:

        from fastapi.testclient import TestClient

        client = TestClient(app)

        response = client.post(
            "/api/v1/video/metadata",
            files={
                "file": (
                    "test.mp4",
                    b"fake-video-data",
                    "video/mp4",
                )
            },
        )

    assert response.status_code == 200

    assert response.json() == {
        "filename": "test.mp4",
        "content_type": "video/mp4",
        "metadata": {
            "filename": "test.mp4",
            "content_type": "video/mp4",
            **mock_metadata,
        },
    }

    remove_mock.assert_called_once_with("fake_video.mp4")


def test_video_metadata_service_failure_cleanup():
    with patch(
        "app.api.routes.video.load_uploaded_video",
        return_value="fake_video.mp4",
    ), patch(
        "app.api.routes.video.video_service.get_metadata",
        side_effect=ValueError("Unable to open video file"),
    ), patch(
        "app.api.routes.video.os.path.exists",
        return_value=True,
    ), patch(
        "app.api.routes.video.os.remove",
    ) as remove_mock:

        from fastapi.testclient import TestClient

        client = TestClient(app)

        response = client.post(
            "/api/v1/video/metadata",
            files={
                "file": (
                    "broken.mp4",
                    b"fake-video-data",
                    "video/mp4",
                )
            },
        )

    assert response.status_code == 400

    remove_mock.assert_called_once_with("fake_video.mp4")


def test_video_metadata_invalid_format():
    with patch(
        "app.api.routes.video.load_uploaded_video",
        side_effect=InvalidVideoError(
            "Unsupported video format."
        ),
    ):
        from fastapi.testclient import TestClient

        client = TestClient(app)

        response = client.post(
            "/api/v1/video/metadata",
            files={
                "file": (
                    "test.txt",
                    b"fake-data",
                    "text/plain",
                )
            },
        )

    assert response.status_code == 400


def test_video_metadata_too_large():
    with patch(
        "app.api.routes.video.load_uploaded_video",
        side_effect=VideoTooLargeError(
            "Video file is too large."
        ),
    ):
        from fastapi.testclient import TestClient

        client = TestClient(app)

        response = client.post(
            "/api/v1/video/metadata",
            files={
                "file": (
                    "large.mp4",
                    b"fake-data",
                    "video/mp4",
                )
            },
        )

    assert response.status_code == 413