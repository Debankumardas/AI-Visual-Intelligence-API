import os
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)

    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)

    if value is None or not value.strip():
        return default

    return int(value)


def _model_path(env_name: str, filename: str) -> str:
    """
    Path of a model file: an explicit env override, otherwise the file
    inside the models folder.
    """

    override = os.getenv(env_name)

    if override:
        return override

    models_dir = os.getenv("MODELS_DIR", str(REPO_ROOT / "models"))

    return str(Path(models_dir) / filename)


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

    # ============================================================
    # MODEL CONFIGURATION
    # ============================================================

    # Load models during application startup instead of on the
    # first request. Disabled in tests.
    preload_models: bool = field(
        default_factory=lambda: _env_bool("PRELOAD_MODELS", True)
    )

    # All model weights are loaded from local files in this folder.
    models_dir: str = field(
        default_factory=lambda: os.getenv(
            "MODELS_DIR",
            str(REPO_ROOT / "models"),
        )
    )

    yolo_model_path: str = field(
        default_factory=lambda: _model_path(
            "YOLO_MODEL_PATH",
            "yolov8s.pt",
        )
    )

    yolo_seg_model_path: str = field(
        default_factory=lambda: _model_path(
            "YOLO_SEG_MODEL_PATH",
            "yolov8s-seg.pt",
        )
    )

    classifier_weights_path: str = field(
        default_factory=lambda: _model_path(
            "CLASSIFIER_WEIGHTS_PATH",
            "efficientnet_b0_rwightman-7f5810bc.pth",
        )
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

    # Upper bound on frames run through the model per video. Longer
    # videos are sampled evenly with a larger frame stride. YOLOv8s
    # takes ~0.6 s per frame on a 2-core CPU, so 150 frames is about
    # 90 s.
    video_max_processed_frames: int = field(
        default_factory=lambda: _env_int(
            "VIDEO_MAX_PROCESSED_FRAMES",
            150,
        )
    )
    video_device: str = "cpu"

settings = Settings()
