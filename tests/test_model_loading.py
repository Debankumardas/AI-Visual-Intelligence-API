from types import SimpleNamespace

import pytest
import torch
from fastapi.testclient import TestClient
from PIL import Image

import app.main as main_module
from app.main import app
from app.services import detection_service as detection_module
from app.services.detection_service import DetectionService
from app.services.detection_service import detection_service
from app.services import model_service as model_service_module
from app.services.model_service import ImagePredictionModel
from app.services.model_service import model_service


# ============================================================
# LAZY LOADING
# ============================================================


def test_detection_service_does_not_load_model_on_init(monkeypatch):
    def fail_if_called(*args, **kwargs):
        raise AssertionError("YOLO must not be loaded on init")

    monkeypatch.setattr(detection_module, "YOLO", fail_if_called)

    service = DetectionService()

    assert service.model is None
    assert service.load_error is None


def test_detection_service_load_is_idempotent(monkeypatch):
    created = []

    def fake_yolo(path):
        created.append(path)
        return object()

    monkeypatch.setattr(detection_module, "YOLO", fake_yolo)

    service = DetectionService()

    first = service.load()
    second = service.load()

    assert first is second
    assert len(created) == 1


def test_detection_service_records_load_error(monkeypatch):
    def broken_yolo(path):
        raise FileNotFoundError("weights missing")

    monkeypatch.setattr(detection_module, "YOLO", broken_yolo)

    service = DetectionService()

    with pytest.raises(FileNotFoundError):
        service.load()

    assert service.model is None
    assert service.load_error == "weights missing"


def test_segmentation_model_is_loaded_once(monkeypatch):
    created = []

    class MockSegModel:
        names = {}

        def predict(self, **kwargs):
            return [SimpleNamespace(boxes=None, masks=None)]

    def fake_yolo(path):
        created.append(path)
        return MockSegModel()

    monkeypatch.setattr(detection_module, "YOLO", fake_yolo)

    service = DetectionService()
    image = Image.new("RGB", (32, 32), "white")

    service.segment(image)
    service.segment(image)

    assert created == [detection_module.settings.yolo_seg_model_path]


def test_model_service_does_not_load_weights_on_init():
    service = ImagePredictionModel()

    assert service.model is None
    assert service.preprocess is None
    assert service.categories == []
    assert service.is_ready is False


# ============================================================
# TRACKING SESSIONS
# ============================================================


class FakeTracker:
    def __init__(self):
        self.reset_calls = 0

    def reset(self):
        self.reset_calls += 1


def test_tracking_session_resets_existing_trackers(monkeypatch):
    tracker = FakeTracker()

    model = SimpleNamespace(
        predictor=SimpleNamespace(trackers=[tracker]),
    )

    monkeypatch.setattr(detection_service, "model", model)

    with detection_service.tracking_session():
        assert tracker.reset_calls == 1

    with detection_service.tracking_session():
        assert tracker.reset_calls == 2


def test_reset_tracker_without_predictor_is_safe(monkeypatch):
    monkeypatch.setattr(detection_service, "model", None)

    detection_service.reset_tracker()

    monkeypatch.setattr(
        detection_service,
        "model",
        SimpleNamespace(predictor=None),
    )

    detection_service.reset_tracker()


def test_track_image_uses_a_fresh_tracking_session(monkeypatch):
    tracker = FakeTracker()

    model = SimpleNamespace(
        predictor=SimpleNamespace(trackers=[tracker]),
    )

    monkeypatch.setattr(detection_service, "model", model)

    def fake_track(image):
        assert tracker.reset_calls == 1
        return {"tracks": [], "detections": []}

    monkeypatch.setattr(detection_service, "track", fake_track)

    result = detection_service.track_image(
        Image.new("RGB", (32, 32), "white")
    )

    assert result == {"tracks": [], "detections": []}


# ============================================================
# READINESS AND STARTUP
# ============================================================


def test_readiness_reports_load_errors(monkeypatch):
    monkeypatch.setattr(detection_service, "model", None)
    monkeypatch.setattr(
        detection_service,
        "load_error",
        "weights missing",
    )
    monkeypatch.setattr(model_service, "model", None)
    monkeypatch.setattr(model_service, "load_error", None)

    response = TestClient(app).get("/health/ready")

    assert response.status_code == 503

    data = response.json()

    assert data["status"] == "not_ready"
    assert data["errors"] == {
        "object_detection": "weights missing",
    }


