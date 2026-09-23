import os

from fastapi import APIRouter, File, UploadFile

from app.api.routes.utils import load_uploaded_video
from app.core.exceptions import InvalidVideoError
from app.models.detection import VideoAnalysisResponse
from app.services.video_service import video_service

router = APIRouter(
    prefix="/video",
    tags=["Video"],
)


@router.post(
    "/metadata",
    response_model=VideoAnalysisResponse,
)
async def analyze_video_metadata(
    file: UploadFile = File(...),
):
    """
    Analyze uploaded video metadata.
    """

    video_path = await load_uploaded_video(file)

    try:
        try:
            metadata = video_service.get_metadata(video_path)

        except ValueError as exc:
            raise InvalidVideoError(
                "Invalid or corrupted video file."
            ) from exc

        return VideoAnalysisResponse(
            filename=file.filename or "unknown",
            content_type=file.content_type or "unknown",
            metadata={
                "filename": file.filename or "unknown",
                "content_type": file.content_type or "unknown",
                **metadata,
            },
        )

    finally:
        if os.path.exists(video_path):
            os.remove(video_path)