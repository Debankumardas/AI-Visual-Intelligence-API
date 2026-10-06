import math
import os
import time
from itertools import islice

import cv2
from PIL import Image

from app.core.config import settings

from app.services.video_analytics_service import (
    video_analytics_service,
)
from app.services.annotation_service import annotation_service
from app.services.video_writer_service import video_writer_service
from app.services.detection_service import detection_service
from app.services.video_service import video_service


class VideoProcessingService:
    """Service for processing video frames with computer vision."""

    def process_frames(
        self,
        video_path: str,
        frame_stride: int = 1,
    ):
        """Process video frames sequentially with object detection."""

        for frame_index, frame in video_service.read_frames(
            video_path,
            frame_stride=frame_stride,
        ):
            image = Image.fromarray(frame)

            detection = detection_service.detect(image)

            yield {
                "frame_index": frame_index,
                "detections": detection["detections"],
                "inference_time_ms": detection[
                    "inference_time_ms"
                ],
            }

    def track_video(
        self,
        video_path: str,
        frame_stride: int = 1,
    ):
        """Track objects across consecutive video frames."""

        for frame_index, frame in video_service.read_frames(
            video_path,
            frame_stride=frame_stride,
        ):
            image = Image.fromarray(frame)

            tracking = detection_service.track(image)

            yield {
                "frame_index": frame_index,
                "tracks": tracking["tracks"],
                "inference_time_ms": tracking[
                    "inference_time_ms"
                ],
            }

    def count_tracked_objects(
        self,
        video_path: str,
        frame_stride: int = 1,
    ):
        """Count visible and unique tracked objects across a video."""

        unique_track_ids = set()

        for frame_result in self.track_video(
            video_path,
            frame_stride=frame_stride,
        ):
            track_ids = {
                track["track_id"]
                for track in frame_result["tracks"]
            }

            unique_track_ids.update(track_ids)

            yield {
                "frame_index": frame_result["frame_index"],
                "object_count": len(track_ids),
                "unique_object_count": len(unique_track_ids),
                "inference_time_ms": frame_result[
                    "inference_time_ms"
                ],
            }

    def plan_frame_sampling(
        self,
        source_frame_count: int,
        frame_stride: int | None = None,
        max_frames: int | None = None,
    ):
        """
        Decide which frames to run through the model.

        Without an explicit stride, frames are sampled evenly so that
        at most ``max_frames`` frames are processed across the whole
        video. The budget is also a hard upper bound, because the
        container-reported frame count can be inaccurate.

        Returns:
            (frame_stride, max_frames)
        """

        if frame_stride is not None and frame_stride < 1:
            raise ValueError("Frame stride must be at least 1")

        budget = (
            settings.video_max_processed_frames
            if max_frames is None
            else max_frames
        )

        if budget < 1:
            raise ValueError("Max frames must be at least 1")

        if frame_stride is None:
            frame_stride = max(
                1,
                math.ceil(max(source_frame_count, 0) / budget),
            )

        return frame_stride, budget

    def analyze_video(
        self,
        video_path: str,
        frame_stride: int | None = None,
        max_frames: int | None = None,
    ):
        """
        Process a video once and calculate detection and tracking analytics.

        Each sampled frame goes through a single tracking pass; the
        per-frame detections are taken from the same result.
        """

        if frame_stride is not None and frame_stride < 1:
            raise ValueError("Frame stride must be at least 1")

        metadata = video_service.get_metadata(video_path)
        source_frame_count = metadata.get("frame_count", 0)

        frame_stride, max_frames = self.plan_frame_sampling(
            source_frame_count=source_frame_count,
            frame_stride=frame_stride,
            max_frames=max_frames,
        )

        start_time = time.perf_counter()

        inference_times_ms = []
        detection_counts = []
        detections_per_frame = []
        detection_frame_indices = []
        track_ids_per_frame = []
        tracks_per_frame = []
        with detection_service.tracking_session():
            frames = video_service.read_frames(
                video_path,
                frame_stride=frame_stride,
            )

            for frame_index, frame in islice(frames, max_frames):
                image = Image.fromarray(
                    cv2.cvtColor(
                        frame,
                        cv2.COLOR_BGR2RGB,
                    )
                )

                tracking = detection_service.track(image)

                inference_times_ms.append(
                    tracking["inference_time_ms"]
                )

                detection_counts.append(
                    len(tracking["detections"])
                )

                detections_per_frame.append(
                    tracking["detections"]
                )

                detection_frame_indices.append(
                    frame_index
                )

                tracks_per_frame.append(
                    tracking["tracks"]
                )

                track_ids_per_frame.append(
                    [
                        track["track_id"]
                        for track in tracking["tracks"]
                    ]
                )

        processing_time_seconds = (
            time.perf_counter() - start_time
        )

        performance_metrics = (
            video_analytics_service.calculate_metrics(
                inference_times_ms=inference_times_ms,
                processing_time_seconds=processing_time_seconds,
            )
        )

        detection_metrics = (
            video_analytics_service.calculate_detection_metrics(
                detection_counts=detection_counts,
            )
        )

        class_detection_metrics = (
            video_analytics_service.calculate_class_detection_metrics(
                detections_per_frame=detections_per_frame,
            )
        )

        temporal_detection_metrics = (
            video_analytics_service.calculate_temporal_detection_metrics(
                detections_per_frame=detections_per_frame,
                frame_indices=detection_frame_indices,
            )
        )

        tracking_metrics = (
            video_analytics_service.calculate_tracking_metrics(
                track_ids_per_frame=track_ids_per_frame,
            )
        )

        track_duration_metrics = (
            video_analytics_service.calculate_track_duration_metrics(
                track_ids_per_frame=track_ids_per_frame,
                frame_indices=detection_frame_indices,
            )
        )

        track_gap_metrics = (
            video_analytics_service.calculate_track_gap_metrics(
                track_ids_per_frame=track_ids_per_frame,
            )
        )

        track_cooccurrence_metrics = (
            video_analytics_service.calculate_track_cooccurrence_metrics(
                track_ids_per_frame=track_ids_per_frame,
            )
        )

        # Persistence compares observed frames with the track's span.
        # Measure the span in sampled frames, otherwise sampling every
        # Nth frame would make every track look 1/N persistent.
        sampled_frame_ordinals = [
            frame_index // frame_stride
            for frame_index in detection_frame_indices
        ]

        track_persistence_metrics = (
            video_analytics_service.calculate_track_persistence_metrics(
                track_ids_per_frame=track_ids_per_frame,
                frame_indices=sampled_frame_ordinals,
            )
        )

        class_tracking_metrics = (
            video_analytics_service.calculate_class_tracking_metrics(
                tracks_per_frame=tracks_per_frame,
            )
        )

        track_movement_metrics = (
            video_analytics_service.calculate_track_movement_metrics(
                tracks_per_frame=tracks_per_frame,
                frame_indices=detection_frame_indices,
            )
        )

        track_proximity_metrics = (
            video_analytics_service.calculate_track_proximity_metrics(
                tracks_per_frame=tracks_per_frame,
                distance_threshold=50.0,
            )
        )

        track_interaction_duration_metrics = (
            video_analytics_service.calculate_track_interaction_duration_metrics(
                tracks_per_frame=tracks_per_frame,
                frame_indices=detection_frame_indices,
                distance_threshold=50.0,
            )
        )

        track_interaction_episode_metrics = (
            video_analytics_service.calculate_track_interaction_episode_metrics(
                tracks_per_frame=tracks_per_frame,
                distance_threshold=50.0,
            )
        )

        track_interaction_network_metrics = (
            video_analytics_service
            .calculate_track_interaction_network_metrics(
                track_interaction_episodes=(
                    track_interaction_episode_metrics[
                        "track_interaction_episodes"
                    ]
                ),
            )
        )

        return {
            "frame_stride": frame_stride,
            "source_frame_count": source_frame_count,
            **performance_metrics,
            **detection_metrics,
            **class_detection_metrics,
            **track_movement_metrics,
            **track_proximity_metrics,
            **track_duration_metrics,
            **track_interaction_duration_metrics,
            **track_interaction_episode_metrics,
            **track_interaction_network_metrics,
            **temporal_detection_metrics,
            **tracking_metrics,
            **track_persistence_metrics,
            **track_gap_metrics,
            **track_cooccurrence_metrics,
            **class_tracking_metrics,
        }

    def generate_annotated_video(
        self,
        video_path: str,
        output_path: str,
        frame_stride: int | None = None,
        max_frames: int | None = None,
    ):
        """Generate an annotated video with tracked objects."""

        if frame_stride is not None and frame_stride < 1:
            raise ValueError(
                "Frame stride must be at least 1"
            )

        writer = None
        success = False
        frames_written = 0

        try:
            metadata = video_service.get_metadata(
                video_path
            )

            frame_stride, max_frames = self.plan_frame_sampling(
                source_frame_count=metadata.get("frame_count", 0),
                frame_stride=frame_stride,
                max_frames=max_frames,
            )

            output_fps = (
                metadata["fps"] / frame_stride
            )

            if output_fps <= 0:
                raise ValueError(
                    "Invalid output FPS"
                )

            writer = video_writer_service.create_writer(
                output_path=output_path,
                fps=output_fps,
                width=metadata["width"],
                height=metadata["height"],
            )

            with detection_service.tracking_session():
                frames = video_service.read_frames(
                    video_path,
                    frame_stride=frame_stride,
                )

                for frame_index, frame in islice(frames, max_frames):
                    image = Image.fromarray(
                        cv2.cvtColor(
                            frame,
                            cv2.COLOR_BGR2RGB,
                        )
                    )

                    tracking = detection_service.track(
                        image
                    )

                    annotated_frame = frame.copy()

                    for track in tracking["tracks"]:
                        annotated_frame = (
                            annotation_service.draw_track(
                                frame=annotated_frame,
                                box=track["box"],
                                label=track["label"],
                                confidence=track["confidence"],
                                track_id=track["track_id"],
                            )
                        )

                    video_writer_service.write_frame(
                        writer,
                        annotated_frame,
                    )

                    frames_written += 1

            if frames_written == 0:
                raise ValueError(
                    "No frames were processed from the video."
                )

            success = True

            return output_path

        finally:
            video_writer_service.release(writer)

            if (
                not success
                and os.path.exists(output_path)
            ):
                os.remove(output_path)


video_processing_service = VideoProcessingService()
