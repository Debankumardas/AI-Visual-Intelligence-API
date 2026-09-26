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

    def calculate_class_detection_metrics(
        self,
        detections_per_frame: list[list[dict]],
    ):
        """Calculate detection statistics grouped by object class."""

        if not detections_per_frame:
            return {
                "class_detection_counts": {},
                "max_detections_by_class": {},
                "average_detections_by_class": {},
            }

        class_counts: dict[str, int] = {}
        frame_counts: dict[str, int] = {}

        for detections in detections_per_frame:
            classes_seen_in_frame: set[str] = set()

            for detection in detections:
                label = str(detection.get("label", "unknown"))

                class_counts[label] = class_counts.get(label, 0) + 1
                classes_seen_in_frame.add(label)

            for label in classes_seen_in_frame:
                frame_counts[label] = frame_counts.get(label, 0) + 1

        max_detections_by_class: dict[str, int] = {}

        for detections in detections_per_frame:
            frame_class_counts: dict[str, int] = {}

            for detection in detections:
                label = str(detection.get("label", "unknown"))
                frame_class_counts[label] = (
                    frame_class_counts.get(label, 0) + 1
                )

            for label, count in frame_class_counts.items():
                max_detections_by_class[label] = max(
                    max_detections_by_class.get(label, 0),
                    count,
                )

        frame_count = len(detections_per_frame)

        average_detections_by_class = {
            label: round(count / frame_count, 3)
            for label, count in class_counts.items()
        }

        return {
            "class_detection_counts": class_counts,
            "max_detections_by_class": max_detections_by_class,
            "average_detections_by_class": average_detections_by_class,
        }

    def calculate_class_tracking_metrics(
        self,
        tracks_per_frame: list[list[dict]],
    ):
        """Calculate tracking statistics grouped by object class."""

        if not tracks_per_frame:
            return {
                "class_tracking_counts": {},
                "unique_track_ids_by_class": {},
                "max_tracks_by_class": {},
                "average_tracks_by_class": {},
            }

        class_counts: dict[str, int] = {}
        class_track_ids: dict[str, set[int]] = {}
        max_tracks_by_class: dict[str, int] = {}

        for tracks in tracks_per_frame:
            frame_class_counts: dict[str, int] = {}

            for track in tracks:
                label = str(track.get("label", "unknown"))
                track_id = int(track["track_id"])

                class_counts[label] = (
                    class_counts.get(label, 0) + 1
                )

                class_track_ids.setdefault(
                    label,
                    set(),
                ).add(track_id)

                frame_class_counts[label] = (
                    frame_class_counts.get(label, 0) + 1
                )

            for label, count in frame_class_counts.items():
                max_tracks_by_class[label] = max(
                    max_tracks_by_class.get(label, 0),
                    count,
                )

        frame_count = len(tracks_per_frame)

        average_tracks_by_class = {
            label: round(
                count / frame_count,
                3,
            )
            for label, count in class_counts.items()
        }

        return {
            "class_tracking_counts": class_counts,
            "unique_track_ids_by_class": {
                label: len(track_ids)
                for label, track_ids in class_track_ids.items()
            },
            "max_tracks_by_class": max_tracks_by_class,
            "average_tracks_by_class": average_tracks_by_class,
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