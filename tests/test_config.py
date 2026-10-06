import importlib
import os
from pathlib import Path

import pytest

from app.core import config
from app.core.model_files import require_model_file


@pytest.fixture()
def reload_config():
    yield lambda: importlib.reload(config)

    importlib.reload(config)


def test_model_paths_default_to_the_repo_models_folder(
    monkeypatch,
    reload_config,
):
    for name in (
        "MODELS_DIR",
        "YOLO_MODEL_PATH",
        "YOLO_SEG_MODEL_PATH",
        "CLASSIFIER_WEIGHTS_PATH",
    ):
        monkeypatch.delenv(name, raising=False)

    settings = reload_config().settings

    models_dir = config.REPO_ROOT / "models"

    assert Path(settings.models_dir) == models_dir
    assert Path(settings.yolo_model_path) == models_dir / "yolov8s.pt"
    assert Path(settings.yolo_seg_model_path) == models_dir / "yolov8s-seg.pt"
    assert (
        Path(settings.classifier_weights_path)
        == models_dir / "efficientnet_b0_rwightman-7f5810bc.pth"
    )


def test_model_paths_do_not_depend_on_the_working_directory(
    monkeypatch,
    tmp_path,
    reload_config,
):
    monkeypatch.delenv("MODELS_DIR", raising=False)
    monkeypatch.chdir(tmp_path)

    settings = reload_config().settings

    assert Path(settings.yolo_model_path).is_absolute()
    assert Path(settings.yolo_model_path).is_file()


def test_models_dir_can_be_overridden(
    monkeypatch,
    tmp_path,
    reload_config,
):
    monkeypatch.setenv("MODELS_DIR", str(tmp_path))
    monkeypatch.delenv("YOLO_MODEL_PATH", raising=False)

    settings = reload_config().settings

    assert Path(settings.yolo_model_path) == tmp_path / "yolov8s.pt"


def test_single_model_path_can_be_overridden(
    monkeypatch,
    reload_config,
):
    monkeypatch.setenv("YOLO_MODEL_PATH", "/custom/detector.pt")

    assert reload_config().settings.yolo_model_path == "/custom/detector.pt"


def test_require_model_file_returns_existing_path(tmp_path):
    weights = tmp_path / "model.pt"
    weights.write_bytes(b"x")

    assert require_model_file(weights) == str(weights)


def test_require_model_file_explains_how_to_recover(tmp_path):
    with pytest.raises(FileNotFoundError) as error:
        require_model_file(tmp_path / "gone.pt")

    message = str(error.value)

    assert "gone.pt" in message
    assert "python -m scripts.download_models" in message


def test_video_frame_budget_defaults_to_150(monkeypatch, reload_config):
    monkeypatch.delenv("VIDEO_MAX_PROCESSED_FRAMES", raising=False)

    assert reload_config().settings.video_max_processed_frames == 150


def test_video_frame_budget_can_be_overridden(monkeypatch, reload_config):
    monkeypatch.setenv("VIDEO_MAX_PROCESSED_FRAMES", "40")

    assert reload_config().settings.video_max_processed_frames == 40
