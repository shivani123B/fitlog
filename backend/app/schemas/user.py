from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UserProfile(BaseModel):
    name: str
    age: int = Field(..., ge=1, le=120)
    height_cm: float | None = Field(None, ge=50, le=300)
    weight_kg: float | None = Field(None, gt=0)
    gender: Literal["Female", "Male", "Other", "Prefer not to say"] | None = None
    diet_category: Literal[
        "Vegetarian", "Eggetarian", "Non-vegetarian", "Vegan", "Prefer not to say"
    ] | None = None
    goal_weight_kg: float | None = Field(None, gt=0)
    weekly_active_minutes_goal: int = 150
    preferred_deficit: int = 500


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    profile: UserProfile
    created_at: datetime

    @classmethod
    def from_orm_user(cls, user) -> "UserRead":
        return cls(
            id=user.id,
            username=user.username,
            created_at=user.created_at,
            profile=UserProfile(
                name=user.name,
                age=user.age,
                height_cm=user.height_cm,
                weight_kg=user.weight_kg,
                gender=user.gender,
                diet_category=user.diet_category,
                goal_weight_kg=user.goal_weight_kg,
                weekly_active_minutes_goal=user.weekly_active_minutes_goal or 150,
                preferred_deficit=user.preferred_deficit or 500,
            ),
        )


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    age: int | None = Field(None, ge=1, le=120)
    height_cm: float | None = Field(None, ge=50, le=300)
    weight_kg: float | None = Field(None, gt=0)
    gender: Literal["Female", "Male", "Other", "Prefer not to say"] | None = None
    diet_category: Literal[
        "Vegetarian", "Eggetarian", "Non-vegetarian", "Vegan", "Prefer not to say"
    ] | None = None
    goal_weight_kg: float | None = None
    weekly_active_minutes_goal: int | None = Field(None, ge=10, le=1000)
    preferred_deficit: Literal[300, 500] | None = None
