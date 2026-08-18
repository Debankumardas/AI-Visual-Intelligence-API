from pydantic import BaseModel, Field


class Prediction(BaseModel):
    label: str
    confidence: float = Field(
        ...,
        ge=0,
        le=1,
        description="Prediction confidence between 0 and 1",
    )


class PredictionResponse(BaseModel):
    filename: str
    content_type: str
    predictions: list[Prediction]
    inference_time_ms: float