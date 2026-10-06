"""
Run object detection on an image and save an annotated copy.

Usage:
    python -m scripts.annotate_sample --input sample.jpg --output annotated_sample.jpg
"""

import argparse

from PIL import Image

from app.services.detection_service import detection_service


def parse_args():
    parser = argparse.ArgumentParser(
        description="Draw YOLO detections on an image.",
    )

    parser.add_argument(
        "--input",
        default="sample.jpg",
        help="Path to the source image.",
    )

    parser.add_argument(
        "--output",
        default="annotated_sample.jpg",
        help="Where to write the annotated image.",
    )

    return parser.parse_args()


def main():
    args = parse_args()

    image = Image.open(args.input)

    annotated_image = detection_service.detect_and_annotate(image)

    annotated_image.save(args.output)

    print("Annotated image created successfully.")
    print(f"Saved as: {args.output}")


if __name__ == "__main__":
    main()
