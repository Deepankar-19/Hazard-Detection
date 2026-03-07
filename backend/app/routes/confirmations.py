"""
Repair confirmation routes — contractor accountability.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.hazard import Hazard, HazardStatus
from app.models.hazard_confirmation import HazardConfirmation
from app.models.user import User
from app.schemas.hazard import ConfirmRepairRequest, ConfirmRepairResponse
from app.services.gamification import award_points, POINTS_REPAIR_CONFIRMED, POINTS_VERIFIED_HAZARD
from app.utils.security import get_current_user

router = APIRouter(tags=["Confirmations"])

MIN_CONFIRMATIONS = 3


@router.post("/confirm-repair", response_model=ConfirmRepairResponse)
async def confirm_repair(
    payload: ConfirmRepairRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm that a hazard has been repaired.

    Rules:
    • Hazard must be in `resolved_unverified` status.
    • Each user can confirm only once per hazard (unique constraint).
    • Once ≥ 3 unique confirmations are received, status → `verified`.
    """
    # Fetch hazard
    result = await db.execute(select(Hazard).where(Hazard.id == payload.hazard_id))
    hazard = result.scalar_one_or_none()
    if not hazard:
        raise HTTPException(status_code=404, detail="Hazard not found")

    if hazard.status != HazardStatus.RESOLVED_UNVERIFIED:
        raise HTTPException(
            status_code=400,
            detail=f"Hazard status is '{hazard.status.value}', must be 'resolved_unverified' to confirm.",
        )

    # Check if user already confirmed
    existing = await db.execute(
        select(HazardConfirmation).where(
            HazardConfirmation.hazard_id == payload.hazard_id,
            HazardConfirmation.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You have already confirmed this repair")

    # Add confirmation
    confirmation = HazardConfirmation(
        hazard_id=payload.hazard_id,
        user_id=current_user.id,
    )
    db.add(confirmation)

    # Award points for confirming
    await award_points(db, current_user.id, POINTS_REPAIR_CONFIRMED)

    # Count total confirmations
    count_result = await db.execute(
        select(func.count()).select_from(HazardConfirmation).where(
            HazardConfirmation.hazard_id == payload.hazard_id
        )
    )
    total = count_result.scalar() + 1  # +1 for the one we just added (not yet flushed)

    new_status = hazard.status.value

    if total >= MIN_CONFIRMATIONS:
        hazard.status = HazardStatus.VERIFIED
        new_status = HazardStatus.VERIFIED.value
        # Award the reporter bonus points
        await award_points(db, hazard.reported_by, POINTS_VERIFIED_HAZARD)

    await db.flush()

    return ConfirmRepairResponse(
        message="Confirmation recorded",
        total_confirmations=total,
        status=new_status,
    )
