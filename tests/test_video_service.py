from unittest.mock import MagicMock

import pytest

from app.services.video_service import video_service


def test_get_metadata_success(monkeypatch):
    mock_capture = MagicMock()
    mock_capture.isOpened.return_value = True
    mock_capture.get.side_effect = [
        300,
        30.0,
        1920,
        1080,
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
        100,
        0.0,
        640,
        480,
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


def test_read_frames_success(monkeypatch):
    mock_capture = MagicMock()
    mock_capture.isOpened.return_value = True

    mock_capture.read.side_effect = [
        (True, "frame_1"),
        (True, "frame_2"),
        (False, None),
    ]

    monkeypatch.setattr(
        "app.services.video_service.cv2.VideoCapture",
        lambda path: mock_capture,
    )

    frames = list(
        video_service.read_frames("test.mp4")
    )

    assert frames == [
        (0, "frame_1"),
        (1, "frame_2"),
    ]

    mock_capture.release.assert_called_once()


def test_read_frames_with_stride(monkeypatch):
    mock_capture = MagicMock()
    mock_capture.isOpened.return_value = True

    mock_capture.read.side_effect = [
        (True, "frame_1"),
        (True, "frame_2"),
        (True, "frame_3"),
        (True, "frame_4"),
        (False, None),
    ]

    monkeypatch.setattr(
        "app.services.video_service.cv2.VideoCapture",
        lambda path: mock_capture,
    )

    frames = list(
        video_service.read_frames(
            "test.mp4",
            frame_stride=2,
        )
    )

    assert frames == [
        (0, "frame_1"),
        (2, "frame_3"),
    ]

    mock_capture.release.assert_called_once()


def test_read_frames_invalid_stride():
    with pytest.raises(
        ValueError,
        match="Frame stride must be at least 1",
    ):
        list(
            video_service.read_frames(
                "test.mp4",
                frame_stride=0,
            )
        )


def test_read_frames_invalid_video(monkeypatch):
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
        list(
            video_service.read_frames(
                "invalid.mp4"
            )
        )

    mock_capture.release.assert_not_called()