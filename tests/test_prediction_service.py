import torch
from PIL import Image

from app.services import prediction_service


def create_test_image():
    return Image.new(
        "RGB",
        (100, 100),
        "white",
    )


def test_predict_image_returns_predictions(monkeypatch):
    image = create_test_image()

    class MockModelService:
        device = torch.device("cpu")
        categories = [
            "cat",
            "dog",
            "bird",
        ]

        def preprocess(self, image):
            return torch.zeros(3, 224, 224)

        def model(self, input_batch):
            return torch.tensor(
                [[2.0, 1.0, 0.5]]
            )

    mock_service = MockModelService()

    monkeypatch.setattr(
        prediction_service,
        "model_service",
        mock_service,
    )

    result = prediction_service.predict_image(
        image,
        top_k=2,
    )

    assert "predictions" in result
    assert "inference_time_ms" in result

    assert len(result["predictions"]) == 2

    assert result["predictions"][0]["label"] == "cat"
    assert result["predictions"][1]["label"] == "dog"

    assert 0 <= result["predictions"][0]["confidence"] <= 1
    assert 0 <= result["predictions"][1]["confidence"] <= 1

    assert result["inference_time_ms"] >= 0


def test_predict_image_respects_top_k(monkeypatch):
    image = create_test_image()

    class MockModelService:
        device = torch.device("cpu")
        categories = [
            "cat",
            "dog",
            "bird",
            "horse",
        ]

        def preprocess(self, image):
            return torch.zeros(3, 224, 224)

        def model(self, input_batch):
            return torch.tensor(
                [[4.0, 3.0, 2.0, 1.0]]
            )

    monkeypatch.setattr(
        prediction_service,
        "model_service",
        MockModelService(),
    )

    result = prediction_service.predict_image(
        image,
        top_k=3,
    )

    assert len(result["predictions"]) == 3

    labels = [
        prediction["label"]
        for prediction in result["predictions"]
    ]

    assert labels == [
        "cat",
        "dog",
        "bird",
    ]


def test_predict_image_limits_top_k_to_available_categories(
    monkeypatch,
):
    image = create_test_image()

    class MockModelService:
        device = torch.device("cpu")
        categories = [
            "cat",
            "dog",
        ]

        def preprocess(self, image):
            return torch.zeros(3, 224, 224)

        def model(self, input_batch):
            return torch.tensor(
                [[2.0, 1.0]]
            )

    monkeypatch.setattr(
        prediction_service,
        "model_service",
        MockModelService(),
    )

    result = prediction_service.predict_image(
        image,
        top_k=5,
    )

    assert len(result["predictions"]) == 2


def test_predict_image_converts_image_to_rgb(monkeypatch):
    image = Image.new(
        "L",
        (100, 100),
        255,
    )

    captured = {}

    class MockModelService:
        device = torch.device("cpu")
        categories = ["white"]

        def preprocess(self, image):
            captured["mode"] = image.mode
            return torch.zeros(3, 224, 224)

        def model(self, input_batch):
            return torch.tensor(
                [[1.0]]
            )

    monkeypatch.setattr(
        prediction_service,
        "model_service",
        MockModelService(),
    )

    result = prediction_service.predict_image(
        image
    )

    assert captured["mode"] == "RGB"
    assert len(result["predictions"]) == 1