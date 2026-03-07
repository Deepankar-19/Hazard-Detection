"""
Predictive hazard hotspot model.
"""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Float, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HazardPrediction(Base):
    __tablename__ = "hazard_predictions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
