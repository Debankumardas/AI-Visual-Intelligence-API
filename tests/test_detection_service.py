from PIL import Image

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
            return MockTensor(self.values[index])

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