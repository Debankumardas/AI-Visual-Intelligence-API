from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes.analysis import router as analysis_router
from app.api.routes.detection import router as detection_router
from app.api.routes.prediction import router as prediction_router
from app.core.config import settings
from app.core.exceptions import AppException


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=settings.app_name,
    description=(
        "AI-powered image classification, object detection, "
        "and image analysis API."
    ),
    version=settings.app_version,
)

@app.exception_handler(AppException)
async def app_exception_handler(
    request: Request,
    exc: AppException,
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error,
            "detail": exc.detail,
            "status_code": exc.status_code,
        },
    )

# ============================================================
# API ROUTERS
# ============================================================

app.include_router(prediction_router)
app.include_router(detection_router)
app.include_router(analysis_router)


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
        "version": settings.app_version,
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
        "service": settings.app_name,
    }