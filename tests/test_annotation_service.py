import numpy as np
import pytest

from app.services.annotation_service import AnnotationService


@pytest.fixture
def service():
    return AnnotationService()


@pytest.fixture
def frame():
    return np.zeros((480, 640, 3), dtype=np.uint8)


@pytest.fixture
def box():
    return {
        "x1": 100,
        "y1": 100,
        "x2": 300,
        "y2": 300,
    }


def test_draw_detection(service, frame, box):
    result = service.draw_detection(
        frame=frame,
        box=box,
        label="person",
        confidence=0.95,
    )

    assert result is frame
    assert np.any(result != 0)


def test_draw_track(service, frame, box):
    result = service.draw_track(
        frame=frame,
        box=box,
        label="person",
        confidence=0.91,
        track_id=7,
    )

    assert result is frame
    assert np.any(result != 0)


def test_draw_detection_rejects_none_frame(service, box):
    with pytest.raises(ValueError, match="Frame"):
        service.draw_detection(
            frame=None,
            box=box,
            label="person",
            confidence=0.95,
        )


def test_draw_track_rejects_none_frame(service, box):
    with pytest.raises(ValueError, match="Frame"):
        service.draw_track(
            frame=None,
            box=box,
            label="person",
            confidence=0.91,
            track_id=7,
        )