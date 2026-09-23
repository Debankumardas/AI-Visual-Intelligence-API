import cv2


class VideoWriterService:
    """Service for writing processed frames to a video file."""

    def create_writer(
        self,
        output_path: str,
        fps: float,
        width: int,
        height: int,
    ):
        """Create and return an OpenCV video writer."""

        if fps <= 0:
            raise ValueError("FPS must be greater than 0")

        if width <= 0 or height <= 0:
            raise ValueError("Video dimensions must be greater than 0")

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")

        writer = cv2.VideoWriter(
            output_path,
            fourcc,
            fps,
            (width, height),
        )

        if not writer.isOpened():
            writer.release()
            raise ValueError("Unable to create video writer")

        return writer

    def write_frame(self, writer, frame):
        """Write a single frame to the output video."""

        if frame is None:
            raise ValueError("Frame cannot be None")

        writer.write(frame)

    def release(self, writer):
        """Release the video writer safely."""

        if writer is not None:
            writer.release()


video_writer_service = VideoWriterService()