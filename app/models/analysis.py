from pydantic import BaseModel

from app.models.prediction import Prediction
from app.models.detection import Detection


class AnalysisResponse(BaseModel):
    filename: str
    content_type: str
    predictions: list[Prediction]
    detections: list[Detection]
    classification_inference_time_ms: float
    detection_inference_time_ms: float
