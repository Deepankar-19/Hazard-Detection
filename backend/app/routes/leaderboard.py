"""
Gamified leaderboard routes.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.dashboard import LeaderboardEntry

router = APIRouter(tags=["Leaderboard"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    city: str | None = Query(default=None, description="Filter by city"),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Return top users by points, optionally filtered by city."""
    stmt = select(User).order_by(User.points.desc()).limit(limit)
    if city:
        stmt = stmt.where(User.city == city)

    result = await db.execute(stmt)
    users = result.scalars().all()

    return [
        LeaderboardEntry(username=u.username, points=u.points, city=u.city)
        for u in users
    ]
