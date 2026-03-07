"""
Hotspot prediction routes.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.hazard_prediction import HazardPrediction
from app.schemas.hazard import HazardHotspot

router = APIRouter(tags=["Hotspots"])


@router.get("/hazard-hotspots", response_model=list[HazardHotspot])
async def get_hotspots(db: AsyncSession = Depends(get_db)):
    """
    Return predicted hazard hotspots.

    Predictions are pre-computed by the ML pipeline and stored in
    the `hazard_predictions` table. Cached via Redis in production.
    """
    result = await db.execute(
        select(HazardPrediction)
        .order_by(HazardPrediction.risk_score.desc())
        .limit(100)
    )
    predictions = result.scalars().all()

    return [
        HazardHotspot(
            id=p.id,
            latitude=p.latitude,
            longitude=p.longitude,
            risk_score=p.risk_score,
            predicted_date=str(p.predicted_date),
        )
        for p in predictions
    ]
