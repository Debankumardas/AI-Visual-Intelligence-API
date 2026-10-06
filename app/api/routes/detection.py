from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

from app.api.routes.utils import encode_jpeg, load_uploaded_image
from app.core.exceptions import InferenceError
from app.models.detection import (
    DetectionResponse,
    OCRResponse,
    ObjectCountResponse,
    SegmentationResponse,
    TrackingResponse,
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
        detection_result = await run_in_threadpool(
            detection_service.detect,
            image,
        )

        return {
            "filename": file.filename or "unknown",
            "content_type": file.content_type or "unknown",
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
        count_result = await run_in_threadpool(
            detection_service.count_objects,
            image,
        )

        return {
            "filename": file.filename or "unknown",
            "content_type": file.content_type or "unknown",
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
# OBJECT TRACKING
# ============================================================

@router.post(
    "/track",
    response_model=TrackingResponse,
)
async def track_objects(
    file: UploadFile = File(...)
):
    """
    Track objects in an uploaded image or frame.

    Returns:
        - Tracking ID
        - Object label
        - Confidence score
        - Bounding box
    """

    image = await load_uploaded_image(file)

    try:
        tracking_result = await run_in_threadpool(
            detection_service.track_image,
            image,
        )

        return {
            "filename": file.filename or "unknown",
            "content_type": file.content_type or "unknown",
            "tracks": tracking_result["tracks"],
        }

    except Exception as e:
        raise InferenceError(
            f"Object tracking failed: {str(e)}"
        )


# ============================================================
# IMAGE SEGMENTATION
# ============================================================

@router.post(
    "/segment",
    response_model=SegmentationResponse,
)
async def segment_objects(
    file: UploadFile = File(...)
):
    """
    Segment objects in an uploaded image.

    Returns:
        - Object label
        - Confidence score
        - Bounding box
        - Segmentation mask polygon
    """

    image = await load_uploaded_image(file)

    try:
        segmentation_result = await run_in_threadpool(
            detection_service.segment,
            image,
        )

        return {
            "filename": file.filename or "unknown",
            "content_type": file.content_type or "unknown",
            "segmentations": (
                segmentation_result[
                    "segmentations"
                ]
            ),
        }

    except Exception as e:
        raise InferenceError(
            f"Image segmentation failed: "
            f"{str(e)}"
        )

@router.post(
    "/ocr",
    response_model=OCRResponse,
)
async def extract_text(
    file: UploadFile = File(...)
):
    """
    Extract text from an uploaded image.

    Returns:
        - Detected text
        - Confidence score
        - Bounding box
    """

    image = await load_uploaded_image(file)

    try:
        ocr_result = await run_in_threadpool(
            detection_service.ocr,
            image,
        )

        return {
            "filename": file.filename or "unknown",
            "content_type": file.content_type or "unknown",
            "results": ocr_result["results"],
        }

    except Exception as e:
        raise InferenceError(
            f"OCR processing failed: {str(e)}"
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
        annotated_image = await run_in_threadpool(
            detection_service.detect_and_annotate,
            image,
        )

        image_buffer = await run_in_threadpool(
            encode_jpeg,
            annotated_image,
        )

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
            "Annotated object detection failed: "
            f"{str(e)}"
        )