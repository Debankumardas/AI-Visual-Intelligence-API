import logging
import threading
import time
from contextlib import contextmanager

import pytesseract

from PIL import Image
from ultralytics import YOLO

from app.core.config import settings


logger = logging.getLogger(__name__)


class DetectionService:

    def __init__(self):
        self.device = settings.detection_device

        # Models are loaded lazily (or warmed up by the application
        # lifespan) so importing this module never touches the disk
        # or the network.
        self.model = None
        self._seg_model = None
        self.load_error: str | None = None

        self._load_lock = threading.Lock()

        # Ultralytics models are not thread-safe: predict() and
        # track() share one predictor. Serialize every model call.
        self._inference_lock = threading.Lock()

        # Tracker state lives on the shared predictor, so only one
        # tracking job (a video or a single tracked image) may run
        # at a time.
        self._tracking_session_lock = threading.Lock()

    # ============================================================
    # MODEL LOADING
    # ============================================================

    def load(self):
        """
        Load the YOLO detection model if it is not loaded yet.
        """

        if self.model is not None:
            return self.model

        with self._load_lock:
            if self.model is None:
                logger.info(
                    "Loading YOLO object detection model from %s...",
                    settings.yolo_model_path,
                )

                try:
                    self.model = YOLO(settings.yolo_model_path)
                except Exception as exc:
                    self.load_error = str(exc)
                    logger.exception("Failed to load YOLO model.")
                    raise

                self.load_error = None

                logger.info("YOLO model loaded successfully.")
                logger.info("Device: %s", self.device)

        return self.model

    def _get_model(self):
        if self.model is None:
            return self.load()

        return self.model

    def _get_segmentation_model(self):
        if self._seg_model is None:
            with self._load_lock:
                if self._seg_model is None:
                    logger.info(
                        "Loading YOLO segmentation model from %s...",
                        settings.yolo_seg_model_path,
                    )

                    self._seg_model = YOLO(
                        settings.yolo_seg_model_path
                    )

        return self._seg_model

    # ============================================================
    # TRACKING SESSIONS
    # ============================================================

    def reset_tracker(self):
        """
        Clear tracker state left over from a previous tracking job.

        Resetting also restarts track IDs at 1.
        """

        predictor = getattr(self.model, "predictor", None)
        trackers = getattr(predictor, "trackers", None) or []

        for tracker in trackers:
            tracker.reset()

    @contextmanager
    def tracking_session(self):
        """
        Run a tracking job with exclusive, freshly reset tracker state.
        """

        with self._tracking_session_lock:
            self.reset_tracker()
            yield self

    def track_image(self, image: Image.Image):
        """
        Track objects in a single standalone image.
        """

        with self.tracking_session():
            return self.track(image)

    # ============================================================
    # INTERNAL YOLO INFERENCE
    # ============================================================

    def _run_inference(self, image: Image.Image):
        """
        Run YOLO inference using application configuration.
        """

        image = image.convert("RGB")

        with self._inference_lock:
            return self._get_model().predict(
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

        with self._inference_lock:
            return self._get_model().track(
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
                ],
                "detections": [
                    {
                        "label": str,
                        "confidence": float,
                        "box": {...}
                    }
                ],
                "inference_time_ms": float
            }

        "detections" holds every box in the tracking result: the
        activated tracks, or the raw detections on frames where the
        tracker has not confirmed any track yet (boxes without IDs).
        """

        start_time = time.perf_counter()

        results = self._run_tracking(image)

        tracks = []
        detections = []

        result = results[0] if results else None

        if result is not None and result.boxes is not None:
            for box in result.boxes:

                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                x1, y1, x2, y2 = (
                    box.xyxy[0].tolist()
                )

                label = self.model.names[class_id]

                detection = {
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

                detections.append(detection)

                if box.id is None:
                    continue

                tracks.append(
                    {
                        "track_id": int(box.id[0]),
                        **detection,
                    }
                )

        elapsed_ms = round(
            (time.perf_counter() - start_time) * 1000,
            2,
        )

        logger.info(
            "Tracking completed in %.2f ms",
            elapsed_ms,
        )

        return {
            "tracks": tracks,
            "detections": detections,
            "inference_time_ms": elapsed_ms,
        }

    # ============================================================
    # IMAGE SEGMENTATION
    # ============================================================

    def segment(self, image: Image.Image):
        """
        Segment objects in an image.

        Returns:
            {
                "segmentations": [
                    {
                        "label": str,
                        "confidence": float,
                        "box": {
                            "x1": float,
                            "y1": float,
                            "x2": float,
                            "y2": float
                        },
                        "mask": [
                            [x, y],
                            ...
                        ]
                    }
                ]
            }
        """

        image = image.convert("RGB")

        model = self._get_segmentation_model()

        with self._inference_lock:
            results = model.predict(
                source=image,
                device=settings.segmentation_device,
                conf=settings.segmentation_confidence,
                iou=settings.segmentation_iou,
                imgsz=settings.segmentation_image_size,
                verbose=False,
            )

        result = results[0]

        segmentations = []

        if result.boxes is None or result.masks is None:
            return {
                "segmentations": []
            }

        for box, mask in zip(
            result.boxes,
            result.masks.xy,
        ):
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            label = model.names[class_id]

            polygon = [
                [
                    round(float(point[0]), 2),
                    round(float(point[1]), 2),
                ]
                for point in mask
            ]

            segmentations.append(
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
                    "mask": polygon,
                }
            )

        return {
            "segmentations": segmentations,
        }

    # ============================================================
    # OCR
    # ============================================================

    def ocr(self, image: Image.Image):
        """
        Extract text from an image using Tesseract OCR.

        Returns:
            {
                "results": [
                    {
                        "text": str,
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

        image = image.convert("RGB")

        data = pytesseract.image_to_data(
            image,
            lang=settings.ocr_language,
            output_type=pytesseract.Output.DICT,
        )

        results = []

        for i, text in enumerate(data["text"]):
            text = text.strip()

            if not text:
                continue

            confidence = float(data["conf"][i])

            if confidence < settings.ocr_confidence * 100:
                continue

            x = int(data["left"][i])
            y = int(data["top"][i])
            width = int(data["width"][i])
            height = int(data["height"][i])

            results.append(
                {
                    "text": text,
                    "confidence": round(
                        confidence / 100,
                        4,
                    ),
                    "box": {
                        "x1": float(x),
                        "y1": float(y),
                        "x2": float(x + width),
                        "y2": float(y + height),
                    },
                }
            )

        return {
            "results": results,
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