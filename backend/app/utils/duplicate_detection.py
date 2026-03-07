"""
Duplicate hazard detection using PostGIS proximity + time window.
"""

from datetime import datetime, timedelta, timezone

from geoalchemy2.functions import ST_DWithin, ST_GeogFromText
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hazard import Hazard


async def is_duplicate_hazard(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    hazard_type: str,
    *,
    distance_meters: float = 5.0,
    time_window_minutes: int = 10,
) -> bool:
    """
    Return True if a hazard of the same type exists within `distance_meters`
    and was reported within the last `time_window_minutes`.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=time_window_minutes)
    point_wkt = f"SRID=4326;POINT({longitude} {latitude})"

    stmt = select(Hazard.id).where(
        and_(
            Hazard.hazard_type == hazard_type,
            Hazard.created_at >= cutoff,
            ST_DWithin(
                Hazard.location,
                ST_GeogFromText(point_wkt),
                distance_meters,
            ),
        )
    ).limit(1)

    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None
