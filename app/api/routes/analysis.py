from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.api.routes.utils import load_uploaded_image
from app.models.analysis import AnalysisResponse
from app.services.detection_service import detection_service
from app.services.prediction_service import predict_image


router = APIRouter(
    prefix="/analyze",
    tags=["Image Analysis"],
)


@router.post(
    "",
    response_model=AnalysisResponse,
)
async def analyze(
    file: UploadFile = File(...)
):
    """
    Perform both image classification and object detection.
    """

    image = await load_uploaded_image(file)

    try:
        prediction_result = predict_image(
            image,
            top_k=5,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Image classification failed "
                f"during analysis: {str(e)}"
            ),
        )

    try:
        detection_result = detection_service.detect(
            image
        )

        detections = detection_result.get(
            "detections",
            []
        )

        detection_time = detection_result.get(
            "inference_time_ms",
            0.0
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Object detection failed "
                f"during analysis: {str(e)}"
            ),
        )

    return {
        "filename": file.filename or "unknown",
        "content_type": file.content_type,
        "predictions": prediction_result[
            "predictions"
        ],
        "detections": detections,
        "classification_inference_time_ms": (
            prediction_result[
                "inference_time_ms"
            ]
        ),
        "detection_inference_time_ms": detection_time,
    }


@router.post("/annotated")
async def analyze_annotated(
    file: UploadFile = File(...)
):
    """
    Analyze an image and return an annotated image
    with YOLO object-detection bounding boxes.
    """

    image = await load_uploaded_image(file)

    try:
        annotated_image = (
            detection_service.detect_and_annotate(
                image
            )
        )

        output = BytesIO()

        annotated_image.save(
            output,
            format="JPEG",
            quality=95,
        )

        output.seek(0)

        original_name = file.filename or "image.jpg"

        if "." in original_name:
            name = original_name.rsplit(
                ".",
                1
            )[0]
        else:
            name = original_name

        output_filename = (
            f"annotated_{name}.jpg"
        )

        return StreamingResponse(
            output,
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
                f"Annotated image generation failed: "
                f"{str(e)}"
            ),
        )