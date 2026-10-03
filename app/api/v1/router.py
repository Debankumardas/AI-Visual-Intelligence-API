from fastapi import APIRouter, Depends

from app.api.routes.analysis import router as analysis_router
from app.api.routes.detection import router as detection_router
from app.api.routes.prediction import router as prediction_router
from app.api.routes.video import router as video_router
from app.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1",
)

protected_router = APIRouter(
    dependencies=[Depends(get_current_user)],
)

protected_router.include_router(prediction_router)
protected_router.include_router(detection_router)
protected_router.include_router(analysis_router)
protected_router.include_router(video_router)

router.include_router(protected_router)