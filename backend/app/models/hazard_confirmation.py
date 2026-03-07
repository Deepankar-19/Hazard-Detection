"""
Hazard confirmation model — citizens verify completed repairs.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HazardConfirmation(Base):
    __tablename__ = "hazard_confirmations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hazard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hazards.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    confirmation_status: Mapped[str] = mapped_column(
        String(20), default="confirmed", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    hazard = relationship("Hazard", back_populates="confirmations")
    user = relationship("User", back_populates="confirmations")

    __table_args__ = (
        UniqueConstraint("hazard_id", "user_id", name="uq_hazard_user_confirmation"),
    )
