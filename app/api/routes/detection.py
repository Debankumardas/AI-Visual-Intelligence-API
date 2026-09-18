from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.api.routes.utils import load_uploaded_image
from app.models.detection import DetectionResponse
from app.services.detection_service import detection_service


router = APIRouter(
    prefix="/detect",
    tags=["Object Detection"],
)


def get_detection_data(detection_result):
    """
    Normalize the result returned by detection_service.detect().

    Supports both:

        [
            {...}
        ]

    and:

        {
            "detections": [...],
            "inference_time_ms": 123.45
        }
    """

    if isinstance(detection_result, dict):

        detections = detection_result.get(
            "detections",
            []
        )

        inference_time = detection_result.get(
            "inference_time_ms",
            None
        )

        return detections, inference_time

    return detection_result, None


@router.post(
    "",
    response_model=DetectionResponse,
)
async def detect(file: UploadFile = File(...)):
    """
    Detect objects in an uploaded image.
    """

    image = await load_uploaded_image(file)

    try:

        detection_result = detection_service.detect(
            image
        )

        detections, _ = get_detection_data(
            detection_result
        )

        return {
            "filename": file.filename or "unknown",
            "content_type": file.content_type,
            "detections": detections,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Object detection failed: {str(e)}",
        )


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

        raise HTTPException(
            status_code=500,
            detail=(
                f"Annotated object detection failed: "
                f"{str(e)}"
            ),
        )