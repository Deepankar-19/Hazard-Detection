"""
Hazard service — orchestrates the full hazard reporting pipeline.

Steps:
1. Validate request
2. Upload image to S3/MinIO
3. Run ML inference → hazard classification
4. Calculate severity score
5. Estimate repair cost
6. Check for duplicates
7. Save hazard record to DB
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hazard import Hazard, HazardStatus
from app.ml.yolo_inference import detect_hazard
from app.ml.severity import compute_severity
from app.ml.cost_estimator import estimate_cost
from app.services.storage import upload_image
from app.services.gamification import award_points, POINTS_REPORT_HAZARD
from app.utils.duplicate_detection import is_duplicate_hazard


async def predict_hazard_info(
    image_bytes: bytes,
    content_type: str,
    road_type: str = "city road",
) -> list[dict]:
    """Uploads image, runs inference, scores severity, and estimates cost."""
    # 1. Upload image
    image_url = upload_image(image_bytes, content_type)

    # 2. Run ML inference
    detections = detect_hazard(image_bytes)

    # Pick all detections instead of just the primary one
    predictions = []
    
    if detections:
        for det in detections:
            hazard_type = det["class_name"]
            area_ratio = det["area_ratio"]
            confidence = det["confidence"]

            # 3. Severity
            severity_info = compute_severity(area_ratio)

            # 4. Repair cost
            # Note: We pass the string level to the estimator to maintain compatibility
            cost = estimate_cost(hazard_type, severity_info["severity_level"].upper(), road_type)

            predictions.append({
                "hazard_type": hazard_type,
                "confidence": confidence,
                "severity_score": severity_info["severity_score"],
                "severity_level": severity_info["severity_level"],
                "estimated_repair_cost": cost,
            })
    else:
        # Return fallback for 'none' case
        predictions.append({
            "hazard_type": "unknown",
            "confidence": 0.0,
            "severity_score": 0.0,
            "severity_level": "None",
            "estimated_repair_cost": 0.0,
        })

    return predictions


async def submit_hazard_report(
    db: AsyncSession,
    user_id: uuid.UUID,
    image_url: str,
    hazard_type: str,
    severity_score: str,
    repair_cost_estimate: float,
    latitude: float,
    longitude: float,
    road_type: str | None = None,
    ward: str | None = None,
) -> Hazard:
    """Takes verified data and saves to DB, with duplicate check & gamification."""
    # 1. Duplicate check
    duplicate = await is_duplicate_hazard(db, latitude, longitude, hazard_type)
    status = HazardStatus.DUPLICATE if duplicate else HazardStatus.REPORTED

    # 2. Save
    point_wkt = f"SRID=4326;POINT({longitude} {latitude})"
    hazard = Hazard(
        image_url=image_url,
        hazard_type=hazard_type,
        severity_score=severity_score,
        repair_cost_estimate=repair_cost_estimate,
        status=status,
        road_type=road_type,
        latitude=latitude,
        longitude=longitude,
        location=point_wkt,
        reported_by=user_id,
        ward=ward,
    )
    db.add(hazard)

    # 3. Award points (only if not duplicate)
    if status != HazardStatus.DUPLICATE:
        await award_points(db, user_id, POINTS_REPORT_HAZARD)

    await db.flush()
    return hazard
