from fastapi import APIRouter, File, UploadFile

from app.api.routes.utils import load_uploaded_image
from app.core.exceptions import InferenceError
from app.services.prediction_service import predict_image


router = APIRouter(
    prefix="/predict",
    tags=["Image Classification"],
)


@router.post("")
async def predict(
    file: UploadFile = File(...)
):
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
        raise InferenceError(
            f"Image classification failed: {str(e)}"
        )