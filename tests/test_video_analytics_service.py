import pytest
from app.services.video_analytics_service import (
    VideoAnalyticsService,
)

from app.services.video_analytics_service import (
    video_analytics_service,
)


def test_calculate_metrics():
    service = VideoAnalyticsService()

    metrics = service.calculate_metrics(
        inference_times_ms=[10.0, 20.0, 30.0],
        processing_time_seconds=0.5,
    )

    assert metrics["frames_processed"] == 3
    assert metrics["processing_time_seconds"] == 0.5
    assert metrics["effective_fps"] == 6.0
    assert metrics["total_inference_time_ms"] == 60.0
    assert metrics["average_inference_time_ms"] == 20.0
    assert metrics["min_inference_time_ms"] == 10.0
    assert metrics["max_inference_time_ms"] == 30.0


def test_calculate_metrics_empty_results():
    service = VideoAnalyticsService()

    metrics = service.calculate_metrics(
        inference_times_ms=[],
        processing_time_seconds=0.0,
    )

    assert metrics["frames_processed"] == 0
    assert metrics["processing_time_seconds"] == 0.0
    assert metrics["effective_fps"] == 0.0
    assert metrics["total_inference_time_ms"] == 0.0
    assert metrics["average_inference_time_ms"] == 0.0
    assert metrics["min_inference_time_ms"] == 0.0
    assert metrics["max_inference_time_ms"] == 0.0


def test_calculate_detection_metrics():
    service = VideoAnalyticsService()

    metrics = service.calculate_detection_metrics(
        detection_counts=[2, 4, 1, 3],
    )

    assert metrics["total_detections"] == 10
    assert metrics["max_detections_per_frame"] == 4
    assert metrics["average_detections_per_frame"] == 2.5


def test_calculate_detection_metrics_empty():
    service = VideoAnalyticsService()

    metrics = service.calculate_detection_metrics(
        detection_counts=[],
    )

    assert metrics["total_detections"] == 0
    assert metrics["max_detections_per_frame"] == 0
    assert metrics["average_detections_per_frame"] == 0.0


def test_calculate_tracking_metrics():
    service = VideoAnalyticsService()

    track_ids_per_frame = [
        [1, 2, 3],
        [1, 2, 3],
        [1, 2, 3, 4],
    ]

    result = service.calculate_tracking_metrics(
        track_ids_per_frame
    )

    assert result["total_track_observations"] == 10
    assert result["unique_track_ids"] == 4
    assert result["max_tracks_per_frame"] == 4
    assert result["average_tracks_per_frame"] == 3.333


def test_calculate_tracking_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_tracking_metrics([])

    assert result == {
        "total_track_observations": 0,
        "unique_track_ids": 0,
        "max_tracks_per_frame": 0,
        "average_tracks_per_frame": 0.0,
    }


def test_calculate_class_detection_metrics():
    service = VideoAnalyticsService()

    detections_per_frame = [
        [
            {"label": "person"},
            {"label": "person"},
            {"label": "car"},
        ],
        [
            {"label": "person"},
            {"label": "car"},
            {"label": "car"},
        ],
        [
            {"label": "car"},
        ],
    ]

    result = service.calculate_class_detection_metrics(
        detections_per_frame
    )

    assert result["class_detection_counts"] == {
        "person": 3,
        "car": 4,
    }

    assert result["max_detections_by_class"] == {
        "person": 2,
        "car": 2,
    }

    assert result["average_detections_by_class"] == {
        "person": 1.0,
        "car": 1.333,
    }


def test_calculate_class_detection_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_class_detection_metrics([])

    assert result == {
        "class_detection_counts": {},
        "max_detections_by_class": {},
        "average_detections_by_class": {},
    }


def test_calculate_class_tracking_metrics():
    tracks_per_frame = [
        [
            {"track_id": 1, "label": "person"},
            {"track_id": 2, "label": "person"},
            {"track_id": 3, "label": "car"},
        ],
        [
            {"track_id": 1, "label": "person"},
            {"track_id": 2, "label": "person"},
            {"track_id": 3, "label": "car"},
            {"track_id": 4, "label": "car"},
        ],
        [
            {"track_id": 1, "label": "person"},
            {"track_id": 3, "label": "car"},
        ],
    ]

    result = (
        video_analytics_service.calculate_class_tracking_metrics(
            tracks_per_frame
        )
    )

    assert result["class_tracking_counts"] == {
        "person": 5,
        "car": 4,
    }

    assert result["unique_track_ids_by_class"] == {
        "person": 2,
        "car": 2,
    }

    assert result["max_tracks_by_class"] == {
        "person": 2,
        "car": 2,
    }

    assert result["average_tracks_by_class"] == {
        "person": 1.667,
        "car": 1.333,
    }


def test_calculate_class_tracking_metrics_empty():
    result = (
        video_analytics_service.calculate_class_tracking_metrics(
            []
        )
    )

    assert result == {
        "class_tracking_counts": {},
        "unique_track_ids_by_class": {},
        "max_tracks_by_class": {},
        "average_tracks_by_class": {},
    }


