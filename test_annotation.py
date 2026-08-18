from PIL import Image

from app.services.detection_service import detection_service


image = Image.open("sample.jpg")

annotated_image = detection_service.detect_and_annotate(image)

annotated_image.save("annotated_sample.jpg")

print("Annotated image created successfully.")
print("Saved as: annotated_sample.jpg")