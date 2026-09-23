from unittest.mock import MagicMock

import pytest

from app.services.video_service import video_service


def test_get_metadata_success(monkeypatch):
    mock_capture = MagicMock()

    mock_capture.isOpened.return_value = True

    mock_capture.get.side_effect = [
        300,   # frame count
        30.0,  # FPS
        1920,  # width
        1080,  # height
    ]

    monkeypatch.setattr(
        "app.services.video_service.cv2.VideoCapture",
        lambda path: mock_capture,
    )

    result = video_service.get_metadata("test.mp4")

    assert result == {
        "frame_count": 300,
        "fps": 30.0,
        "width": 1920,
        "height": 1080,
        "duration": 10.0,
    }

    mock_capture.release.assert_called_once()


def test_get_metadata_invalid_video(monkeypatch):
    mock_capture = MagicMock()

    mock_capture.isOpened.return_value = False

    monkeypatch.setattr(
        "app.services.video_service.cv2.VideoCapture",
        lambda path: mock_capture,
    )

    with pytest.raises(
        ValueError,
        match="Unable to open video file",
    ):
        video_service.get_metadata("invalid.mp4")

    mock_capture.release.assert_not_called()


def test_get_metadata_zero_fps(monkeypatch):
    mock_capture = MagicMock()

    mock_capture.isOpened.return_value = True

    mock_capture.get.side_effect = [
        100,   # frame count
        0.0,   # FPS
        640,   # width
        480,   # height
    ]

    monkeypatch.setattr(
        "app.services.video_service.cv2.VideoCapture",
        lambda path: mock_capture,
    )

    result = video_service.get_metadata("test.mp4")

    assert result == {
        "frame_count": 100,
        "fps": 0.0,
        "width": 640,
        "height": 480,
        "duration": 0.0,
    }

    mock_capture.release.assert_called_once()
