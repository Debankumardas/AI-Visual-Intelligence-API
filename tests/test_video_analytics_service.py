from app.services.video_analytics_service import (
    VideoAnalyticsService,
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