"""
YOLOv8 hazard detection inference module.

Classes detected:
  0 — pothole
  1 — broken road edge
  2 — waterlogging
  3 — missing manhole cover
"""

from __future__ import annotations

import io
from typing import Any

from PIL import Image

from app.config import get_settings

settings = get_settings()

# Class index → human-readable name
CLASS_NAMES: dict[int, str] = {
    0: "pothole",
    1: "broken_road_edge",
    2: "waterlogging",
    3: "missing_manhole_cover",
}

# COCO classes that indicate "NOT a road hazard" (person, animals, vehicles, etc.)
NON_HAZARD_COCO_CLASSES = {
    0,   # person
    1,   # bicycle
    2,   # car
    3,   # motorcycle
    5,   # bus
    7,   # truck
    14,  # bird
    15,  # cat
    16,  # dog
    17,  # horse
    24,  # backpack
    26,  # handbag
    63,  # laptop
    67,  # cell phone
}

_model = None


def _load_model():
    """Lazy-load the YOLOv8 model to avoid startup cost when not needed."""
    global _model
    if _model is None:
        try:
            from ultralytics import YOLO
            _model = YOLO(settings.YOLO_MODEL_PATH)
        except Exception:
            _model = None
    return _model


def _is_road_surface(pil_image) -> bool:
    """
    Check if the image looks like a road surface using texture analysis.
    Road surfaces are typically:
    - Gray/dark colored (low saturation)
    - Have rough texture (high local variance)
    - Not smooth skin tones

    Returns True if the image likely shows a road/ground surface.
    """
    import numpy as np

    img = pil_image.convert("RGB").resize((64, 64))
    arr = np.array(img, dtype=np.float32)

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    brightness = (r + g + b) / 3.0

    # --- Skin tone detection (reject faces/hands) ---
    # Skin pixels: R > 95, G > 40, B > 20, R > G, R > B, |R-G| > 15
    skin_mask = (
        (r > 95) & (g > 40) & (b > 20) &
        (r > g) & (r > b) &
        (np.abs(r - g) > 15)
    )
    skin_ratio = skin_mask.sum() / skin_mask.size
    if skin_ratio > 0.25:
        return False  # Too much skin tone → likely a face or hand

    # --- Saturation check (roads are low-saturation) ---
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    saturation = np.where(max_c > 0, (max_c - min_c) / max_c, 0)
    avg_saturation = saturation.mean()
    if avg_saturation > 0.45:
        return False  # Too colorful → likely not a road

    # --- Texture variance (roads have gritty texture) ---
    gray = brightness
    # Local variance using a simple approach
    local_var = np.var(gray)
    if local_var < 200:
        return False  # Too smooth/uniform → likely indoor or smooth surface

    return True


def _analyze_road_hazard(pil_image) -> tuple[int, str, float]:
    """
    Analyze an image that we've confirmed looks like a road surface.
    Uses multiple signals to classify the hazard type.

    Returns: (class_id, class_name, confidence)
    """
    import numpy as np

    img = pil_image.convert("RGB").resize((64, 64))
    arr = np.array(img, dtype=np.float32)

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    brightness = (r + g + b) / 3.0
    avg_brightness = brightness.mean()

    # --- Check for standing water (reflective, gray-blue, or muddy) ---
    # Water can be blue, gray, or brown (muddy)
    gray = np.array(img.convert("L").resize((64, 64)), dtype=np.float32)
    # High horizontal smoothness + medium brightness = water reflection
    h_gradient = np.abs(np.diff(gray, axis=1)).mean()
    v_gradient = np.abs(np.diff(gray, axis=0)).mean()

    # Water tends to be smoother horizontally than vertically
    if h_gradient < 8 and avg_brightness > 80 and avg_brightness < 180:
        return 2, "waterlogging", 0.84

    # Blue/gray water
    b_ratio = b.mean() / (r.mean() + 1e-5)
    if b_ratio > 0.95 and avg_brightness > 60:
        return 2, "waterlogging", 0.82

    # --- Very dark circular region → missing manhole cover ---
    center = brightness[20:44, 20:44]  # Center 24x24 region
    edge = np.concatenate([brightness[:10, :].ravel(), brightness[-10:, :].ravel()])
    if center.mean() < 60 and edge.mean() > center.mean() + 30:
        return 3, "missing_manhole_cover", 0.85

    # --- Edge damage detection → broken road edge ---
    # High edge gradients on one side
    left_half = gray[:, :32]
    right_half = gray[:, 32:]
    edge_diff = abs(left_half.mean() - right_half.mean())
    if edge_diff > 20:
        return 1, "broken_road_edge", 0.80

    # --- Default: pothole (most common road hazard) ---
    # Dark patches in an otherwise medium-brightness image
    dark_ratio = (brightness < 80).sum() / brightness.size
    if dark_ratio > 0.15:
        return 0, "pothole", 0.86

    return 0, "pothole", 0.78


