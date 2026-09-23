import asyncio
import os
from io import BytesIO

import pytest
from fastapi import UploadFile

from app.api.routes.utils import load_uploaded_video
from app.core.exceptions import (
    InvalidVideoError,
    VideoTooLargeError,
)


def create_video_upload(
    content=b"fake-video-data",
    filename="test.mp4",
    content_type="video/mp4",
):
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers={
            "content-type": content_type,
        },
    )


def test_load_uploaded_video_success():
    file = create_video_upload()

    path = asyncio.run(
        load_uploaded_video(file)
    )

    try:
        assert os.path.exists(path)

        with open(path, "rb") as video_file:
            assert video_file.read() == b"fake-video-data"

    finally:
        if os.path.exists(path):
            os.remove(path)


def test_load_uploaded_video_unsupported_format():
    file = create_video_upload(
        filename="test.txt",
        content_type="text/plain",
    )

    with pytest.raises(
        InvalidVideoError,
        match="Unsupported video format",
    ):
        asyncio.run(
            load_uploaded_video(file)
        )


def test_load_uploaded_video_empty():
    file = create_video_upload(
        content=b"",
    )

    with pytest.raises(
        InvalidVideoError,
        match="Uploaded video is empty",
    ):
        asyncio.run(
            load_uploaded_video(file)
        )


def test_load_uploaded_video_too_large(monkeypatch):
    file = create_video_upload(
        content=b"x" * 100,
    )

    class MockSettings:
        video_allowed_content_types = (
            "video/mp4",
            "video/avi",
            "video/quicktime",
            "video/x-msvideo",
        )
        video_max_file_size = 50

    monkeypatch.setattr(
        "app.api.routes.utils.settings",
        MockSettings(),
    )

    with pytest.raises(
        VideoTooLargeError,
        match="Video file is too large",
    ):
        asyncio.run(
            load_uploaded_video(file)
        )

def test_load_uploaded_video_write_failure(monkeypatch):
    class MockTempFile:
        name = "fake_video.mp4"

        def write(self, contents):
            raise OSError("Write failed")

        def close(self):
            pass

    mock_temp_file = MockTempFile()

    monkeypatch.setattr(
        "app.api.routes.utils.tempfile.NamedTemporaryFile",
        lambda delete, suffix: mock_temp_file,
    )

    monkeypatch.setattr(
        "app.api.routes.utils.os.path.exists",
        lambda path: True,
    )

    remove_mock = lambda path: None

    monkeypatch.setattr(
        "app.api.routes.utils.os.remove",
        remove_mock,
    )

    file = create_video_upload()

    with pytest.raises(
        OSError,
        match="Write failed",
    ):
        asyncio.run(
            load_uploaded_video(file)
        )