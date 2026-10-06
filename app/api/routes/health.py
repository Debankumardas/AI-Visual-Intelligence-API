from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.detection_service import detection_service
from app.services.model_service import model_service


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


# ============================================================
# LIVENESS CHECK
# ============================================================

@router.get("")
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

@router.get("/ready")
def readiness_check():
    """
    Check whether required AI models are loaded and ready.
    """

    yolo_ready = (
        detection_service.model is not None
    )

    classification_ready = model_service.is_ready

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

    errors = {
        name: error
        for name, error in (
            ("object_detection", detection_service.load_error),
            ("image_classification", model_service.load_error),
        )
        if error
    }

    if errors:
        response["errors"] = errors

    if not models_ready:
        return JSONResponse(
            status_code=503,
            content=response,
        )

    return response
