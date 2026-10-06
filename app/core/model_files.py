from pathlib import Path


def require_model_file(path: str | Path) -> str:
    """
    Return the path of a local model file, or fail with a clear error.

    Checking before handing the path to a model library stops it from
    silently downloading weights that happen to match a known name.
    """

    model_path = Path(path)

    if not model_path.is_file():
        raise FileNotFoundError(
            f"Model file not found: {model_path}. "
            "Run `python -m scripts.download_models` to restore it."
        )

    return str(model_path)
