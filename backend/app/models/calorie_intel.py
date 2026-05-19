from __future__ import annotations

from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class CalorieIntel(Base):
    __tablename__ = "calorie_intel"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    activity_level = Column(Float, nullable=True)
    goal_weight_kg = Column(Float, nullable=True)

    user = relationship("User", back_populates="calorie_intel")
