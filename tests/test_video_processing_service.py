import numpy as np
import pytest

from unittest.mock import MagicMock
from unittest.mock import patch

from app.services.video_processing_service import (
    VideoProcessingService,
)

from app.services.annotation_service import annotation_service
from app.services.detection_service import detection_service
from app.services.video_service import video_service
from app.services.video_writer_service import video_writer_service

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


def test_generate_annotated_video(monkeypatch, tmp_path):
    output_path = str(tmp_path / "annotated.mp4")

    monkeypatch.setattr(
        video_service,
        "get_metadata",
        lambda path: {
            "frame_count": 2,
            "fps": 30.0,
            "width": 640,
            "height": 480,
            "duration": 0.067,
        },
    )

    frames = [
        (0, np.zeros((480, 640, 3), dtype=np.uint8)),
        (1, np.zeros((480, 640, 3), dtype=np.uint8)),
    ]

    monkeypatch.setattr(
        video_service,
        "read_frames",
        lambda path, frame_stride=1: iter(frames),
    )

    monkeypatch.setattr(
        detection_service,
        "track",
        lambda image: {
            "tracks": [
                {
                    "track_id": 1,
                    "label": "person",
                    "confidence": 0.95,
                    "box": {
                        "x1": 100,
                        "y1": 100,
                        "x2": 300,
                        "y2": 300,
                    },
                }
            ]
        },
    )

    writer = MagicMock()

    monkeypatch.setattr(
        video_writer_service,
        "create_writer",
        lambda **kwargs: writer,
    )

    monkeypatch.setattr(
        annotation_service,
        "draw_track",
        lambda **kwargs: kwargs["frame"],
    )

    result = video_processing_service.generate_annotated_video(
        video_path="input.mp4",
        output_path=output_path,
    )

    assert result == output_path
    assert writer.write.call_count == 2
    writer.release.assert_called_once()

def test_generate_annotated_video_removes_partial_output_on_failure(
    monkeypatch,
    tmp_path,
):
    output_path = tmp_path / "partial.mp4"
    output_path.write_bytes(b"partial video")

    monkeypatch.setattr(
        video_service,
        "get_metadata",
        lambda path: {
            "frame_count": 1,
            "fps": 30.0,
            "width": 640,
            "height": 480,
            "duration": 0.033,
        },
    )

    monkeypatch.setattr(
        video_service,
        "read_frames",
        lambda path, frame_stride=1: iter(
            [
                (
                    0,
                    np.zeros(
                        (480, 640, 3),
                        dtype=np.uint8,
                    ),
                )
            ]
        ),
    )

    monkeypatch.setattr(
        detection_service,
        "track",
        lambda image: {
            "tracks": []
        },
    )

    writer = MagicMock()

    monkeypatch.setattr(
        video_writer_service,
        "create_writer",
        lambda **kwargs: writer,
    )

    def raise_write_error(*args, **kwargs):
        raise RuntimeError("Video write failed")

    monkeypatch.setattr(
        video_writer_service,
        "write_frame",
        raise_write_error,
    )

    with pytest.raises(
        RuntimeError,
        match="Video write failed",
    ):
        video_processing_service.generate_annotated_video(
            video_path="input.mp4",
            output_path=str(output_path),
        )

    writer.release.assert_called_once()
    assert not output_path.exists()

def test_generate_annotated_video_removes_output_when_writer_creation_fails(
    monkeypatch,
    tmp_path,
):
    output_path = tmp_path / "failed.mp4"
    output_path.write_bytes(b"invalid output")

    monkeypatch.setattr(
        video_service,
        "get_metadata",
        lambda path: {
            "frame_count": 1,
            "fps": 30.0,
            "width": 640,
            "height": 480,
            "duration": 0.033,
        },
    )

    def raise_writer_error(**kwargs):
        raise ValueError("Unable to create video writer")

    monkeypatch.setattr(
        video_writer_service,
        "create_writer",
        raise_writer_error,
    )

    with pytest.raises(
        ValueError,
        match="Unable to create video writer",
    ):
        video_processing_service.generate_annotated_video(
            video_path="input.mp4",
            output_path=str(output_path),
        )

    assert not output_path.exists()

def test_generate_annotated_video_rejects_invalid_stride():
    with pytest.raises(
        ValueError,
        match="Frame stride must be at least 1",
    ):
        video_processing_service.generate_annotated_video(
            video_path="input.mp4",
            output_path="output.mp4",
            frame_stride=0,
        )


