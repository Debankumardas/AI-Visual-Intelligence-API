from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from PIL import Image, UnidentifiedImageError

from app.api.routes.detection import router as detection_router
from app.api.routes.prediction import router as prediction_router
from app.api.routes.utils import (
    ALLOWED_CONTENT_TYPES,
    MAX_FILE_SIZE,
    load_uploaded_image,
)
from app.models.analysis import AnalysisResponse
from app.services.detection_service import detection_service
from app.services.prediction_service import predict_image


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Visual Intelligence API",
    description=(
        "AI-powered image classification, object detection, "
        "and image analysis API."
    ),
    version="1.0.0",
)

app.include_router(prediction_router)
app.include_router(detection_router)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    """
    API root endpoint.
    """

    return {
        "message": "AI Visual Intelligence API is running",
        "status": "healthy",
        "version": "1.0.0",
        "docs": "/docs",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    """
    Health check endpoint.
    """

    return {
        "status": "healthy",
        "service": "AI Visual Intelligence API",
    }


# ============================================================
# COMPLETE IMAGE ANALYSIS
# ============================================================

@app.post(
    "/analyze",
    response_model=AnalysisResponse,
)
async def analyze(
    file: UploadFile = File(...)
):
    """
    Perform both image classification and object detection.

    Returns:
        - Top classification predictions
        - Detected objects
        - Classification inference time
        - Detection inference time
    """

    image = await load_uploaded_image(file)

    # ========================================================
    # IMAGE CLASSIFICATION
    # ========================================================

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

    # ========================================================
    # OBJECT DETECTION
    # ========================================================

    try:

        detection_result = detection_service.detect(
            image
        )

        # Support both current detection-service
        # response formats.

        if isinstance(detection_result, dict):

            detections = detection_result.get(
                "detections",
                []
            )

            detection_time = detection_result.get(
                "inference_time_ms",
                None
            )

        else:

            detections = detection_result
            detection_time = None

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Object detection failed "
                f"during analysis: {str(e)}"
            ),
        )

    # ========================================================
    # RESPONSE
    # ========================================================

    response = {
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

    return response


# ============================================================
# ANNOTATED COMPLETE IMAGE ANALYSIS
# ============================================================

@app.post("/analyze/annotated")
async def analyze_annotated(
    file: UploadFile = File(...)
):
    """
    Analyze an image and return an annotated image
    with YOLO object-detection bounding boxes.
    """

    # --------------------------------------------------------
    # Validate file type
    # --------------------------------------------------------

    if file.content_type not in ALLOWED_CONTENT_TYPES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image format. "
                "Use JPEG, PNG, or WebP."
            ),
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    contents = await file.read()

    if not contents:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # --------------------------------------------------------
    # Validate file size
    # --------------------------------------------------------

    if len(contents) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=413,
            detail=(
                "Image file is too large. "
                "Maximum size is 10 MB."
            ),
        )

    # --------------------------------------------------------
    # Open image
    # --------------------------------------------------------

    try:

        image = Image.open(
            BytesIO(contents)
        )

        image.load()

        image = image.convert("RGB")

    except UnidentifiedImageError:

        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    # --------------------------------------------------------
    # Create annotated image
    # --------------------------------------------------------

    try:

        annotated_image = (
            detection_service.detect_and_annotate(
                image
            )
        )

        # Save annotated image into memory

        output = BytesIO()

        annotated_image.save(
            output,
            format="JPEG",
            quality=95,
        )

        output.seek(0)

        # ----------------------------------------------------
        # Return annotated image
        # ----------------------------------------------------

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