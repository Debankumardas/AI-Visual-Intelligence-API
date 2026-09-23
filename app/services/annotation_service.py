import cv2


class AnnotationService:
    """Service for drawing computer vision results on video frames."""

    def draw_detection(
        self,
        frame,
        box,
        label: str,
        confidence: float,
    ):
        """Draw a detection bounding box with label and confidence."""

        if frame is None:
            raise ValueError("Frame cannot be None")

        x1 = int(box["x1"])
        y1 = int(box["y1"])
        x2 = int(box["x2"])
        y2 = int(box["y2"])

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2,
        )

        text = f"{label} {confidence:.2f}"

        cv2.putText(
            frame,
            text,
            (x1, max(y1 - 10, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2,
        )

        return frame

    def draw_track(
        self,
        frame,
        box,
        label: str,
        confidence: float,
        track_id: int,
    ):
        """Draw a tracked object with its track ID."""

        if frame is None:
            raise ValueError("Frame cannot be None")

        x1 = int(box["x1"])
        y1 = int(box["y1"])
        x2 = int(box["x2"])
        y2 = int(box["y2"])

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (255, 0, 0),
            2,
        )

        text = f"{label} #{track_id} {confidence:.2f}"

        cv2.putText(
            frame,
            text,
            (x1, max(y1 - 10, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 0, 0),
            2,
        )

        return frame


annotation_service = AnnotationService()