from fastapi import FastAPI

from app.api.routes.analysis import router as analysis_router
from app.api.routes.detection import router as detection_router
from app.api.routes.prediction import router as prediction_router


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