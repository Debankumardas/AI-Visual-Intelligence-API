from PIL import Image
import numpy as np

from app.services.detection_service import detection_service
from app.services.detection_service import DetectionService


def create_test_image():
    return Image.new(
        "RGB",
        (100, 100),
        "white",
    )


# ============================================================
# OBJECT DETECTION TESTS
# ============================================================


def test_detect_returns_detections(monkeypatch):
    image = create_test_image()

    class MockTensor:
        def __init__(self, values):
            self.values = values

        def tolist(self):
            return self.values

    class MockXYXY:
        def __init__(self, values):
            self.values = values

        def __getitem__(self, index):
            return MockTensor(
                self.values[index]
            )

    class MockBox:
        cls = [0]
        conf = [0.95]

        xyxy = MockXYXY(
            [
                [
                    10.0,
                    20.0,
                    80.0,
                    90.0,
                ]
            ]
        )

    class MockResult:
        boxes = [MockBox()]

    class MockModel:
        names = {
            0: "person",
        }

        def predict(
            self,
            source,
            device,
            conf,
            iou,
            imgsz,
            verbose,
        ):
            return [MockResult()]

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    monkeypatch.setattr(
        detection_service,
        "device",
        "cpu",
    )

    result = detection_service.detect(image)

    assert len(result["detections"]) == 1

    detection = result["detections"][0]

    assert detection["label"] == "person"
    assert detection["confidence"] == 0.95

    assert detection["box"]["x1"] == 10.0
    assert detection["box"]["y1"] == 20.0
    assert detection["box"]["x2"] == 80.0
    assert detection["box"]["y2"] == 90.0

    assert result["inference_time_ms"] >= 0


def test_detect_returns_empty_when_no_boxes(monkeypatch):
    image = create_test_image()

    class MockResult:
        boxes = None

    class MockModel:
        names = {}

        def predict(
            self,
            source,
            device,
            conf,
            iou,
            imgsz,
            verbose,
        ):
            return [MockResult()]

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    monkeypatch.setattr(
        detection_service,
        "device",
        "cpu",
    )

    result = detection_service.detect(image)

    assert result["detections"] == []
    assert result["inference_time_ms"] >= 0


def test_detect_converts_image_to_rgb(monkeypatch):
    image = Image.new(
        "L",
        (100, 100),
        255,
    )

    captured = {}

    class MockResult:
        boxes = None

    class MockModel:
        names = {}

        def predict(
            self,
            source,
            device,
            conf,
            iou,
            imgsz,
            verbose,
        ):
            captured["mode"] = source.mode
            return [MockResult()]

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    monkeypatch.setattr(
        detection_service,
        "device",
        "cpu",
    )

    detection_service.detect(image)

    assert captured["mode"] == "RGB"


# ============================================================
# ANNOTATED IMAGE TESTS
# ============================================================


def test_detect_and_annotate_returns_rgb_image(
    monkeypatch,
):
    image = create_test_image()

    class MockResult:
        def plot(self):
            return np.zeros(
                (100, 100, 3),
                dtype=np.uint8,
            )

    class MockModel:
        def predict(
            self,
            source,
            device,
            conf,
            iou,
            imgsz,
            verbose,
        ):
            return [MockResult()]

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    monkeypatch.setattr(
        detection_service,
        "device",
        "cpu",
    )

    result = detection_service.detect_and_annotate(
        image
    )

    assert isinstance(
        result,
        Image.Image,
    )

    assert result.mode == "RGB"
    assert result.size == (100, 100)


def test_detect_and_annotate_converts_image_to_rgb(
    monkeypatch,
):
    image = Image.new(
        "L",
        (100, 100),
        255,
    )

    captured = {}

    class MockResult:
        def plot(self):
            return np.zeros(
                (100, 100, 3),
                dtype=np.uint8,
            )

    class MockModel:
        def predict(
            self,
            source,
            device,
            conf,
            iou,
            imgsz,
            verbose,
        ):
            captured["mode"] = source.mode

            return [MockResult()]

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    monkeypatch.setattr(
        detection_service,
        "device",
        "cpu",
    )

    result = detection_service.detect_and_annotate(
        image
    )

    assert captured["mode"] == "RGB"

    assert isinstance(
        result,
        Image.Image,
    )

    assert result.mode == "RGB"


# ============================================================
# DETECTION CONFIGURATION TEST
# ============================================================