def test_calculate_temporal_detection_metrics():
    service = VideoAnalyticsService()

    detections_per_frame = [
        [
            {"label": "person"},
            {"label": "car"},
        ],
        [
            {"label": "person"},
        ],
        [
            {"label": "person"},
            {"label": "car"},
        ],
        [],
        [
            {"label": "car"},
        ],
    ]

    frame_indices = [0, 1, 2, 3, 4]

    result = service.calculate_temporal_detection_metrics(
        detections_per_frame=detections_per_frame,
        frame_indices=frame_indices,
    )

    assert result["first_detection_frame"] == {
        "person": 0,
        "car": 0,
    }

    assert result["last_detection_frame"] == {
        "person": 2,
        "car": 4,
    }

    assert result["active_frames_by_class"] == {
        "person": 3,
        "car": 3,
    }

    assert result["class_presence_ratio"] == {
        "person": 0.6,
        "car": 0.6,
    }

def test_calculate_track_duration_metrics():
    result = video_analytics_service.calculate_track_duration_metrics(
        track_ids_per_frame=[
            [1, 2],
            [1],
            [1, 2],
            [2],
        ],
        frame_indices=[
            0,
            1,
            2,
            3,
        ],
    )

    assert result == {
        "track_duration_frames": {
            1: 3,
            2: 4,
        },
    }


def test_calculate_track_duration_metrics_with_frame_stride():
    result = video_analytics_service.calculate_track_duration_metrics(
        track_ids_per_frame=[
            [5],
            [5],
            [5],
        ],
        frame_indices=[
            0,
            2,
            4,
        ],
    )

    assert result == {
        "track_duration_frames": {
            5: 5,
        },
    }


def test_calculate_track_duration_metrics_empty():
    result = video_analytics_service.calculate_track_duration_metrics(
        track_ids_per_frame=[],
        frame_indices=[],
    )

    assert result == {
        "track_duration_frames": {},
    }


def test_calculate_track_duration_metrics_mismatched_lengths():
    with pytest.raises(
        ValueError,
        match="Track frames and frame indices must have the same length",
    ):
        video_analytics_service.calculate_track_duration_metrics(
            track_ids_per_frame=[
                [1],
            ],
            frame_indices=[],
        )


def test_calculate_temporal_detection_metrics_with_frame_stride():
    service = VideoAnalyticsService()

    detections_per_frame = [
        [
            {"label": "person"},
        ],
        [],
        [
            {"label": "person"},
            {"label": "car"},
        ],
        [
            {"label": "car"},
        ],
    ]

    frame_indices = [0, 4, 8, 12]

    result = service.calculate_temporal_detection_metrics(
        detections_per_frame=detections_per_frame,
        frame_indices=frame_indices,
    )

    assert result["first_detection_frame"] == {
        "person": 0,
        "car": 8,
    }

    assert result["last_detection_frame"] == {
        "person": 8,
        "car": 12,
    }

    assert result["active_frames_by_class"] == {
        "person": 2,
        "car": 2,
    }

    assert result["class_presence_ratio"] == {
        "person": 0.5,
        "car": 0.5,
    }


def test_calculate_temporal_detection_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_temporal_detection_metrics(
        detections_per_frame=[],
        frame_indices=[],
    )

    assert result == {
        "first_detection_frame": {},
        "last_detection_frame": {},
        "active_frames_by_class": {},
        "class_presence_ratio": {},
    }


def test_calculate_temporal_detection_metrics_mismatched_lengths():
    service = VideoAnalyticsService()

    detections_per_frame = [
        [{"label": "person"}],
        [{"label": "car"}],
    ]

    frame_indices = [0]

    try:
        service.calculate_temporal_detection_metrics(
            detections_per_frame=detections_per_frame,
            frame_indices=frame_indices,
        )
        assert False, "Expected ValueError"
    except ValueError as exc:
        assert str(exc) == (
            "Detection frames and frame indices "
            "must have the same length"
        )

def test_calculate_track_persistence_metrics():
    service = VideoAnalyticsService()

    result = service.calculate_track_persistence_metrics(
        track_ids_per_frame=[
            [1, 2],
            [1],
            [1, 2],
            [2],
        ],
        frame_indices=[0, 1, 2, 3],
    )

    assert result == {
        "track_observed_frames": {
            1: 3,
            2: 3,
        },
        "track_persistence_ratio": {
            1: 1.0,
            2: 0.75,
        },
    }


def test_calculate_track_persistence_with_missing_frames():
    service = VideoAnalyticsService()

    result = service.calculate_track_persistence_metrics(
        track_ids_per_frame=[
            [5],
            [],
            [5],
            [],
            [5],
        ],
        frame_indices=[0, 1, 2, 3, 4],
    )

    assert result == {
        "track_observed_frames": {
            5: 3,
        },
        "track_persistence_ratio": {
            5: 0.6,
        },
    }


def test_calculate_track_persistence_metrics_empty():
    service = VideoAnalyticsService()

    result = service.calculate_track_persistence_metrics(
        track_ids_per_frame=[],
        frame_indices=[],
    )

    assert result == {
        "track_observed_frames": {},
        "track_persistence_ratio": {},
    }


def test_calculate_track_persistence_metrics_mismatched_lengths():
    service = VideoAnalyticsService()

    with pytest.raises(
        ValueError,
        match="Track frames and frame indices must have the same length",
    ):
        service.calculate_track_persistence_metrics(
            track_ids_per_frame=[
                [1],
                [1],
            ],
            frame_indices=[0],
        )