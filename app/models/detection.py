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
