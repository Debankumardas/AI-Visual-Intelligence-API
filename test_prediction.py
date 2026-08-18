from PIL import Image

from app.services.detection_service import detection_service


image = Image.open("sample.jpg")

detections = detection_service.detect(image)

print("\nDetection Results")
print("-----------------")

if not detections:
    print("No objects detected.")
else:
    for detection in detections:
        print(
            f"{detection['label']} - "
            f"{detection['confidence'] * 100:.2f}%"
        )
        print(f"  Box: {detection['box']}")