def test_startup_skips_model_loading_when_disabled(monkeypatch):
    def fail_if_called():
        raise AssertionError("models must not load")

    monkeypatch.setattr(
        main_module,
        "settings",
        SimpleNamespace(preload_models=False),
    )
    monkeypatch.setattr(detection_service, "load", fail_if_called)
    monkeypatch.setattr(model_service, "load", fail_if_called)

    with TestClient(app) as client:
        assert client.get("/health").status_code == 200


def test_startup_survives_model_load_failure(monkeypatch):
    calls = []

    def broken_load():
        calls.append("detection")
        raise RuntimeError("no weights")

    def working_load():
        calls.append("classification")

    monkeypatch.setattr(
        main_module,
        "settings",
        SimpleNamespace(preload_models=True),
    )
    monkeypatch.setattr(detection_service, "load", broken_load)
    monkeypatch.setattr(model_service, "load", working_load)

    with TestClient(app) as client:
        assert client.get("/health").status_code == 200

    assert calls == ["detection", "classification"]


# ============================================================
# LOCAL MODEL FILES
# ============================================================


def test_missing_yolo_file_fails_without_calling_yolo(
    monkeypatch,
    tmp_path,
):
    missing = tmp_path / "yolov8s.pt"

    def fail_if_called(*args, **kwargs):
        raise AssertionError("YOLO must not be called")

    monkeypatch.setattr(detection_module, "YOLO", fail_if_called)
    monkeypatch.setattr(
        detection_module,
        "settings",
        SimpleNamespace(
            yolo_model_path=str(missing),
            detection_device="cpu",
        ),
    )

    service = DetectionService()

    with pytest.raises(FileNotFoundError, match="Model file not found"):
        service.load()

    assert service.model is None
    assert "yolov8s.pt" in service.load_error
    assert "download_models" in service.load_error


def test_missing_segmentation_file_fails_without_calling_yolo(
    monkeypatch,
    tmp_path,
):
    def fail_if_called(*args, **kwargs):
        raise AssertionError("YOLO must not be called")

    monkeypatch.setattr(detection_module, "YOLO", fail_if_called)
    monkeypatch.setattr(
        detection_module,
        "settings",
        SimpleNamespace(
            yolo_seg_model_path=str(tmp_path / "yolov8s-seg.pt"),
            detection_device="cpu",
        ),
    )

    service = DetectionService()

    with pytest.raises(FileNotFoundError, match="Model file not found"):
        service.segment(Image.new("RGB", (16, 16), "white"))


def test_missing_classifier_file_sets_load_error(
    monkeypatch,
    tmp_path,
):
    monkeypatch.setattr(
        model_service_module,
        "settings",
        SimpleNamespace(
            classifier_weights_path=str(tmp_path / "missing.pth"),
        ),
    )

    def fail_if_called(*args, **kwargs):
        raise AssertionError("weights must not be downloaded")

    monkeypatch.setattr(
        model_service_module,
        "efficientnet_b0",
        lambda weights=None: torch.nn.Linear(1, 1),
    )
    monkeypatch.setattr(torch.hub, "load_state_dict_from_url", fail_if_called)

    service = ImagePredictionModel()

    with pytest.raises(FileNotFoundError, match="Model file not found"):
        service.load()

    assert service.model is None
    assert "missing.pth" in service.load_error


def test_classifier_loads_state_dict_from_local_file(
    monkeypatch,
    tmp_path,
):
    weights_file = tmp_path / "classifier.pth"
    weights_file.write_bytes(b"placeholder")

    loaded = {}

    class FakeNetwork(torch.nn.Module):
        def load_state_dict(self, state_dict, *args, **kwargs):
            loaded["state_dict"] = state_dict

    def fake_efficientnet(weights=None):
        loaded["weights_arg"] = weights
        return FakeNetwork()

    def fake_torch_load(path, **kwargs):
        loaded["path"] = path
        loaded["kwargs"] = kwargs
        return {"layer.weight": 1}

    monkeypatch.setattr(
        model_service_module,
        "settings",
        SimpleNamespace(classifier_weights_path=str(weights_file)),
    )
    monkeypatch.setattr(
        model_service_module,
        "efficientnet_b0",
        fake_efficientnet,
    )
    monkeypatch.setattr(torch, "load", fake_torch_load)

    service = ImagePredictionModel()
    service.load()

    # No pretrained download: the network is built empty and filled
    # from the local file.
    assert loaded["weights_arg"] is None
    assert loaded["path"] == str(weights_file)
    assert loaded["kwargs"]["weights_only"] is True
    assert loaded["state_dict"] == {"layer.weight": 1}
    assert service.is_ready is True
