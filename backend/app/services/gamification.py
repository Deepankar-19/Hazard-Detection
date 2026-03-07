"""
Gamification service — point awards for citizen actions.
"""

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

# Point values
POINTS_REPORT_HAZARD = 10
POINTS_REPAIR_CONFIRMED = 30
POINTS_VERIFIED_HAZARD = 20


async def award_points(db: AsyncSession, user_id, points: int) -> None:
    """Add points to a user's total."""
    await db.execute(
        update(User).where(User.id == user_id).values(points=User.points + points)
    )
