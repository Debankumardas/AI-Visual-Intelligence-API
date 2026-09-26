import os
import tempfile

from fastapi import APIRouter, BackgroundTasks, File, UploadFile
from fastapi.responses import FileResponse

from app.api.routes.utils import load_uploaded_video
from app.core.exceptions import InvalidVideoError
from app.models.detection import (
    VideoAnalysisResponse,
    VideoAnalyticsResponse,
)
from app.services.video_processing_service import video_processing_service
from app.services.video_service import video_service


router = APIRouter(prefix="/video", tags=["Video"])


@router.post(
    "/metadata",
    response_model=VideoAnalysisResponse,
)
async def analyze_video_metadata(
    file: UploadFile = File(...),
):
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

@router.post(
    "/analyze",
    response_model=VideoAnalyticsResponse,
)
async def analyze_video(
    file: UploadFile = File(...),
):
    video_path = await load_uploaded_video(file)

    try:
        try:
            analytics = video_processing_service.analyze_video(
                video_path=video_path,
            )

        except ValueError as exc:
            raise InvalidVideoError(
                "Unable to analyze video."
            ) from exc

        return VideoAnalyticsResponse(
            filename=file.filename or "unknown",
            content_type=file.content_type or "unknown",
            **analytics,
        )

    finally:
        if os.path.exists(video_path):
            os.remove(video_path)

@router.post("/annotate")
async def annotate_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    input_path = await load_uploaded_video(file)

    output_path = os.path.join(
        tempfile.gettempdir(),
        f"annotated_{os.urandom(8).hex()}.mp4",
    )

    try:
        try:
            video_processing_service.generate_annotated_video(
                video_path=input_path,
                output_path=output_path,
            )

        except ValueError as exc:
            raise InvalidVideoError(
                "Unable to generate annotated video."
            ) from exc

        if not os.path.exists(output_path):
            raise InvalidVideoError(
                "Annotated video was not generated."
            )

        background_tasks.add_task(
            os.remove,
            input_path,
        )

        background_tasks.add_task(
            os.remove,
            output_path,
        )

        return FileResponse(
            path=output_path,
            media_type="video/mp4",
            filename=f"annotated_{file.filename or 'video.mp4'}",
            background=background_tasks,
        )

    except Exception:
        if os.path.exists(output_path):
            os.remove(output_path)

        if os.path.exists(input_path):
            os.remove(input_path)

        raise
    