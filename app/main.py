from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.v1.router import router as api_v1_router
from app.core.config import settings
from app.core.exceptions import AppException
from app.models.error import ErrorResponse


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
    responses={
        400: {
            "model": ErrorResponse,
            "description": "Invalid request or image.",
        },
        413: {
            "model": ErrorResponse,
            "description": "Uploaded image is too large.",
        },
        500: {
            "model": ErrorResponse,
            "description": "Internal inference or application error.",
        },
    },
)


# ============================================================
# CENTRALIZED EXCEPTION HANDLER
# ============================================================

@app.exception_handler(AppException)
async def app_exception_handler(
    request: Request,
    exc: AppException,
):
    error_response = ErrorResponse(
        error=exc.error,
        detail=exc.detail,
        status_code=exc.status_code,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(),
    )


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(api_v1_router)


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