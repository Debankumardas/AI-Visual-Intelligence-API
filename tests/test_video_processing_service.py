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

def test_track_video_success():
    frames = [
        (0, np.zeros((10, 10, 3), dtype=np.uint8)),
        (1, np.zeros((10, 10, 3), dtype=np.uint8)),
    ]

    tracking_result = {
        "tracks": [
            {
                "track_id": 1,
                "label": "person",
                "confidence": 0.91,
                "box": {
                    "x1": 10.0,
                    "y1": 20.0,
                    "x2": 100.0,
                    "y2": 200.0,
                },
            }
        ],
        "inference_time_ms": 14.2,
    }

    with patch(
        "app.services.video_processing_service.video_service.read_frames",
        return_value=iter(frames),
    ), patch(
        "app.services.video_processing_service.detection_service.track",
        return_value=tracking_result,
    ) as track_mock:

        results = list(
            video_processing_service.track_video(
                "test.mp4"
            )
        )

    assert results == [
        {
            "frame_index": 0,
            "tracks": tracking_result["tracks"],
            "inference_time_ms": 14.2,
        },
        {
            "frame_index": 1,
            "tracks": tracking_result["tracks"],
            "inference_time_ms": 14.2,
        },
    ]

    assert track_mock.call_count == 2


def test_track_video_passes_stride():
    with patch(
        "app.services.video_processing_service.video_service.read_frames",
        return_value=iter([]),
    ) as read_frames_mock:

        list(
            video_processing_service.track_video(
                "test.mp4",
                frame_stride=3,
            )
        )

    read_frames_mock.assert_called_once_with(
        "test.mp4",
        frame_stride=3,
    )

def test_track_video_preserves_track_ids_across_frames():
    frames = [
        (0, np.zeros((10, 10, 3), dtype=np.uint8)),
        (1, np.zeros((10, 10, 3), dtype=np.uint8)),
        (2, np.zeros((10, 10, 3), dtype=np.uint8)),
    ]

    tracking_results = [
        {
            "tracks": [
                {
                    "track_id": 7,
                    "label": "person",
                    "confidence": 0.92,
                    "box": {
                        "x1": 10.0,
                        "y1": 20.0,
                        "x2": 100.0,
                        "y2": 200.0,
                    },
                }
            ],
            "inference_time_ms": 14.0,
        },
        {
            "tracks": [
                {
                    "track_id": 7,
                    "label": "person",
                    "confidence": 0.90,
                    "box": {
                        "x1": 12.0,
                        "y1": 22.0,
                        "x2": 102.0,
                        "y2": 202.0,
                    },
                }
            ],
            "inference_time_ms": 13.5,
        },
        {
            "tracks": [
                {
                    "track_id": 7,
                    "label": "person",
                    "confidence": 0.89,
                    "box": {
                        "x1": 15.0,
                        "y1": 25.0,
                        "x2": 105.0,
                        "y2": 205.0,
                    },
                }
            ],
            "inference_time_ms": 13.2,
        },
    ]

    with patch(
        "app.services.video_processing_service.video_service.read_frames",
        return_value=iter(frames),
    ), patch(
        "app.services.video_processing_service.detection_service.track",
        side_effect=tracking_results,
    ):

        results = list(
            video_processing_service.track_video(
                "test.mp4"
            )
        )

    track_ids = [
        result["tracks"][0]["track_id"]
        for result in results
    ]

    assert track_ids == [7, 7, 7]

def test_count_tracked_objects_success():
    tracking_results = [
        {
            "frame_index": 0,
            "tracks": [
                {"track_id": 1},
                {"track_id": 2},
                {"track_id": 3},
            ],
            "inference_time_ms": 10.0,
        },
        {
            "frame_index": 1,
            "tracks": [
                {"track_id": 1},
                {"track_id": 2},
                {"track_id": 3},
            ],
            "inference_time_ms": 11.0,
        },
        {
            "frame_index": 2,
            "tracks": [
                {"track_id": 1},
                {"track_id": 2},
                {"track_id": 3},
                {"track_id": 4},
            ],
            "inference_time_ms": 12.0,
        },
    ]

    with patch.object(
        video_processing_service,
        "track_video",
        return_value=iter(tracking_results),
    ):
        results = list(
            video_processing_service.count_tracked_objects(
                "test.mp4"
            )
        )

    assert results == [
        {
            "frame_index": 0,
            "object_count": 3,
            "unique_object_count": 3,
            "inference_time_ms": 10.0,
        },
        {
            "frame_index": 1,
            "object_count": 3,
            "unique_object_count": 3,
            "inference_time_ms": 11.0,
        },
        {
            "frame_index": 2,
            "object_count": 4,
            "unique_object_count": 4,
            "inference_time_ms": 12.0,
        },
    ]


def test_count_tracked_objects_handles_empty_video():
    with patch.object(
        video_processing_service,
        "track_video",
        return_value=iter([]),
    ):
        results = list(
            video_processing_service.count_tracked_objects(
                "empty.mp4"
            )
        )

    assert results == []


def test_count_tracked_objects_passes_stride():
    with patch.object(
        video_processing_service,
        "track_video",
        return_value=iter([]),
    ) as track_video_mock:

        list(
            video_processing_service.count_tracked_objects(
                "test.mp4",
                frame_stride=5,
            )
        )

    track_video_mock.assert_called_once_with(
        "test.mp4",
        frame_stride=5,
    )