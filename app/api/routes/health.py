from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.detection_service import detection_service
from app.services.model_service import model_service


router = APIRouter(
    tags=["Health"],
)


# ============================================================
# LIVENESS CHECK
# ============================================================

@router.get("/health")
def health_check():
    """
    Check whether the API process is alive.
    """

    return {
        "status": "healthy",
        "service": "AI Visual Intelligence API",
    }


# ============================================================
# READINESS CHECK
# ============================================================

@router.get("/health/ready")
def readiness_check():
    """
    Check whether required AI models are loaded and ready.
    """

    yolo_ready = (
        detection_service.model is not None
    )

    classification_ready = (
        model_service.model is not None
        and model_service.preprocess is not None
        and bool(model_service.categories)
    )

    models_ready = (
        yolo_ready
        and classification_ready
    )

    response = {
        "status": (
            "ready"
            if models_ready
            else "not_ready"
        ),
        "models": {
            "object_detection": (
                "ready"
                if yolo_ready
                else "not_ready"
            ),
            "image_classification": (
                "ready"
                if classification_ready
                else "not_ready"
            ),
        },
    }

    if not models_ready:
        return JSONResponse(
            status_code=503,
            content=response,
        )

    return response