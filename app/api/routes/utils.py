from io import BytesIO

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import settings


async def load_uploaded_image(
    file: UploadFile,
) -> Image.Image:
    """
    Read, validate, and load an uploaded image.
    """

    if file.content_type not in settings.allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image format. "
                "Use JPEG, PNG, or WebP."
            ),
        )

    contents = await file.read()

    if len(contents) > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=(
                "Image file is too large. "
                "Maximum size is 10 MB."
            ),
        )

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )

    try:
        image = Image.open(
            BytesIO(contents)
        )

        image.load()

        return image.convert("RGB")

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file.",
        )