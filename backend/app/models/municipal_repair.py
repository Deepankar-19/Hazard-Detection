"""
Municipal repair tracking model.
"""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import String, Boolean, ForeignKey, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MunicipalRepair(Base):
    __tablename__ = "municipal_repairs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hazard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hazards.id"), unique=True, nullable=False
    )
    contractor_id: Mapped[str] = mapped_column(String(100), nullable=False)
    repair_status: Mapped[str] = mapped_column(String(30), default="in_progress", nullable=False)
    repair_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    hazard = relationship("Hazard", back_populates="repair")
