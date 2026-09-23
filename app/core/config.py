from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """
    Application configuration.
    """

    app_name: str = "AI Visual Intelligence API"
    app_version: str = "1.0.0"

    max_file_size: int = 10 * 1024 * 1024

    allowed_content_types: frozenset[str] = frozenset(
        {
            "image/jpeg",
            "image/png",
            "image/webp",
        }
    )

    # Object detection configuration
    detection_confidence: float = 0.25
    detection_iou: float = 0.45
    detection_image_size: int = 640
    detection_device: str = "cpu"

    # Object tracking configuration
    tracking_confidence: float = 0.25
    tracking_iou: float = 0.45
    tracking_image_size: int = 640
    tracking_device: str = "cpu"
    tracking_persist: bool = True

    # Image segmentation configuration
    segmentation_confidence: float = 0.25
    segmentation_iou: float = 0.45
    segmentation_image_size: int = 640
    segmentation_device: str = "cpu"

    # OCR configuration
    ocr_language: str = "eng"
    ocr_confidence: float = 0.0
    ocr_image_size: int = 640
    ocr_device: str = "cpu"

    # ============================================================
    # VIDEO CONFIGURATION
    # ============================================================

    video_max_file_size: int = 50 * 1024 * 1024
    video_allowed_content_types: tuple[str, ...] = (
        "video/mp4",
        "video/avi",
        "video/quicktime",
        "video/x-msvideo",
    )
    video_frame_stride: int = 1
    video_device: str = "cpu"

settings = Settings()