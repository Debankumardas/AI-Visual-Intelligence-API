class VideoAnalyticsService:
    """Service for calculating video processing metrics."""

    def calculate_metrics(
        self,
        inference_times_ms: list[float],
        processing_time_seconds: float,
    ):
        """Calculate aggregate performance metrics."""

        frames_processed = len(inference_times_ms)

        if frames_processed == 0:
            return {
                "frames_processed": 0,
                "processing_time_seconds": 0.0,
                "effective_fps": 0.0,
                "total_inference_time_ms": 0.0,
                "average_inference_time_ms": 0.0,
                "min_inference_time_ms": 0.0,
                "max_inference_time_ms": 0.0,
            }

        total_inference_time = sum(inference_times_ms)
        average_inference_time = (
            total_inference_time / frames_processed
        )

        effective_fps = (
            frames_processed / processing_time_seconds
            if processing_time_seconds > 0
            else 0.0
        )

        return {
            "frames_processed": frames_processed,
            "processing_time_seconds": round(
                processing_time_seconds,
                3,
            ),
            "effective_fps": round(
                effective_fps,
                3,
            ),
            "total_inference_time_ms": round(
                total_inference_time,
                3,
            ),
            "average_inference_time_ms": round(
                average_inference_time,
                3,
            ),
            "min_inference_time_ms": round(
                min(inference_times_ms),
                3,
            ),
            "max_inference_time_ms": round(
                max(inference_times_ms),
                3,
            ),
        }


video_analytics_service = VideoAnalyticsService()