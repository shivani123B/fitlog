from __future__ import annotations

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False, index=True)
    morning_weight_kg = Column(Float, nullable=True)
    calories = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    fiber_g = Column(Float, nullable=True)
    steps = Column(Integer, nullable=True)
    meals_json = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="logs")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_date"),
    )
