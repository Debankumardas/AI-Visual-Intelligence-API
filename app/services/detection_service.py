import logging
import time

from PIL import Image
from ultralytics import YOLO

from app.core.config import settings


logger = logging.getLogger(__name__)


class DetectionService:

    def __init__(self):
        logger.info("Loading YOLO object detection model...")

        self.device = settings.detection_device

        self.model = YOLO("yolo11n.pt")

        logger.info("YOLO model loaded successfully.")
        logger.info("Device: %s", self.device)

    # ============================================================
    # INTERNAL YOLO INFERENCE
    # ============================================================

    def _run_inference(self, image: Image.Image):
        """
        Run YOLO inference using application configuration.
        """

        image = image.convert("RGB")

        return self.model.predict(
            source=image,
            device=self.device,
            conf=settings.detection_confidence,
            iou=settings.detection_iou,
            imgsz=settings.detection_image_size,
            verbose=False,
        )

    # ============================================================
    # INTERNAL YOLO TRACKING
    # ============================================================

    def _run_tracking(self, image: Image.Image):
        """
        Run YOLO tracking on a frame using application
        configuration.
        """

        image = image.convert("RGB")

        return self.model.track(
            source=image,
            device=settings.tracking_device,
            conf=settings.tracking_confidence,
            iou=settings.tracking_iou,
            imgsz=settings.tracking_image_size,
            persist=settings.tracking_persist,
            verbose=False,
        )

    # ============================================================
    # OBJECT DETECTION
    # ============================================================

    def detect(self, image: Image.Image):
        """
        Detect objects in a PIL image.

        Returns:
            {
                "detections": [
                    {
                        "label": str,
                        "confidence": float,
                        "box": {
                            "x1": float,
                            "y1": float,
                            "x2": float,
                            "y2": float
                        }
                    }
                ],
                "inference_time_ms": float
            }
        """

        start_time = time.perf_counter()

        results = self._run_inference(image)

        detections = []

        result = results[0]

        if result.boxes is not None:
            for box in result.boxes:

                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                x1, y1, x2, y2 = (
                    box.xyxy[0].tolist()
                )

                label = self.model.names[class_id]

                detections.append(
                    {
                        "label": label,
                        "confidence": round(
                            confidence,
                            4,
                        ),
                        "box": {
                            "x1": round(x1, 2),
                            "y1": round(y1, 2),
                            "x2": round(x2, 2),
                            "y2": round(y2, 2),
                        },
                    }
                )

        elapsed_ms = round(
            (time.perf_counter() - start_time) * 1000,
            2,
        )

        logger.info(
            "Detection completed in %.2f ms",
            elapsed_ms,
        )

        return {
            "detections": detections,
            "inference_time_ms": elapsed_ms,
        }

    # ============================================================
    # OBJECT COUNTING
    # ============================================================

    def count_objects(self, image: Image.Image):
        """
        Count detected objects by class.

        Returns:
            {
                "total_objects": int,
                "counts": [
                    {
                        "label": str,
                        "count": int
                    }
                ]
            }
        """

        results = self._run_inference(image)

        result = results[0]

        counts = {}

        if result.boxes is not None:
            for box in result.boxes:
                class_id = int(box.cls[0])
                label = self.model.names[class_id]

                counts[label] = counts.get(label, 0) + 1

        total_objects = sum(counts.values())

        return {
            "total_objects": total_objects,
            "counts": [
                {
                    "label": label,
                    "count": count,
                }
                for label, count in sorted(
                    counts.items()
                )
            ],
        }

    # ============================================================
    # OBJECT TRACKING
    # ============================================================

    def track(self, image: Image.Image):
        """
        Track objects in a frame.

        Returns:
            {
                "tracks": [
                    {
                        "track_id": int,
                        "label": str,
                        "confidence": float,
                        "box": {
                            "x1": float,
                            "y1": float,
                            "x2": float,
                            "y2": float
                        }
                    }
                ]
            }
        """

        results = self._run_tracking(image)

        result = results[0]

        tracks = []

        if result.boxes is not None:
            for box in result.boxes:

                if box.id is None:
                    continue

                track_id = int(box.id[0])
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                x1, y1, x2, y2 = (
                    box.xyxy[0].tolist()
                )

                label = self.model.names[class_id]

                tracks.append(
                    {
                        "track_id": track_id,
                        "label": label,
                        "confidence": round(
                            confidence,
                            4,
                        ),
                        "box": {
                            "x1": round(x1, 2),
                            "y1": round(y1, 2),
                            "x2": round(x2, 2),
                            "y2": round(y2, 2),
                        },
                    }
                )

        return {
            "tracks": tracks,
        }

    # ============================================================
    # DETECTION + ANNOTATED IMAGE
    # ============================================================

    def detect_and_annotate(self, image: Image.Image):
        """
        Detect objects and return an annotated PIL image.

        The returned image contains:
        - Bounding boxes
        - Object labels
        - Confidence scores
        """

        results = self._run_inference(image)

        result = results[0]

        annotated_array = result.plot()

        annotated_image = Image.fromarray(
            annotated_array[..., ::-1]
        )

        return annotated_image


# ============================================================
# SINGLE REUSABLE SERVICE INSTANCE
# ============================================================

detection_service = DetectionService()