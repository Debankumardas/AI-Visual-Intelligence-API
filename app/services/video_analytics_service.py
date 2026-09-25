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

    def calculate_detection_metrics(
        self,
        detection_counts: list[int],
    ):
        """Calculate aggregate object detection metrics."""

        if not detection_counts:
            return {
                "total_detections": 0,
                "max_detections_per_frame": 0,
                "average_detections_per_frame": 0.0,
            }

        total_detections = sum(detection_counts)
        max_detections = max(detection_counts)
        average_detections = (
            total_detections / len(detection_counts)
        )

        return {
            "total_detections": total_detections,
            "max_detections_per_frame": max_detections,
            "average_detections_per_frame": round(
                average_detections,
                3,
            ),
        }

    def calculate_tracking_metrics(
        self,
        track_ids_per_frame: list[list[int]],
    ):
        """Calculate aggregate object tracking metrics."""

        if not track_ids_per_frame:
            return {
                "total_track_observations": 0,
                "unique_track_ids": 0,
                "max_tracks_per_frame": 0,
                "average_tracks_per_frame": 0.0,
            }

        total_track_observations = sum(
            len(track_ids)
            for track_ids in track_ids_per_frame
        )

        unique_track_ids = {
            track_id
            for track_ids in track_ids_per_frame
            for track_id in track_ids
        }

        max_tracks_per_frame = max(
            len(track_ids)
            for track_ids in track_ids_per_frame
        )

        average_tracks_per_frame = (
            total_track_observations
            / len(track_ids_per_frame)
        )

        return {
            "total_track_observations": total_track_observations,
            "unique_track_ids": len(unique_track_ids),
            "max_tracks_per_frame": max_tracks_per_frame,
            "average_tracks_per_frame": round(
                average_tracks_per_frame,
                3,
            ),
        }


video_analytics_service = VideoAnalyticsService()