from types import SimpleNamespace

import pytest

from app.auth.dependencies import get_current_user
from app.main import app


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