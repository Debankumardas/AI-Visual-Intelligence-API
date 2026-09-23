import os
import tempfile
from io import BytesIO

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.exceptions import (
    ImageTooLargeError,
    InvalidImageError,
    InvalidVideoError,
    VideoTooLargeError,
)


async def load_uploaded_image(
    file: UploadFile,
) -> Image.Image:
    """
    Read, validate, and load an uploaded image.
    """

    if file.content_type not in settings.allowed_content_types:
        raise InvalidImageError(
            "Unsupported image format. "
            "Use JPEG, PNG, or WebP."
        )

    contents = await file.read()

    if len(contents) > settings.max_file_size:
        raise ImageTooLargeError(
            "Image file is too large. Maximum size is 10 MB."
        )

    if not contents:
        raise InvalidImageError(
            "Uploaded image is empty."
        )

    try:
        image = Image.open(BytesIO(contents))
        image.load()
        return image.convert("RGB")

    except UnidentifiedImageError:
        raise InvalidImageError(
            "Invalid or corrupted image file."
        )


async def load_uploaded_video(
    file: UploadFile,
) -> str:
    """
    Read, validate, and temporarily save an uploaded video.

    Returns:
        Path to the temporary video file.
    """

    if file.content_type not in settings.video_allowed_content_types:
        raise InvalidVideoError(
            "Unsupported video format. "
            "Use MP4, AVI, or MOV."
        )

    contents = await file.read()

    if len(contents) > settings.video_max_file_size:
        raise VideoTooLargeError(
            "Video file is too large. "
            "Maximum size is 50 MB."
        )

    if not contents:
        raise InvalidVideoError(
            "Uploaded video is empty."
        )

    suffix = os.path.splitext(
        file.filename or ".mp4"
    )[1]

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    )

    try:
        temp_file.write(contents)
        temp_file.close()

        return temp_file.name

    except Exception:
        temp_file.close()

        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)

        raise