FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Model weights are baked into the image so the container can start
# without network access.
ENV TORCH_HOME=/app/.cache/torch
ENV YOLO_CONFIG_DIR=/tmp/Ultralytics
ENV YOLO_OFFLINE=1
ENV YOLO_MODEL_PATH=/app/yolo11n.pt
ENV YOLO_SEG_MODEL_PATH=/app/yolo11n-seg.pt

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

# Download the EfficientNet-B0 ImageNet weights at build time.
RUN python -c "from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights as W; efficientnet_b0(weights=W.DEFAULT)"

COPY app ./app
COPY yolo11n.pt yolo11n-seg.pt ./

RUN useradd --create-home --uid 1000 appuser \
    && mkdir -p /app/data \
    && chown -R appuser:appuser /app/data /app/.cache

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/ready', timeout=4)"

CMD ["sh", "-c", "python -m app.database.init_db && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
