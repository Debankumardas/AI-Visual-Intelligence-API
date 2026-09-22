from PIL import Image

import numpy as np

from app.services.detection_service import detection_service


def create_test_image():
    return Image.new(
        "RGB",
        (100, 100),
        "white",
    )


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