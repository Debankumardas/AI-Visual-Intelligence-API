import cv2

from app.core.config import settings


class VideoService:
    """Service for reading and analyzing video files."""

    def get_metadata(self, video_path: str):
        """Extract basic metadata from a video file."""

        capture = cv2.VideoCapture(video_path)

        if not capture.isOpened():
            raise ValueError("Unable to open video file")

        frame_count = int(
            capture.get(cv2.CAP_PROP_FRAME_COUNT)
        )

        fps = float(
            capture.get(cv2.CAP_PROP_FPS)
        )

        width = int(
            capture.get(cv2.CAP_PROP_FRAME_WIDTH)
        )

        height = int(
            capture.get(cv2.CAP_PROP_FRAME_HEIGHT)
        )

        capture.release()

        duration = (
            frame_count / fps
            if fps > 0
            else 0.0
        )

        return {
            "frame_count": frame_count,
            "fps": fps,
            "width": width,
            "height": height,
            "duration": round(duration, 3),
        }


video_service = VideoService()