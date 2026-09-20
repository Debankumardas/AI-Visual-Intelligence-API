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


settings = Settings()