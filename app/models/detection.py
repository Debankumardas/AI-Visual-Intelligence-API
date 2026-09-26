from pydantic import BaseModel, Field


class BoundingBox(BaseModel):

    x1: float

    y1: float

    x2: float

    y2: float


class Detection(BaseModel):

    label: str

    confidence: float = Field(..., ge=0, le=1)

    box: BoundingBox


class DetectionResponse(BaseModel):

    filename: str

    content_type: str

    detections: list[Detection]


# ============================================================
# OBJECT TRACKING MODELS
# ============================================================

class Track(BaseModel):

    track_id: int = Field(..., ge=0)

    label: str

    confidence: float = Field(..., ge=0, le=1)

    box: BoundingBox


class TrackingResponse(BaseModel):

    filename: str

    content_type: str

    tracks: list[Track]


# ============================================================
# IMAGE SEGMENTATION MODELS
# ============================================================

class Segmentation(BaseModel):

    label: str

    confidence: float = Field(..., ge=0, le=1)

    box: BoundingBox

    mask: list[list[float]]


class SegmentationResponse(BaseModel):

    filename: str

    content_type: str

    segmentations: list[Segmentation]


# ============================================================
# OCR MODELS
# ============================================================

class OCRResult(BaseModel):

    text: str

    confidence: float = Field(..., ge=0, le=1)

    box: BoundingBox


class OCRResponse(BaseModel):

    filename: str

    content_type: str

    results: list[OCRResult]


class ObjectCount(BaseModel):

    label: str

    count: int = Field(..., ge=0)


class ObjectCountResponse(BaseModel):

    filename: str

    content_type: str

    total_objects: int = Field(..., ge=0)

    counts: list[ObjectCount]


# ============================================================
# VIDEO MODELS
# ============================================================

class VideoMetadata(BaseModel):

    filename: str

    content_type: str

    frame_count: int

    fps: float

    width: int

    height: int

    duration: float


class VideoAnalysisResponse(BaseModel):

    filename: str

    content_type: str

    metadata: VideoMetadata


class VideoAnalyticsResponse(BaseModel):

    filename: str

    content_type: str

    frames_processed: int = Field(..., ge=0)

    processing_time_seconds: float = Field(..., ge=0)

    effective_fps: float = Field(..., ge=0)

    total_inference_time_ms: float = Field(..., ge=0)

    average_inference_time_ms: float = Field(..., ge=0)

    min_inference_time_ms: float = Field(..., ge=0)

    max_inference_time_ms: float = Field(..., ge=0)

    total_detections: int = Field(..., ge=0)

    max_detections_per_frame: int = Field(..., ge=0)

    average_detections_per_frame: float = Field(..., ge=0)

    class_detection_counts: dict[str, int]

    max_detections_by_class: dict[str, int]

    average_detections_by_class: dict[str, float]

    # ========================================================
    # TEMPORAL DETECTION ANALYTICS
    # ========================================================

    first_detection_frame: dict[str, int]

    last_detection_frame: dict[str, int]

    active_frames_by_class: dict[str, int]

    class_presence_ratio: dict[str, float]

    # ========================================================
    # CLASS-LEVEL TRACKING ANALYTICS
    # ========================================================

    class_tracking_counts: dict[str, int]

    unique_track_ids_by_class: dict[str, int]

    max_tracks_by_class: dict[str, int]

    average_tracks_by_class: dict[str, float]

    # AGGREGATE TRACKING ANALYTICS
    total_track_observations: int = Field(..., ge=0)
    unique_track_ids: int = Field(..., ge=0)
    max_tracks_per_frame: int = Field(..., ge=0)
    average_tracks_per_frame: float = Field(..., ge=0)

    # TRACK DURATION ANALYTICS
    track_duration_frames: dict[int, int]