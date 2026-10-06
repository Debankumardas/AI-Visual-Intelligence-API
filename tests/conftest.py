import os
from types import SimpleNamespace

# Configure the environment before the application is imported:
# never load real model weights during tests, and provide a JWT
# secret so a bare local `pytest` works without a .env file.
os.environ.setdefault("PRELOAD_MODELS", "false")
os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-only-jwt-secret-do-not-use-in-production",
)

import pytest  # noqa: E402

from app.auth.dependencies import get_current_user  # noqa: E402
from app.main import app  # noqa: E402


PROTECTED_TEST_MODULES = {
    "test_analysis",
    "test_detection",
    "test_errors",
    "test_prediction",
    "test_video",
}


@pytest.fixture(autouse=True)
def isolate_auth_dependency(request):
    module_name = request.module.__name__.split(".")[-1]

    app.dependency_overrides.pop(get_current_user, None)

    if module_name in PROTECTED_TEST_MODULES:
        fake_user = SimpleNamespace(
            id=1,
            name="Test User",
            email="test@example.com",
            role="Analyst",
            is_active=True,
        )

        app.dependency_overrides[get_current_user] = lambda: fake_user

    yield

    app.dependency_overrides.pop(get_current_user, None)