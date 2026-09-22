from io import BytesIO

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse

from app.api.routes.utils import load_uploaded_image
from app.core.exceptions import InferenceError
from app.models.detection import (
    DetectionResponse,
    ObjectCountResponse,
)
from app.services.detection_service import detection_service


router = APIRouter(
    prefix="/detect",
    tags=["Object Detection"],
)


# ============================================================
# OBJECT DETECTION
# ============================================================

@router.post(
    "",
    response_model=DetectionResponse,
)
async def detect(
    file: UploadFile = File(...)
):
    """
    Detect objects in an uploaded image.

    Returns:
        - Detected object labels
        - Confidence scores
        - Bounding boxes
    """

    image = await load_uploaded_image(file)

    try:
        detection_result = detection_service.detect(
            image
        )

        return {
            "filename": file.filename or "unknown",
            "content_type": file.content_type,
            "detections": detection_result[
                "detections"
            ],
        }

    except Exception as e:
        raise InferenceError(
            f"Object detection failed: {str(e)}"
        )

# ============================================================
# OBJECT COUNTING
# ============================================================

@router.post(
    "/count",
    response_model=ObjectCountResponse,
)
async def count_objects(
    file: UploadFile = File(...)
):
    """
    Count detected objects in an uploaded image.

    Returns:
        - Total number of detected objects
        - Count grouped by object class
    """

    image = await load_uploaded_image(file)

    try:
        count_result = detection_service.count_objects(
            image
        )

        return {
            "filename": file.filename or "unknown",
            "content_type": file.content_type,
            "total_objects": count_result[
                "total_objects"
            ],
            "counts": count_result["counts"],
        }

    except Exception as e:
        raise InferenceError(
            f"Object counting failed: {str(e)}"
        )

# ============================================================
# OBJECT DETECTION + ANNOTATED IMAGE
# ============================================================

@router.post("/annotated")
async def detect_annotated(
    file: UploadFile = File(...)
):
    """
    Detect objects and return the image with
    bounding boxes, labels, and confidence scores.
    """

    image = await load_uploaded_image(file)

    try:
        annotated_image = (
            detection_service.detect_and_annotate(
                image
            )
        )

        image_buffer = BytesIO()

        annotated_image.save(
            image_buffer,
            format="JPEG",
            quality=95,
        )

        image_buffer.seek(0)

        filename = file.filename or "image.jpg"

        if "." in filename:
            filename_without_extension = (
                filename.rsplit(".", 1)[0]
            )
        else:
            filename_without_extension = filename

        output_filename = (
            f"{filename_without_extension}_annotated.jpg"
        )

        return StreamingResponse(
            image_buffer,
            media_type="image/jpeg",
            headers={
                "Content-Disposition": (
                    f'inline; filename="{output_filename}"'
                )
            },
        )

    except Exception as e:
        raise InferenceError(
            f"Annotated object detection failed: "
            f"{str(e)}"
        )