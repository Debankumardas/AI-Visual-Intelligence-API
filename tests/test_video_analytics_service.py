
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