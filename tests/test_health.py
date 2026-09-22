from fastapi.testclient import TestClient

from app.main import app
from app.services.detection_service import detection_service
from app.services.model_service import model_service


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["service"] == "AI Visual Intelligence API"


def test_health_returns_request_id():
    response = client.get("/health")

    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Request-ID"]


def test_readiness_when_models_are_ready(monkeypatch):
    monkeypatch.setattr(
        detection_service,
        "model",
        object(),
    )

    monkeypatch.setattr(
        model_service,
        "model",
        object(),
    )

    monkeypatch.setattr(
        model_service,
        "preprocess",
        object(),
    )

    monkeypatch.setattr(
        model_service,
        "categories",
        ["cat", "dog"],
    )

    response = client.get("/health/ready")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ready"
    assert data["models"]["object_detection"] == "ready"
    assert data["models"]["image_classification"] == "ready"


def test_readiness_when_detection_model_is_not_ready(monkeypatch):
    monkeypatch.setattr(
        detection_service,
        "model",
        None,
    )

    monkeypatch.setattr(
        model_service,
        "model",
        object(),
    )

    monkeypatch.setattr(
        model_service,
        "preprocess",
        object(),
    )

    monkeypatch.setattr(
        model_service,
        "categories",
        ["cat", "dog"],
    )

    response = client.get("/health/ready")

    assert response.status_code == 503

    data = response.json()

    assert data["status"] == "not_ready"
    assert data["models"]["object_detection"] == "not_ready"
    assert data["models"]["image_classification"] == "ready"


def test_readiness_when_classification_model_is_not_ready(monkeypatch):
    monkeypatch.setattr(
        detection_service,
        "model",
        object(),
    )

    monkeypatch.setattr(
        model_service,
        "model",
        None,
    )

    monkeypatch.setattr(
        model_service,
        "preprocess",
        object(),
    )

    monkeypatch.setattr(
        model_service,
        "categories",
        ["cat", "dog"],
    )

    response = client.get("/health/ready")

    assert response.status_code == 503

    data = response.json()

    assert data["status"] == "not_ready"
    assert data["models"]["object_detection"] == "ready"
    assert data["models"]["image_classification"] == "not_ready"

def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "AI Visual Intelligence API is running"
    assert data["status"] == "healthy"
    assert data["version"]
    assert data["docs"] == "/docs"