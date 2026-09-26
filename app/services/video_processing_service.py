import os
import time

import cv2
from PIL import Image

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

    def analyze_video(
        self,
        video_path: str,
        frame_stride: int = 1,
    ):
        """Process a video once and calculate detection and tracking analytics."""

        if frame_stride < 1:
            raise ValueError("Frame stride must be at least 1")

        start_time = time.perf_counter()

        inference_times_ms = []
        detection_counts = []
        detections_per_frame = []
        track_ids_per_frame = []

        for frame_index, frame in video_service.read_frames(
            video_path,
            frame_stride=frame_stride,
        ):
            image = Image.fromarray(
                cv2.cvtColor(
                    frame,
                    cv2.COLOR_BGR2RGB,
                )
            )

            detection = detection_service.detect(image)
            tracking = detection_service.track(image)

            inference_times_ms.append(
                detection["inference_time_ms"]
            )

            detection_counts.append(
                len(detection["detections"])
            )

            detections_per_frame.append(
                detection["detections"]
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

        tracking_metrics = (
            video_analytics_service.calculate_tracking_metrics(
                track_ids_per_frame=track_ids_per_frame,
            )
        )

        return {
            **performance_metrics,
            **detection_metrics,
            **class_detection_metrics,
            **tracking_metrics,
        }

    def generate_annotated_video(
        self,
        video_path: str,
        output_path: str,
        frame_stride: int = 1,
    ):
        """Generate an annotated video with tracked objects."""

        if frame_stride < 1:
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

            for frame_index, frame in video_service.read_frames(
                video_path,
                frame_stride=frame_stride,
            ):
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