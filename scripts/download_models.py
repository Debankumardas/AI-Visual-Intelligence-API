"""
Check the model weights in models/ and download any that are missing.

Usage:
    python -m scripts.download_models
"""

import hashlib
import sys
import urllib.request
from pathlib import Path

from app.core.config import settings


# name -> (sha256, source URL). Keep in sync with models/README.md.
MODEL_FILES = {
    "yolov8s.pt": (
        "1f47a78bf100391c2a140b7ac73a1caae18c32779be7d310658112f7ac9aa78a",
        "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8s.pt",
    ),
    "yolov8s-seg.pt": (
        "0bac0770b55e5eb5b76a61bc535673288dcec36c2bc0cd25ee0d584c632f3413",
        "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8s-seg.pt",
    ),
    "efficientnet_b0_rwightman-7f5810bc.pth": (
        "7f5810bc96def8f7552d5b7e68d53c4786f81167d28291b21c0d90e1fca14934",
        "https://download.pytorch.org/models/efficientnet_b0_rwightman-7f5810bc.pth",
    ),
}


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def download(url: str, destination: Path) -> None:
    temporary = destination.with_suffix(destination.suffix + ".part")

    with urllib.request.urlopen(url) as response, temporary.open("wb") as file:
        while chunk := response.read(1024 * 1024):
            file.write(chunk)

    temporary.replace(destination)


def main() -> int:
    models_dir = Path(settings.models_dir)
    models_dir.mkdir(parents=True, exist_ok=True)

    failed = False

    for name, (expected_sha256, url) in MODEL_FILES.items():
        path = models_dir / name

        if not path.is_file():
            print(f"{name}: missing, downloading from {url}")
            download(url, path)

        actual_sha256 = sha256_of(path)

        if actual_sha256 == expected_sha256:
            print(f"{name}: OK")
        else:
            failed = True
            print(
                f"{name}: CHECKSUM MISMATCH "
                f"(expected {expected_sha256}, got {actual_sha256})"
            )

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
