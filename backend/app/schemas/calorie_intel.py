from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

VALID_ACTIVITY_LEVELS = {1.2, 1.375, 1.55, 1.725, 1.9}


class CalorieIntelUpdate(BaseModel):
    age: int | None = Field(None, ge=1, le=120)
    gender: Literal["male", "female"] | None = None
    height_cm: float | None = Field(None, ge=50, le=300)
    weight_kg: float | None = Field(None, gt=0)
    activity_level: float | None = None
    goal_weight_kg: float | None = Field(None, gt=0)

    @field_validator("activity_level")
    @classmethod
    def validate_activity_level(cls, v):
        if v is not None and v not in VALID_ACTIVITY_LEVELS:
            raise ValueError(f"activity_level must be one of {sorted(VALID_ACTIVITY_LEVELS)}")
        return v


class CalorieIntelRead(BaseModel):
    age: int | None = None
    gender: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    activity_level: float | None = None
    goal_weight_kg: float | None = None
