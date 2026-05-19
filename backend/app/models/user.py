from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, Integer, String, func
from sqlalchemy.orm import relationship

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    gender = Column(String, nullable=True)
    diet_category = Column(String, nullable=True)
    goal_weight_kg = Column(Float, nullable=True)
    weekly_active_minutes_goal = Column(Integer, default=150)
    preferred_deficit = Column(Integer, default=500)
    created_at = Column(DateTime, server_default=func.now())

    logs = relationship("Log", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    calorie_intel = relationship(
        "CalorieIntel", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
