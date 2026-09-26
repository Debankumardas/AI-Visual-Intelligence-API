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