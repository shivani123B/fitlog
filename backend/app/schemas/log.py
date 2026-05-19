from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"


class ComputedMacros(BaseModel):
    calories: float = 0
    proteinG: float = 0
    carbsG: float = 0
    fatG: float = 0
    fiberG: float = 0


class FoodItemSchema(BaseModel):
    id: str
    mode: Literal["manual", "off", "generic"]
    name: str
    grams: float = 0
    selected: dict | None = None
    manual: dict | None = None
    computed: ComputedMacros = ComputedMacros()


class MealSchema(BaseModel):
    time: str = ""
    items: list[FoodItemSchema] = []


class MealsSchema(BaseModel):
    breakfast: MealSchema = MealSchema()
    lunch: MealSchema = MealSchema()
    dinner: MealSchema = MealSchema()
    snacks: MealSchema = MealSchema()


class LogCreate(BaseModel):
    date: str = Field(..., pattern=DATE_PATTERN)
    morning_weight_kg: float | None = Field(None, gt=0)
    calories: float | None = Field(None, ge=0)
    protein_g: float | None = Field(None, ge=0)
    carbs_g: float | None = Field(None, ge=0)
    fat_g: float | None = Field(None, ge=0)
    fiber_g: float | None = Field(None, ge=0)
    steps: int | None = Field(None, ge=0)
    meals: MealsSchema = MealsSchema()
    notes: str = ""

    @field_validator("date")
    @classmethod
    def validate_date_is_real(cls, v: str) -> str:
        datetime.strptime(v, "%Y-%m-%d")
        return v


class LogUpdate(BaseModel):
    morning_weight_kg: float | None = Field(None, gt=0)
    calories: float | None = Field(None, ge=0)
    protein_g: float | None = Field(None, ge=0)
    carbs_g: float | None = Field(None, ge=0)
    fat_g: float | None = Field(None, ge=0)
    fiber_g: float | None = Field(None, ge=0)
    steps: int | None = Field(None, ge=0)
    meals: MealsSchema | None = None
    notes: str | None = None


class LogRead(BaseModel):
    date: str
    morning_weight_kg: float | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fiber_g: float | None = None
    steps: int | None = None
    meals: MealsSchema = MealsSchema()
    notes: str = ""
