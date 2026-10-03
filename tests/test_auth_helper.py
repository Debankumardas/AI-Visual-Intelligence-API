from fastapi.testclient import TestClient

from app.auth.security import create_access_token
from app.main import app


def get_authenticated_client():
    token = create_access_token(
        data={
            "sub": "1",
            "email": "test@example.com",
            "role": "user",
        }
    )

    client = TestClient(app)

    client.headers.update(
        {
            "Authorization": f"Bearer {token}",
        }
    )

    return client