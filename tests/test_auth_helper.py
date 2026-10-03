from fastapi.testclient import TestClient

from app.main import app


def get_authenticated_client():
    return TestClient(app)
