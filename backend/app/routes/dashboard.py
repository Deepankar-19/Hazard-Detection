"""
Municipal dashboard analytics routes.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.hazard import Hazard, HazardStatus
from app.schemas.dashboard import DashboardSummary, WardPerformance

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(db: AsyncSession = Depends(get_db)):
    """
    Overall platform statistics.

    Returns:
    • total hazards
    • severe hazards (HIGH)
    • average repair time (days between created_at and resolved_at)
    • unresolved hazards
    • verified hazards
    """
    # Total
    total_q = await db.execute(select(func.count()).select_from(Hazard))
    total = total_q.scalar() or 0

    # Severe
    severe_q = await db.execute(
        select(func.count()).select_from(Hazard).where(Hazard.severity_score == "HIGH")
    )
    severe = severe_q.scalar() or 0

    # Unresolved (not verified, not duplicate)
    unresolved_q = await db.execute(
        select(func.count())
        .select_from(Hazard)
        .where(Hazard.status.in_([HazardStatus.REPORTED, HazardStatus.UNDER_REVIEW]))
    )
    unresolved = unresolved_q.scalar() or 0

    # Verified
    verified_q = await db.execute(
        select(func.count()).select_from(Hazard).where(Hazard.status == HazardStatus.VERIFIED)
    )
    verified = verified_q.scalar() or 0

    # Average repair time
    avg_q = await db.execute(
        select(
            func.avg(
                func.extract("epoch", Hazard.resolved_at - Hazard.created_at) / 86400
            )
        )
        .select_from(Hazard)
        .where(Hazard.resolved_at.isnot(None))
    )
    avg_days = avg_q.scalar()

    return DashboardSummary(
        total_hazards=total,
        severe_hazards=severe,
        average_repair_time_days=round(avg_days, 2) if avg_days else None,
        unresolved_hazards=unresolved,
        verified_hazards=verified,
    )


@router.get("/ward-performance", response_model=list[WardPerformance])
async def ward_performance(db: AsyncSession = Depends(get_db)):
    """
    Per-ward breakdown of hazard counts and resolution times.
    """
    stmt = (
        select(
            Hazard.ward,
            func.count().label("total_hazards"),
            func.count(
                case(
                    (Hazard.status.in_([HazardStatus.VERIFIED, HazardStatus.RESOLVED_UNVERIFIED]), 1),
                )
            ).label("resolved_hazards"),
            func.avg(
                case(
                    (
                        Hazard.resolved_at.isnot(None),
                        func.extract("epoch", Hazard.resolved_at - Hazard.created_at) / 86400,
                    ),
                )
            ).label("avg_resolution_time"),
        )
        .where(Hazard.ward.isnot(None))
        .group_by(Hazard.ward)
        .order_by(func.count().desc())
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        WardPerformance(
            ward=row.ward,
            total_hazards=row.total_hazards,
            resolved_hazards=row.resolved_hazards,
            average_resolution_time_days=(
                round(row.avg_resolution_time, 2) if row.avg_resolution_time else None
            ),
        )
        for row in rows
    ]
