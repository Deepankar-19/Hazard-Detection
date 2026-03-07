"""
Pydantic schemas for hazard reporting and map queries.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

class HazardPrediction(BaseModel):
    hazard_type: str
    confidence: float | None = None
    severity: str | None = None
    image_url: str | None = None
    repair_cost_estimate: float | None = None
    message: str | None = None


class HazardReportPayload(BaseModel):
    image_url: str
    hazard_type: str
    severity_score: str
    repair_cost_estimate: float
    latitude: float
    longitude: float
    timestamp: str | None = None
    road_type: str | None = None
    ward: str | None = None


class HazardOut(BaseModel):
    id: uuid.UUID
    image_url: str
    hazard_type: str
    severity_score: str
    repair_cost_estimate: float
    status: str
    latitude: float
    longitude: float
    road_type: str | None
    ward: str | None
    reporter_username: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None

    model_config = {"from_attributes": True}


class HazardMapQuery(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius: float = Field(default=5000, description="Radius in meters")
    severity: str | None = None
    status: str | None = None


class HazardHotspot(BaseModel):
    id: uuid.UUID
    latitude: float
    longitude: float
    risk_score: float
    predicted_date: str

    model_config = {"from_attributes": True}


class ConfirmRepairRequest(BaseModel):
    hazard_id: uuid.UUID


class ConfirmRepairResponse(BaseModel):
    message: str
    total_confirmations: int
    status: str
