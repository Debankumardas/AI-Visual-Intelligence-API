import time

from PIL import Image
from ultralytics import YOLO


class DetectionService:

    def __init__(self):
        print("Loading YOLO object detection model...")

        self.model = YOLO("yolo11n.pt")

        # We are using the CPU version of PyTorch
        self.device = "cpu"

        print("YOLO model loaded successfully.")
        print(f"Device: {self.device}")

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

        # --------------------------------------------------------
        # Start timer
        # --------------------------------------------------------

        start_time = time.perf_counter()

        # --------------------------------------------------------
        # Make sure image is RGB
        # --------------------------------------------------------

        image = image.convert("RGB")

        # --------------------------------------------------------
        # Run YOLO inference
        # --------------------------------------------------------

        results = self.model.predict(
            source=image,
            device=self.device,
            verbose=False,
        )

        # --------------------------------------------------------
        # Store detections
        # --------------------------------------------------------

        detections = []

        result = results[0]

        # --------------------------------------------------------
        # Extract bounding boxes
        # --------------------------------------------------------

        if result.boxes is not None:

            for box in result.boxes:

                # Class ID
                class_id = int(box.cls[0])

                # Confidence
                confidence = float(box.conf[0])

                # Bounding box coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                # Class label
                label = self.model.names[class_id]

                detections.append(
                    {
                        "label": label,
                        "confidence": round(confidence, 4),
                        "box": {
                            "x1": round(x1, 2),
                            "y1": round(y1, 2),
                            "x2": round(x2, 2),
                            "y2": round(y2, 2),
                        },
                    }
                )

        # --------------------------------------------------------
        # Calculate inference time
        # --------------------------------------------------------

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        elapsed_ms = round(elapsed_ms, 2)

        print(
            f"Detection completed in {elapsed_ms:.2f} ms"
        )

        # --------------------------------------------------------
        # Return result
        # --------------------------------------------------------

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

        # --------------------------------------------------------
        # Make sure image is RGB
        # --------------------------------------------------------

        image = image.convert("RGB")

        # --------------------------------------------------------
        # Run YOLO inference
        # --------------------------------------------------------

        results = self.model.predict(
            source=image,
            device=self.device,
            verbose=False,
        )

        result = results[0]

        # --------------------------------------------------------
        # Generate annotated image
        # --------------------------------------------------------

        annotated_array = result.plot()

        # --------------------------------------------------------
        # YOLO returns BGR NumPy array.
        # Convert BGR → RGB.
        # --------------------------------------------------------

        annotated_image = Image.fromarray(
            annotated_array[..., ::-1]
        )

        return annotated_image


# ============================================================
# SINGLE REUSABLE SERVICE INSTANCE
# ============================================================

detection_service = DetectionService()