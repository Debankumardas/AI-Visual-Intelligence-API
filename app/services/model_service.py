import torch
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights


class ImagePredictionModel:

    def __init__(self):
        self.device = torch.device("cpu")

        print("Loading EfficientNet-B0...")

        self.weights = EfficientNet_B0_Weights.DEFAULT
        self.model = efficientnet_b0(weights=self.weights)

        self.model = self.model.to(self.device)
        self.model.eval()

        self.preprocess = self.weights.transforms()
        self.categories = self.weights.meta["categories"]

        print("EfficientNet-B0 loaded successfully.")
        print(f"Device: {self.device}")
        print(f"Classes: {len(self.categories)}")


# Load model once when the application starts
model_service = ImagePredictionModel()