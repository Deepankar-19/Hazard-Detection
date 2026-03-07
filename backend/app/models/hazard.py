"""
Hazard model with PostGIS geography column.
"""

import enum
import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geography
from sqlalchemy import (
    String, Float, Enum, DateTime, ForeignKey, Index, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HazardStatus(str, enum.Enum):
    REPORTED = "reported"
    UNDER_REVIEW = "under_review"
    RESOLVED_UNVERIFIED = "resolved_unverified"
    VERIFIED = "verified"
    DUPLICATE = "duplicate"


class Hazard(Base):
    __tablename__ = "hazards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    hazard_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    severity_score: Mapped[str] = mapped_column(String(10), nullable=False)  # LOW / MEDIUM / HIGH
    repair_cost_estimate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[HazardStatus] = mapped_column(
        Enum(HazardStatus), default=HazardStatus.REPORTED, nullable=False, index=True,
    )
    road_type: Mapped[str | None] = mapped_column(String(30), nullable=True)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    location = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=False
    )

    reported_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    ward: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    reporter = relationship("User", back_populates="hazards", lazy="selectin")
    confirmations = relationship("HazardConfirmation", back_populates="hazard", lazy="selectin")
    repair = relationship("MunicipalRepair", back_populates="hazard", uselist=False, lazy="selectin")

    __table_args__ = (
        Index("idx_hazard_location", "location", postgresql_using="gist"),
        Index("idx_hazard_severity", "severity_score"),
        Index("idx_hazard_created", "created_at"),
    )
