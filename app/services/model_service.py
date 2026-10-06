import logging
import threading

import torch
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

from app.core.config import settings
from app.core.model_files import require_model_file


logger = logging.getLogger(__name__)


class ImagePredictionModel:

    def __init__(self):
        self.device = torch.device("cpu")

        # Only used for the preprocessing transforms and the ImageNet
        # class names, which are bundled with torchvision. The weights
        # themselves are loaded from a local file.
        self.weights = EfficientNet_B0_Weights.DEFAULT

        # Loaded lazily (or warmed up by the application lifespan) so
        # importing this module never downloads weights.
        self.model = None
        self.preprocess = None
        self.categories: list[str] = []
        self.load_error: str | None = None

        self._load_lock = threading.Lock()

    def load(self):
        """
        Load EfficientNet-B0 if it is not loaded yet.
        """

        if self.model is not None:
            return self.model

        with self._load_lock:
            if self.model is None:
                logger.info("Loading EfficientNet-B0...")

                try:
                    model = efficientnet_b0(weights=None)

                    model.load_state_dict(
                        torch.load(
                            require_model_file(
                                settings.classifier_weights_path
                            ),
                            map_location=self.device,
                            weights_only=True,
                        )
                    )
                except Exception as exc:
                    self.load_error = str(exc)
                    logger.exception(
                        "Failed to load EfficientNet-B0."
                    )
                    raise

                model = model.to(self.device)
                model.eval()

                self.preprocess = self.weights.transforms()
                self.categories = self.weights.meta["categories"]
                self.model = model
                self.load_error = None

                logger.info("EfficientNet-B0 loaded successfully.")
                logger.info("Device: %s", self.device)
                logger.info("Classes: %d", len(self.categories))

        return self.model

    @property
    def is_ready(self) -> bool:
        return (
            self.model is not None
            and self.preprocess is not None
            and bool(self.categories)
        )


# Single shared instance; weights load on first use or at startup.
model_service = ImagePredictionModel()
