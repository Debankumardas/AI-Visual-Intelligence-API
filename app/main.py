from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from PIL import Image, UnidentifiedImageError

from app.models.analysis import AnalysisResponse
from app.models.detection import DetectionResponse
from app.services.detection_service import detection_service
from app.services.prediction_service import predict_image


# ============================================================
# CONFIGURATION
# ============================================================

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


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


# ============================================================
# HELPER FUNCTIONS
# ============================================================

async def load_uploaded_image(file: UploadFile) -> Image.Image:
    """
    Read, validate, and load an uploaded image.
    """

    # --------------------------------------------------------
    # Validate content type
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

    # --------------------------------------------------------
    # Validate file size
    # --------------------------------------------------------

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image file is too large. Maximum size is 10 MB.",
        )

    # --------------------------------------------------------
    # Validate empty file
    # --------------------------------------------------------

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )

    # --------------------------------------------------------
    # Validate actual image
    # --------------------------------------------------------

    try:
        image = Image.open(BytesIO(contents))
        image.load()
        image = image.convert("RGB")

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to process image: {str(e)}",
        )

    return image


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

        detections = detection_result.get("detections", [])

        inference_time = detection_result.get(
            "inference_time_ms",
            None,
        )

        return detections, inference_time

    return detection_result, None


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
# IMAGE CLASSIFICATION
# ============================================================

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Upload an image and receive the top-5 predictions.
    """

    image = await load_uploaded_image(file)

    try:

        result = predict_image(
            image,
            top_k=5,
        )

        return {
            "filename": file.filename or "unknown",
            "content_type": file.content_type,
            "predictions": result["predictions"],
            "inference_time_ms": result["inference_time_ms"],
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Image classification failed: {str(e)}",
        )


# ============================================================
# OBJECT DETECTION
# ============================================================

@app.post(
    "/detect",
    response_model=DetectionResponse,
)
async def detect(file: UploadFile = File(...)):
    """
    Detect objects in an uploaded image.
    """

    image = await load_uploaded_image(file)

    try:

        detection_result = detection_service.detect(image)

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


# ============================================================
# ANNOTATED OBJECT DETECTION
# ============================================================

@app.post("/detect/annotated")
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

        # ----------------------------------------------------
        # Convert PIL image to JPEG bytes
        # ----------------------------------------------------

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


# ============================================================
# COMPLETE IMAGE ANALYSIS
# ============================================================

@app.post("/analyze",response_model=AnalysisResponse,)
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

        detections, detection_time = (
            get_detection_data(detection_result)
        )

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

@app.post("/analyze/annotated")
async def analyze_annotated(file: UploadFile = File(...)):
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
            detail="Unsupported image format. Use JPEG, PNG, or WebP.",
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )

    # --------------------------------------------------------
    # Validate file size
    # --------------------------------------------------------

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image file is too large. Maximum size is 10 MB.",
        )

    # --------------------------------------------------------
    # Open image
    # --------------------------------------------------------

    try:
        image = Image.open(BytesIO(contents))
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
        annotated_image = detection_service.detect_and_annotate(image)

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
            name = original_name.rsplit(".", 1)[0]
        else:
            name = original_name

        output_filename = f"annotated_{name}.jpg"

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
            detail=f"Annotated image generation failed: {str(e)}",
        )