def test_detection_uses_configured_inference_settings(
    monkeypatch,
):
    image = create_test_image()

    captured = {}

    class MockResult:
        boxes = None

    class MockModel:
        names = {}

        def predict(
            self,
            source,
            device,
            conf,
            iou,
            imgsz,
            verbose,
        ):
            captured["device"] = device
            captured["conf"] = conf
            captured["iou"] = iou
            captured["imgsz"] = imgsz
            captured["verbose"] = verbose

            return [MockResult()]

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    monkeypatch.setattr(
        detection_service,
        "device",
        "cpu",
    )

    detection_service.detect(image)

    assert captured["device"] == "cpu"
    assert captured["conf"] == 0.25
    assert captured["iou"] == 0.45
    assert captured["imgsz"] == 640
    assert captured["verbose"] is False


# ============================================================
# OBJECT COUNTING TESTS
# ============================================================


def test_count_objects_returns_counts(
    monkeypatch,
):
    image = create_test_image()

    class MockBox:
        def __init__(self, class_id):
            self.cls = [class_id]

    class MockBoxes:
        def __iter__(self):
            return iter(
                [
                    MockBox(0),
                    MockBox(0),
                    MockBox(1),
                ]
            )

    class MockResult:
        boxes = MockBoxes()

    class MockModel:
        names = {
            0: "person",
            1: "car",
        }

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    monkeypatch.setattr(
        detection_service,
        "_run_inference",
        lambda image: [MockResult()],
    )

    result = detection_service.count_objects(image)

    assert result["total_objects"] == 3

    assert result["counts"] == [
        {
            "label": "car",
            "count": 1,
        },
        {
            "label": "person",
            "count": 2,
        },
    ]


def test_count_objects_handles_no_detections(
    monkeypatch,
):
    image = create_test_image()

    class MockResult:
        boxes = None

    monkeypatch.setattr(
        detection_service,
        "_run_inference",
        lambda image: [MockResult()],
    )

    result = detection_service.count_objects(image)

    assert result["total_objects"] == 0
    assert result["counts"] == []


# ============================================================
# OBJECT TRACKING TESTS
# ============================================================


def test_run_tracking_uses_configured_tracking_settings(
    monkeypatch,
):
    image = create_test_image()

    captured = {}

    class MockModel:
        def track(
            self,
            source,
            device,
            conf,
            iou,
            imgsz,
            persist,
            verbose,
        ):
            captured["mode"] = source.mode
            captured["device"] = device
            captured["conf"] = conf
            captured["iou"] = iou
            captured["imgsz"] = imgsz
            captured["persist"] = persist
            captured["verbose"] = verbose

            return []

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    result = detection_service._run_tracking(
        image
    )

    assert result == []

    assert captured["mode"] == "RGB"
    assert captured["device"] == "cpu"
    assert captured["conf"] == 0.25
    assert captured["iou"] == 0.45
    assert captured["imgsz"] == 640
    assert captured["persist"] is True
    assert captured["verbose"] is False


def test_track_success(monkeypatch):
    image = create_test_image()

    class MockTensor:
        def __init__(self, values):
            self.values = values

        def tolist(self):
            return self.values

    class MockXYXY:
        def __getitem__(self, index):
            return MockTensor(
                [
                    10.0,
                    20.0,
                    100.0,
                    200.0,
                ]
            )

    class FakeBox:
        def __init__(self):
            self.id = [1]
            self.cls = [0]
            self.conf = [0.92]
            self.xyxy = MockXYXY()

    class FakeResult:
        boxes = [FakeBox()]

    def fake_tracking(image):
        return [FakeResult()]

    class MockModel:
        names = {
            0: "person",
        }

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    monkeypatch.setattr(
        detection_service,
        "_run_tracking",
        fake_tracking,
    )

    result = detection_service.track(image)

    assert len(result["tracks"]) == 1

    track = result["tracks"][0]

    assert track["track_id"] == 1
    assert track["label"] == "person"
    assert track["confidence"] == 0.92

    assert track["box"]["x1"] == 10.0
    assert track["box"]["y1"] == 20.0
    assert track["box"]["x2"] == 100.0
    assert track["box"]["y2"] == 200.0


def test_track_without_track_id(monkeypatch):
    image = create_test_image()

    class FakeBox:
        def __init__(self):
            self.id = None
            self.cls = [0]
            self.conf = [0.92]

    class FakeResult:
        boxes = [FakeBox()]

    def fake_tracking(image):
        return [FakeResult()]

    class MockModel:
        names = {
            0: "person",
        }

    monkeypatch.setattr(
        detection_service,
        "model",
        MockModel(),
    )

    monkeypatch.setattr(
        detection_service,
        "_run_tracking",
        fake_tracking,
    )

    result = detection_service.track(image)

    assert result["tracks"] == []


# ============================================================
# IMAGE SEGMENTATION TESTS
# ============================================================


