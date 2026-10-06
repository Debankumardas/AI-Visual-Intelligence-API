import threading
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.routes import video as video_route
from app.auth.dependencies import get_current_user
from app.main import app


def test_long_video_analysis_does_not_block_other_requests(
    monkeypatch,
):
    analysis_started = threading.Event()
    release_analysis = threading.Event()
    analysis_finished = threading.Event()

    def slow_analyze(video_path):
        analysis_started.set()

        # Blocks this worker thread, as real inference would.
        release_analysis.wait(timeout=5)
        analysis_finished.set()

        raise ValueError("stop after the check")

    monkeypatch.setattr(
        video_route.video_processing_service,
        "analyze_video",
        slow_analyze,
    )

    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=1,
        is_active=True,
    )

    responses = {}

    with TestClient(app) as client:

        def upload_video():
            responses["video"] = client.post(
                "/api/v1/video/analyze",
                files={
                    "file": (
                        "clip.mp4",
                        b"fake video bytes",
                        "video/mp4",
                    )
                },
            )

        worker = threading.Thread(target=upload_video)
        worker.start()

        try:
            assert analysis_started.wait(timeout=10)

            # The event loop must still serve requests while the
            # analysis is running in the threadpool.
            health = client.get("/health")

            assert health.status_code == 200
            assert not analysis_finished.is_set()

        finally:
            release_analysis.set()
            worker.join(timeout=10)

    assert responses["video"].status_code == 400


def test_predict_declares_its_response_model():
    schema = app.openapi()

    response_schema = schema["paths"]["/api/v1/predict"]["post"][
        "responses"
    ]["200"]["content"]["application/json"]["schema"]

    assert response_schema == {
        "$ref": "#/components/schemas/PredictionResponse"
    }
