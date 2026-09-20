from fastapi import APIRouter

from app.api.routes.analysis import router as analysis_router
from app.api.routes.detection import router as detection_router
from app.api.routes.prediction import router as prediction_router


router = APIRouter(prefix="/api/v1")

router.include_router(prediction_router)
router.include_router(detection_router)
router.include_router(analysis_router)