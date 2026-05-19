from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=1, le=120)
    password: str = Field(..., min_length=8, max_length=128)
    gender: Literal["Female", "Male", "Other", "Prefer not to say"] | None = None
    diet_category: Literal[
        "Vegetarian", "Eggetarian", "Non-vegetarian", "Vegan", "Prefer not to say"
    ] | None = None
    height_cm: float | None = Field(None, ge=50, le=300)
    weight_kg: float | None = Field(None, gt=0)


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
