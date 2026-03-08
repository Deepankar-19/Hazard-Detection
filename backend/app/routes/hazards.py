"""
Hazard routes — report hazard and public hazard map.
"""

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, HTTPException
from geoalchemy2.functions import ST_DWithin, ST_GeogFromText
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.hazard import Hazard
from app.models.user import User
from app.schemas.hazard import HazardOut, HazardPrediction, HazardReportPayload
from app.services.hazard_service import predict_hazard_info, submit_hazard_report
from app.utils.security import get_current_user
from app.utils.validators import validate_image, validate_gps

router = APIRouter(tags=["Hazards"])


# ──────────────────────────────────────
# POST /predict-hazard
# ──────────────────────────────────────
@router.post("/predict-hazard", response_model=list[HazardPrediction], status_code=200)
async def predict_hazard(
    image: UploadFile = File(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
):
    """
    Step 1: Upload image and get AI prediction.
    """
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Image file is missing")

    validate_image(image)
    validate_gps(latitude, longitude)

    try:
        image_bytes = await image.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read image file")
    
    try:
        predictions = await predict_hazard_info(
            image_bytes=image_bytes,
            content_type=image.content_type or "image/jpeg",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")
    
    # If the service returned the 'none' fallback
    if len(predictions) == 1 and predictions[0]["hazard_type"] == "unknown":
        return [
            HazardPrediction(
                hazard_type="none",
                confidence=0.0,
                severity_score=0.0,
                severity_level="None",
                estimated_repair_cost=0.0,
                message="No hazard detected"
            )
        ]
    
    results = []
    for pred in predictions:
        results.append(HazardPrediction(
            hazard_type=pred["hazard_type"],
            confidence=pred["confidence"],
            severity_score=pred["severity_score"],
            severity_level=pred["severity_level"],
            estimated_repair_cost=pred["estimated_repair_cost"]
        ))
        
    return results

# ──────────────────────────────────────
# POST /report-hazard
# ──────────────────────────────────────
@router.post("/report-hazard", response_model=HazardOut, status_code=201)
async def report_hazard(
    payload: HazardReportPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Step 2: Submit verified report to database.
    """
    validate_gps(payload.latitude, payload.longitude)

    hazard = await submit_hazard_report(
        db=db,
        user_id=current_user.id,
        image_url=payload.image_url,
        hazard_type=payload.hazard_type,
        severity_score=payload.severity_level, # Mapped from string "Low", "Medium", "High"
        repair_cost_estimate=payload.repair_cost_estimate,
        latitude=payload.latitude,
        longitude=payload.longitude,
        road_type=payload.road_type,
        ward=payload.ward,
    )

    return HazardOut(
        id=hazard.id,
        image_url=hazard.image_url,
        hazard_type=hazard.hazard_type,
        severity_score=hazard.severity_score,
        repair_cost_estimate=hazard.repair_cost_estimate,
        status=hazard.status.value,
        latitude=hazard.latitude,
        longitude=hazard.longitude,
        road_type=hazard.road_type,
        ward=hazard.ward,
        reporter_username=current_user.username,
        created_at=hazard.created_at,
    )


# ──────────────────────────────────────
# GET /hazards  — public map
# ──────────────────────────────────────
@router.get("/hazards", response_model=list[HazardOut])
async def get_hazards(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius: float = Query(default=5000, description="Radius in meters"),
    severity: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch hazards within a geographic radius.

    Uses PostGIS `ST_DWithin` on the `Geography(POINT)` column
    for accurate metre-based distance filtering.
    """
    point_wkt = f"SRID=4326;POINT({longitude} {latitude})"

    conditions = [
        ST_DWithin(Hazard.location, ST_GeogFromText(point_wkt), radius),
    ]
    if severity:
        conditions.append(Hazard.severity_score == severity)
    if status:
        conditions.append(Hazard.status == status)

    stmt = (
        select(Hazard)
        .where(and_(*conditions))
        .order_by(Hazard.created_at.desc())
        .limit(200)
    )
    result = await db.execute(stmt)
    hazards = result.scalars().all()

    return [
        HazardOut(
            id=h.id,
            image_url=h.image_url,
            hazard_type=h.hazard_type,
            severity_score=h.severity_score,
            repair_cost_estimate=h.repair_cost_estimate,
            status=h.status.value,
            latitude=h.latitude,
            longitude=h.longitude,
            road_type=h.road_type,
            ward=h.ward,
            created_at=h.created_at,
            resolved_at=h.resolved_at,
        )
        for h in hazards
    ]
