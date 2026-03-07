"""
Celery tasks for asynchronous / background processing.
"""

from app.celery_app import celery_app
from app.ml.hotspot_model import train_model as _train_hotspot


@celery_app.task(name="tasks.retrain_hotspot_model")
def retrain_hotspot_model():
    """Re-train the hotspot prediction model with latest data."""
    _train_hotspot()
    return {"status": "retrained"}


@celery_app.task(name="tasks.async_hazard_inference")
def async_hazard_inference(image_path: str):
    """
    Run hazard inference in a Celery worker (for heavy-load scenarios).
    In the default flow, inference runs inline for lower latency.
    """
    from app.ml.yolo_inference import detect_hazard
    from pathlib import Path

    img_bytes = Path(image_path).read_bytes()
    return detect_hazard(img_bytes)
