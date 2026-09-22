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