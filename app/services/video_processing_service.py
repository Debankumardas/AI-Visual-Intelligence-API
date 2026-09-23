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


video_processing_service = VideoProcessingService()