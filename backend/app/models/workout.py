from __future__ import annotations

from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False, index=True)
    workout_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    duration_min = Column(Integer, nullable=False)
    met = Column(Float, nullable=False)
    calories_burned = Column(Float, nullable=False)

    user = relationship("User", back_populates="workouts")
