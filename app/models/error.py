from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """
    Standard API error response.
    """

    error: str
    detail: str
    status_code: int