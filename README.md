# AI Visual Intelligence API

An AI-powered REST API for image classification, object detection, and visual analysis. Built with **FastAPI**, **EfficientNet-B0**, and **YOLO11n**, the API provides predictions, object detections, confidence scores, bounding boxes, inference timing, and annotated images.

## 🚀 Features

* 🖼️ Image classification using EfficientNet-B0
* 🎯 Object detection using YOLO11n
* 📦 Bounding box coordinates
* 📊 Top-5 image classification predictions
* 📈 Confidence scores
* ⏱️ Inference time measurement
* 🖍️ Annotated image generation
* 🔍 Combined image classification and detection
* 🛡️ Image format and file-size validation
* 📚 Interactive Swagger API documentation

## 🧠 Models

### EfficientNet-B0

A pretrained EfficientNet-B0 model from Torchvision is used for image classification.

The API returns the top-5 predicted ImageNet classes with their confidence scores.

### YOLO11n

YOLO11n is used for object detection.

The detection API returns:

* Object label
* Confidence score
* Bounding box coordinates
* Detection inference time

The required `yolo11n.pt` model is included in the repository.

## 🏗️ Project Architecture

```text
Client
  │
  ▼
FastAPI
  │
  ├── /predict
  │      │
  │      ▼
  │  EfficientNet-B0
  │
  ├── /detect
  │      │
  │      ▼
  │    YOLO11n
  │
  ├── /detect/annotated
  │      │
  │      ▼
  │   Annotated Image
  │
  └── /analyze
         │
         ├── EfficientNet-B0
         └── YOLO11n
```

## 📁 Project Structure

```text
AI-Visual-Intelligence-API/
│
├── app/
│   ├── main.py
│   │
│   ├── models/
│   │   ├── analysis.py
│   │   ├── detection.py
│   │   └── prediction.py
│   │
│   └── services/
│       ├── detection_service.py
│       ├── model_service.py
│       └── prediction_service.py
│
├── run.py
├── sample.jpg
├── test_prediction.py
├── test_annotation.py
├── yolo11n.pt
├── requirements.txt
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint            | Description                |
| ------ | ------------------- | -------------------------- |
| GET    | `/`                 | API status                 |
| GET    | `/health`           | Health check               |
| POST   | `/predict`          | Image classification       |
| POST   | `/detect`           | Object detection           |
| POST   | `/detect/annotated` | Annotated detection image  |
| POST   | `/analyze`          | Classification + detection |

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Debankumardas/AI-Visual-Intelligence-API.git
cd AI-Visual-Intelligence-API
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

## ▶️ Run the API

Start the server with:

```bash
python run.py
```

The API will be available at:

```text
http://127.0.0.1:8000
```

### Swagger Documentation

Open:

```text
http://127.0.0.1:8000/docs
```

Swagger provides an interactive interface for uploading images and testing every endpoint.

## 🧪 Testing

The project includes basic test scripts:

```bash
python test_prediction.py
```

```bash
python test_annotation.py
```

You can also test the API directly through Swagger.

## 📊 Example Classification Response

```json
{
  "filename": "sample.jpg",
  "content_type": "image/jpeg",
  "predictions": [
    {
      "label": "golden retriever",
      "confidence": 0.9376
    },
    {
      "label": "Labrador retriever",
      "confidence": 0.0042
    }
  ],
  "inference_time_ms": 42.31
}
```

## 🎯 Example Detection Response

```json
{
  "filename": "sample.jpg",
  "content_type": "image/jpeg",
  "detections": [
    {
      "label": "dog",
      "confidence": 0.9342,
      "box": {
        "x1": 52.41,
        "y1": 31.22,
        "x2": 489.72,
        "y2": 421.63
      }
    }
  ]
}
```

## 🛡️ Validation

The API accepts:

* JPEG
* PNG
* WebP

Maximum upload size:

**10 MB**

Uploaded files are also validated to ensure they are valid images