def test_segment_success(monkeypatch):
    class MockBox:
        cls = [0]
        conf = [0.95]

        class XYXY:
            def __getitem__(self, index):
                class Tensor:
                    def tolist(self):
                        return [
                            10.0,
                            20.0,
                            100.0,
                            200.0,
                        ]

                return Tensor()

        xyxy = XYXY()

    class MockMask:
        xy = [
            [
                [10.0, 20.0],
                [100.0, 20.0],
                [100.0, 200.0],
                [10.0, 200.0],
            ]
        ]

    class MockResult:
        boxes = [MockBox()]
        masks = MockMask()

    class MockModel:
        names = {
            0: "person",
        }

        def predict(self, **kwargs):
            return [MockResult()]

    monkeypatch.setattr(
        "app.services.detection_service.YOLO",
        lambda *args, **kwargs: MockModel(),
    )

    service = DetectionService()

    image = Image.new(
        "RGB",
        (200, 200),
    )

    result = service.segment(image)

    assert len(result["segmentations"]) == 1

    segmentation = result["segmentations"][0]

    assert segmentation["label"] == "person"
    assert segmentation["confidence"] == 0.95

    assert segmentation["box"] == {
        "x1": 10.0,
        "y1": 20.0,
        "x2": 100.0,
        "y2": 200.0,
    }

    assert segmentation["mask"] == [
        [10.0, 20.0],
        [100.0, 20.0],
        [100.0, 200.0],
        [10.0, 200.0],
    ]


def test_segment_without_boxes_or_masks(monkeypatch):
    class MockResult:
        boxes = None
        masks = None

    class MockModel:
        def predict(self, **kwargs):
            return [MockResult()]

    monkeypatch.setattr(
        "app.services.detection_service.YOLO",
        lambda *args, **kwargs: MockModel(),
    )

    service = DetectionService()

    image = Image.new(
        "RGB",
        (200, 200),
    )

    result = service.segment(image)

    assert result == {
        "segmentations": []
    }


# ============================================================
# OCR TESTS
# ============================================================


def test_ocr_success(monkeypatch):
    image = create_test_image()

    class MockPytesseract:
        class Output:
            DICT = "dict"

        def image_to_data(
            self,
            image,
            lang,
            output_type,
        ):
            return {
                "text": [
                    "Hello",
                    "",
                    "World",
                ],
                "conf": [
                    "95",
                    "-1",
                    "88",
                ],
                "left": [
                    10,
                    0,
                    100,
                ],
                "top": [
                    20,
                    0,
                    40,
                ],
                "width": [
                    50,
                    0,
                    60,
                ],
                "height": [
                    20,
                    0,
                    25,
                ],
            }

    monkeypatch.setattr(
        "app.services.detection_service.pytesseract",
        MockPytesseract(),
    )

    result = detection_service.ocr(image)

    assert len(result["results"]) == 2

    assert result["results"][0] == {
        "text": "Hello",
        "confidence": 0.95,
        "box": {
            "x1": 10.0,
            "y1": 20.0,
            "x2": 60.0,
            "y2": 40.0,
        },
    }

    assert result["results"][1] == {
        "text": "World",
        "confidence": 0.88,
        "box": {
            "x1": 100.0,
            "y1": 40.0,
            "x2": 160.0,
            "y2": 65.0,
        },
    }


def test_ocr_filters_low_confidence_text(monkeypatch):
    image = create_test_image()

    class MockPytesseract:
        class Output:
            DICT = "dict"

        def image_to_data(
            self,
            image,
            lang,
            output_type,
        ):
            return {
                "text": [
                    "Good",
                    "Bad",
                ],
                "conf": [
                    "90",
                    "20",
                ],
                "left": [
                    10,
                    50,
                ],
                "top": [
                    20,
                    40,
                ],
                "width": [
                    50,
                    40,
                ],
                "height": [
                    20,
                    20,
                ],
            }

    monkeypatch.setattr(
        "app.services.detection_service.pytesseract",
        MockPytesseract(),
    )

    class MockSettings:
        ocr_language = "eng"
        ocr_confidence = 0.5

    monkeypatch.setattr(
        "app.services.detection_service.settings",
        MockSettings(),
    )

    result = detection_service.ocr(image)

    assert len(result["results"]) == 1
    assert result["results"][0]["text"] == "Good"


def test_ocr_converts_image_to_rgb(monkeypatch):
    image = Image.new(
        "L",
        (100, 100),
        255,
    )

    captured = {}

    class MockPytesseract:
        class Output:
            DICT = "dict"

        def image_to_data(
            self,
            image,
            lang,
            output_type,
        ):
            captured["mode"] = image.mode

            return {
                "text": [],
                "conf": [],
                "left": [],
                "top": [],
                "width": [],
                "height": [],
            }

    monkeypatch.setattr(
        "app.services.detection_service.pytesseract",
        MockPytesseract(),
    )

    result = detection_service.ocr(image)

    assert captured["mode"] == "RGB"
    assert result["results"] == []