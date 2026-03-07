"""
Pydantic schemas for the municipal dashboard.
"""

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_hazards: int
    severe_hazards: int
    average_repair_time_days: float | None
    unresolved_hazards: int
    verified_hazards: int


class WardPerformance(BaseModel):
    ward: str
    total_hazards: int
    resolved_hazards: int
    average_resolution_time_days: float | None


class LeaderboardEntry(BaseModel):
    username: str
    points: int
    city: str | None

    model_config = {"from_attributes": True}