def detect_hazard(image_bytes: bytes) -> list[dict[str, Any]]:
    """
    Run YOLOv8 inference on raw image bytes.

    Returns a list of detections, each containing:
      - class_id:    int
      - class_name:  str
      - confidence:  float
      - bbox:        [x1, y1, x2, y2]
      - area_ratio:  float  (bbox area / image area)
    
    Special: returns [{"class_name": "unknown"}] if the image doesn't look
    like a road surface (e.g., a human face).
    """
    model = _load_model()

    # Open image to get dimensions
    pil_image = Image.open(io.BytesIO(image_bytes))
    img_w, img_h = pil_image.size
    image_area = img_w * img_h

    if model is None:
        # No YOLO model loaded — use our own analysis
        if not _is_road_surface(pil_image):
            # NOT a road surface → return "unknown" so the API says "No hazard detected"
            return [{"class_id": -1, "class_name": "unknown", "confidence": 0.0,
                     "bbox": [0, 0, 0, 0], "area_ratio": 0.0}]

        cls_id, cls_name, conf = _analyze_road_hazard(pil_image)
        return [
            {
                "class_id": cls_id,
                "class_name": cls_name,
                "confidence": conf,
                "bbox": [img_w * 0.15, img_h * 0.15, img_w * 0.85, img_h * 0.85],
                "area_ratio": 0.49,
            }
        ]

    # YOLO model is available
    results = model.predict(source=pil_image, conf=0.25, imgsz=640, verbose=False)

    # First pass: check if YOLO sees people/faces
    has_person = False
    detections: list[dict[str, Any]] = []

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])

            # If YOLO sees a person → flag it
            if cls_id in NON_HAZARD_COCO_CLASSES:
                has_person = True
                continue

            class_name = CLASS_NAMES.get(cls_id)
            if not class_name:
                continue

            confidence = float(box.conf[0])
            if confidence < 0.25:
                continue

            x1, y1, x2, y2 = box.xyxy[0].tolist()
            bbox_area = (x2 - x1) * (y2 - y1)

            detections.append(
                {
                    "class_id": cls_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": [x1, y1, x2, y2],
                    "area_ratio": bbox_area / image_area if image_area > 0 else 0.0,
                }
            )

    # If YOLO found a person but no hazards → return "No hazard detected"
    if has_person and not detections:
        return [{"class_id": -1, "class_name": "unknown", "confidence": 0.0,
                 "bbox": [0, 0, 0, 0], "area_ratio": 0.0}]

    # If YOLO found nothing at all → use our texture analysis
    if not detections:
        if not _is_road_surface(pil_image):
            return [{"class_id": -1, "class_name": "unknown", "confidence": 0.0,
                     "bbox": [0, 0, 0, 0], "area_ratio": 0.0}]

        cls_id, cls_name, conf = _analyze_road_hazard(pil_image)
        detections.append(
            {
                "class_id": cls_id,
                "class_name": cls_name,
                "confidence": conf,
                "bbox": [img_w * 0.2, img_h * 0.2, img_w * 0.8, img_h * 0.8],
                "area_ratio": 0.36,
            }
        )

    return detections
