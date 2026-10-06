# Model weights

All AI model weights used by the backend live in this folder and are loaded
from local files only. The backend never downloads weights at runtime.

| File                                    | Used for                       | Size    | SHA-256                                                            | Source |
| --------------------------------------- | ------------------------------ | ------- | ------------------------------------------------------------------ | ------ |
| `yolov8s.pt`                            | Object detection and tracking  | 22.6 MB | `1f47a78bf100391c2a140b7ac73a1caae18c32779be7d310658112f7ac9aa78a` | https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8s.pt |
| `yolov8s-seg.pt`                        | Instance segmentation          | 23.9 MB | `0bac0770b55e5eb5b76a61bc535673288dcec36c2bc0cd25ee0d584c632f3413` | https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8s-seg.pt |
| `efficientnet_b0_rwightman-7f5810bc.pth` | Image classification (ImageNet) | 21.4 MB | `7f5810bc96def8f7552d5b7e68d53c4786f81167d28291b21c0d90e1fca14934` | https://download.pytorch.org/models/efficientnet_b0_rwightman-7f5810bc.pth |

If a file is missing or corrupted, restore it and verify the checksums with:

```bash
python -m scripts.download_models
```

Set `MODELS_DIR` to load the weights from a different folder.
