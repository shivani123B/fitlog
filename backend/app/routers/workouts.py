from __future__ import annotations

import random
import time
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db
from ..models.user import User
from ..models.workout import Workout
from ..schemas.workout import WorkoutCreate, WorkoutRead

router = APIRouter()


@router.get("", response_model=list[WorkoutRead])
def list_workouts(
    date: str | None = None,
    sort: Literal["asc", "desc"] = "desc",
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Workout).filter(Workout.user_id == current_user.id)
    if date:
        q = q.filter(Workout.date == date)

    order = Workout.date.asc() if sort == "asc" else Workout.date.desc()
    workouts = q.order_by(order).offset(offset).limit(limit).all()
    return [WorkoutRead.model_validate(w) for w in workouts]


@router.post("", response_model=WorkoutRead, status_code=status.HTTP_201_CREATED)
def create_workout(
    body: WorkoutCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout_id = f"{int(time.time() * 1000)}-{random.random():.12f}"[: 20]

    workout = Workout(
        id=workout_id,
        user_id=current_user.id,
        date=body.date,
        workout_name=body.workout_name.strip(),
        category=body.category,
        duration_min=body.duration_min,
        met=body.met,
        calories_burned=body.calories_burned,
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return WorkoutRead.model_validate(workout)


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")

    db.delete(workout)
    db.commit()