def test_generate_annotated_video_rejects_invalid_output_fps(
    monkeypatch,
    tmp_path,
):
    output_path = str(tmp_path / "invalid_fps.mp4")

    monkeypatch.setattr(
        video_service,
        "get_metadata",
        lambda path: {
            "frame_count": 1,
            "fps": 0.0,
            "width": 640,
            "height": 480,
            "duration": 0.0,
        },
    )

    with pytest.raises(
        ValueError,
        match="Invalid output FPS",
    ):
        video_processing_service.generate_annotated_video(
            video_path="input.mp4",
            output_path=output_path,
        )


def test_generate_annotated_video_rejects_empty_video(
    monkeypatch,
    tmp_path,
):
    output_path = str(tmp_path / "empty.mp4")

    monkeypatch.setattr(
        video_service,
        "get_metadata",
        lambda path: {
            "frame_count": 0,
            "fps": 30.0,
            "width": 640,
            "height": 480,
            "duration": 0.0,
        },
    )

    monkeypatch.setattr(
        video_service,
        "read_frames",
        lambda path, frame_stride=1: iter([]),
    )

    writer = MagicMock()

    monkeypatch.setattr(
        video_writer_service,
        "create_writer",
        lambda **kwargs: writer,
    )

    with pytest.raises(
        ValueError,
        match="No frames were processed from the video",
    ):
        video_processing_service.generate_annotated_video(
            video_path="input.mp4",
            output_path=output_path,
        )

def test_analyze_video():
    service = VideoProcessingService()

    frames = [
        (0, np.zeros((100, 100, 3), dtype=np.uint8)),
        (1, np.zeros((100, 100, 3), dtype=np.uint8)),
        (2, np.zeros((100, 100, 3), dtype=np.uint8)),
    ]

    detection_results = [
        {
            "inference_time_ms": 10.0,
            "detections": [{}, {}],
        },
        {
            "inference_time_ms": 20.0,
            "detections": [{}, {}, {}, {}],
        },
        {
            "inference_time_ms": 30.0,
            "detections": [{}],
        },
    ]

    tracking_results = [
        {
            "inference_time_ms": 5.0,
            "tracks": [
                {"track_id": 1},
                {"track_id": 2},
            ],
        },
        {
            "inference_time_ms": 6.0,
            "tracks": [
                {"track_id": 1},
                {"track_id": 2},
            ],
        },
        {
            "inference_time_ms": 7.0,
            "tracks": [
                {"track_id": 1},
                {"track_id": 2},
                {"track_id": 3},
            ],
        },
    ]

    with (
        patch.object(
            video_service,
            "read_frames",
            return_value=iter(frames),
        ),
        patch.object(
            detection_service,
            "detect",
            side_effect=detection_results,
        ),
        patch.object(
            detection_service,
            "track",
            side_effect=tracking_results,
        ),
    ):
        result = service.analyze_video(
            "sample.mp4",
        )

    assert result["frames_processed"] == 3

    assert result["total_detections"] == 7
    assert result["max_detections_per_frame"] == 4
    assert result["average_detections_per_frame"] == 2.333

    assert result["total_track_observations"] == 7
    assert result["unique_track_ids"] == 3
    assert result["max_tracks_per_frame"] == 3
    assert result["average_tracks_per_frame"] == 2.333

    assert result["total_inference_time_ms"] == 60.0
    assert result["average_inference_time_ms"] == 20.0
    assert result["min_inference_time_ms"] == 10.0
    assert result["max_inference_time_ms"] == 30.0


def test_analyze_video_empty():
    service = VideoProcessingService()

    with patch.object(
        video_service,
        "read_frames",
        return_value=iter([]),
    ):
        result = service.analyze_video(
            "sample.mp4",
        )

    assert result["frames_processed"] == 0
    assert result["processing_time_seconds"] >= 0
    assert result["effective_fps"] == 0.0

    assert result["total_inference_time_ms"] == 0.0
    assert result["average_inference_time_ms"] == 0.0
    assert result["min_inference_time_ms"] == 0.0
    assert result["max_inference_time_ms"] == 0.0

    assert result["total_detections"] == 0
    assert result["max_detections_per_frame"] == 0
    assert result["average_detections_per_frame"] == 0.0

    assert result["total_track_observations"] == 0
    assert result["unique_track_ids"] == 0
    assert result["max_tracks_per_frame"] == 0
    assert result["average_tracks_per_frame"] == 0.0


def test_analyze_video_invalid_frame_stride():
    service = VideoProcessingService()

    with pytest.raises(
        ValueError,
        match="Frame stride must be at least 1",
    ):
        service.analyze_video(
            "sample.mp4",
            frame_stride=0,
        )