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


settings = Settings()