from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"


class WorkoutCreate(BaseModel):
    date: str = Field(..., pattern=DATE_PATTERN)
    workout_name: str = Field(..., min_length=1, max_length=200)
    category: Literal["Cardio", "Strength", "Other"]
    duration_min: int = Field(..., ge=1, le=600)
    met: float = Field(..., gt=0)
    calories_burned: float = Field(..., ge=0)

    @field_validator("date")
    @classmethod
    def validate_date_is_real(cls, v: str) -> str:
        datetime.strptime(v, "%Y-%m-%d")
        return v


class WorkoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    date: str
    workout_name: str
    category: str
    duration_min: int
    met: float
    calories_burned: float
