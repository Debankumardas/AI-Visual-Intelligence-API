from io import BytesIO

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.exceptions import (
    ImageTooLargeError,
    InvalidImageError,
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