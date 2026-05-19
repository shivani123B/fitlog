from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db
from ..models.calorie_intel import CalorieIntel
from ..models.user import User
from ..schemas.calorie_intel import CalorieIntelRead, CalorieIntelUpdate

router = APIRouter()


@router.get("", response_model=CalorieIntelRead)
def get_calorie_intel(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ci = db.query(CalorieIntel).filter(CalorieIntel.user_id == current_user.id).first()
    if ci is None:
        return CalorieIntelRead()

    return CalorieIntelRead(
        age=ci.age,
        gender=ci.gender,
        height_cm=ci.height_cm,
        weight_kg=ci.weight_kg,
        activity_level=ci.activity_level,
        goal_weight_kg=ci.goal_weight_kg,
    )


@router.put("", response_model=CalorieIntelRead)
def update_calorie_intel(
    body: CalorieIntelUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ci = db.query(CalorieIntel).filter(CalorieIntel.user_id == current_user.id).first()
    if ci is None:
        ci = CalorieIntel(user_id=current_user.id)
        db.add(ci)

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(ci, field, value)

    if body.goal_weight_kg is not None:
        current_user.goal_weight_kg = body.goal_weight_kg

    db.commit()
    db.refresh(ci)

    return CalorieIntelRead(
        age=ci.age,
        gender=ci.gender,
        height_cm=ci.height_cm,
        weight_kg=ci.weight_kg,
        activity_level=ci.activity_level,
        goal_weight_kg=ci.goal_weight_kg,
    )
