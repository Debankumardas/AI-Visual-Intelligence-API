import cv2
import numpy as np
import pytest

from app.services.video_writer_service import VideoWriterService


@pytest.fixture
def service():
    return VideoWriterService()


def test_create_writer_success(service, tmp_path):
    output_path = str(tmp_path / "output.mp4")

    writer = service.create_writer(
        output_path=output_path,
        fps=30,
        width=640,
        height=480,
    )

    assert writer.isOpened()

    service.release(writer)


def test_create_writer_rejects_invalid_fps(service, tmp_path):
    output_path = str(tmp_path / "output.mp4")

    with pytest.raises(ValueError, match="FPS"):
        service.create_writer(
            output_path=output_path,
            fps=0,
            width=640,
            height=480,
        )


def test_create_writer_rejects_invalid_dimensions(service, tmp_path):
    output_path = str(tmp_path / "output.mp4")

    with pytest.raises(ValueError, match="dimensions"):
        service.create_writer(
            output_path=output_path,
            fps=30,
            width=0,
            height=480,
        )


def test_write_frame(service, tmp_path):
    output_path = str(tmp_path / "output.mp4")

    writer = service.create_writer(
        output_path=output_path,
        fps=30,
        width=640,
        height=480,
    )

    frame = np.zeros((480, 640, 3), dtype=np.uint8)

    service.write_frame(writer, frame)
    service.release(writer)

    assert output_path
    assert cv2.VideoCapture(output_path).isOpened()


def test_write_frame_rejects_none(service, tmp_path):
    output_path = str(tmp_path / "output.mp4")

    writer = service.create_writer(
        output_path=output_path,
        fps=30,
        width=640,
        height=480,
    )

    with pytest.raises(ValueError, match="Frame"):
        service.write_frame(writer, None)

    service.release(writer)


def test_release_handles_none(service):
    service.release(None)

def test_create_writer_rejects_unopened_writer(service, tmp_path, monkeypatch):
    output_path = str(tmp_path / "output.mp4")

    class FakeWriter:
        def isOpened(self):
            return False

        def release(self):
            pass

    monkeypatch.setattr(
        cv2,
        "VideoWriter",
        lambda *args, **kwargs: FakeWriter(),
    )

    with pytest.raises(ValueError, match="Unable to create video writer"):
        service.create_writer(
            output_path=output_path,
            fps=30,
            width=640,
            height=480,
        )