import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from app.auth.routes import router as auth_router
from app.api.routes.health import router as health_router
from app.api.v1.router import router as api_v1_router
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import configure_logging
from app.models.error import ErrorResponse
from app.middleware.request_id import request_id_middleware
from app.services.detection_service import detection_service
from app.services.model_service import model_service


configure_logging()

logger = logging.getLogger(__name__)


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

async def warm_up_models():
    """
    Load the AI models before serving traffic.

    A failure is recorded on the service (and reported by
    /health/ready) instead of preventing the API from starting.
    """

    for name, load in (
        ("object detection", detection_service.load),
        ("image classification", model_service.load),
    ):
        try:
            await run_in_threadpool(load)
        except Exception:
            logger.error(
                "Could not load the %s model during startup.",
                name,
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.preload_models:
        await warm_up_models()

    yield


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
    lifespan=lifespan,
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
# CORS MIDDLEWARE
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST ID MIDDLEWARE
# ============================================================

app.middleware("http")(request_id_middleware)


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
app.include_router(health_router)
app.include_router(auth_router)


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