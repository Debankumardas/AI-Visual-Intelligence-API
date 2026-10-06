import hashlib
from pathlib import Path

import pytest

from app.core.config import REPO_ROOT
from scripts.download_models import MODEL_FILES, sha256_of


MODELS_DIR = REPO_ROOT / "models"


@pytest.mark.parametrize("name", sorted(MODEL_FILES))
def test_committed_weight_file_is_intact(name):
    path = MODELS_DIR / name

    assert path.is_file(), f"{name} is missing from models/"
    assert path.stat().st_size > 1_000_000

    expected_sha256, _ = MODEL_FILES[name]

    assert sha256_of(path) == expected_sha256


def test_readme_lists_the_same_checksums():
    readme = (MODELS_DIR / "README.md").read_text()

    for name, (expected_sha256, url) in MODEL_FILES.items():
        assert name in readme
        assert expected_sha256 in readme
        assert url in readme


def test_sha256_of_matches_hashlib(tmp_path):
    path = tmp_path / "sample.bin"
    path.write_bytes(b"model weights")

    assert sha256_of(path) == hashlib.sha256(b"model weights").hexdigest()
