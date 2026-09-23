from PIL import Image

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


video_processing_service = VideoProcessingService()