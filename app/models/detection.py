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