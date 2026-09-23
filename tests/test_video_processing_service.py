import numpy as np

from unittest.mock import patch

from app.services.video_processing_service import (
    video_processing_service,
)


def test_process_frames_success():
    frames = [
        (0, np.zeros((10, 10, 3), dtype=np.uint8)),
        (1, np.zeros((10, 10, 3), dtype=np.uint8)),
        (2, np.zeros((10, 10, 3), dtype=np.uint8)),
    ]

    detection_result = {
        "detections": [
            {
                "label": "person",
                "confidence": 0.95,
                "box": {
                    "x1": 10.0,
                    "y1": 20.0,
                    "x2": 100.0,
                    "y2": 200.0,
                },
            }
        ],
        "inference_time_ms": 12.5,
    }

    with patch(
        "app.services.video_processing_service.video_service.read_frames",
        return_value=iter(frames),
    ), patch(
        "app.services.video_processing_service.detection_service.detect",
        return_value=detection_result,
    ) as detect_mock:

        results = list(
            video_processing_service.process_frames(
                "test.mp4"
            )
        )

    assert results == [
        {
            "frame_index": 0,
            "detections": detection_result["detections"],
            "inference_time_ms": 12.5,
        },
        {
            "frame_index": 1,
            "detections": detection_result["detections"],
            "inference_time_ms": 12.5,
        },
        {
            "frame_index": 2,
            "detections": detection_result["detections"],
            "inference_time_ms": 12.5,
        },
    ]

    assert detect_mock.call_count == 3


def test_process_frames_empty_video():
    with patch(
        "app.services.video_processing_service.video_service.read_frames",
        return_value=iter([]),
    ), patch(
        "app.services.video_processing_service.detection_service.detect"
    ) as detect_mock:

        results = list(
            video_processing_service.process_frames(
                "empty.mp4"
            )
        )

    assert results == []

    detect_mock.assert_not_called()


def test_process_frames_passes_stride():
    with patch(
        "app.services.video_processing_service.video_service.read_frames",
        return_value=iter([]),
    ) as read_frames_mock:

        list(
            video_processing_service.process_frames(
                "test.mp4",
                frame_stride=3,
            )
        )

    read_frames_mock.assert_called_once_with(
        "test.mp4",
        frame_stride=3,
    )