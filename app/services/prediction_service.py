import time

import torch
from PIL import Image

from app.services.model_service import model_service


def predict_image(image: Image.Image, top_k: int = 5):
    """
    Predict the contents of an image using EfficientNet-B0.
    """

    # Make sure image is RGB
    image = image.convert("RGB")

    # Preprocess image
    input_tensor = model_service.preprocess(image)

    # Add batch dimension
    input_batch = input_tensor.unsqueeze(0).to(model_service.device)

    # Start timer
    start_time = time.perf_counter()

    # Run model inference
    with torch.inference_mode():
        output = model_service.model(input_batch)

    # Calculate inference time
    inference_time = (time.perf_counter() - start_time) * 1000

    # Convert model output to probabilities
    probabilities = torch.nn.functional.softmax(output[0], dim=0)

    # Get top predictions
    top_probabilities, top_indices = torch.topk(
        probabilities,
        min(top_k, len(model_service.categories))
    )

    predictions = []

    for probability, index in zip(top_probabilities, top_indices):
        predictions.append(
            {
                "label": model_service.categories[index.item()],
                "confidence": round(probability.item(), 4),
            }
        )

    return {
        "predictions": predictions,
        "inference_time_ms": round(inference_time, 2),
    }