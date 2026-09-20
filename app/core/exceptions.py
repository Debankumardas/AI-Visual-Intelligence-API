class AppException(Exception):
    """
    Base exception for application-level errors.
    """

    status_code = 500
    error = "Internal Server Error"

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class InvalidImageError(AppException):
    """
    Raised when an uploaded image is invalid.
    """

    status_code = 400
    error = "Invalid Image"


class ImageTooLargeError(AppException):
    """
    Raised when an uploaded image exceeds the size limit.
    """

    status_code = 413
    error = "Image Too Large"


class InferenceError(AppException):
    """
    Raised when model inference fails.
    """

    status_code = 500
    error = "Inference Error"