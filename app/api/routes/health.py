from fastapi import APIRouter

from app.core.config import settings


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
def health_check():
    """
    Liveness check.

    Confirms that the API process is running.
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
    }


@router.get("/ready")
def readiness_check():
    """
    Readiness check.

    Confirms that the API is ready to accept inference requests.
    """
    return {
        "status": "ready",
        "service": settings.app_name,
    }