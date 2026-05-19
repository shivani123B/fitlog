from __future__ import annotations

import json
import random
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db
from ..models.log import Log
from ..models.user import User
from ..models.workout import Workout
from ..schemas.export import ExportResponse, ImportRequest
from ..schemas.log import LogRead, MealsSchema
from ..schemas.user import UserRead
from ..schemas.workout import WorkoutRead

router = APIRouter()


def _log_to_read(log: Log) -> LogRead:
    meals = MealsSchema()
    if log.meals_json:
        meals = MealsSchema.model_validate(json.loads(log.meals_json))
    return LogRead(
        date=log.date,
        morning_weight_kg=log.morning_weight_kg,
        calories=log.calories,
        protein_g=log.protein_g,
        carbs_g=log.carbs_g,
        fat_g=log.fat_g,
        fiber_g=log.fiber_g,
        steps=log.steps,
        meals=meals,
        notes=log.notes or "",
    )


@router.get("/export", response_model=ExportResponse)
def export_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = db.query(Log).filter(Log.user_id == current_user.id).order_by(Log.date.asc()).all()
    workouts = (
        db.query(Workout).filter(Workout.user_id == current_user.id).order_by(Workout.date.asc()).all()
    )

    return ExportResponse(
        version=1,
        exported_at=datetime.now(timezone.utc),
        user=UserRead.from_orm_user(current_user),
        logs=[_log_to_read(log) for log in logs],
        workouts=[WorkoutRead.model_validate(w) for w in workouts],
    )


@router.post("/import", status_code=status.HTTP_200_OK)
def import_data(
    body: ImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dates_seen: set[str] = set()
    for log_entry in body.logs:
        if log_entry.date in dates_seen:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Duplicate date in import: {log_entry.date}",
            )
        dates_seen.add(log_entry.date)

    db.query(Log).filter(Log.user_id == current_user.id).delete()
    db.query(Workout).filter(Workout.user_id == current_user.id).delete()

    for log_entry in body.logs:
        log = Log(
            user_id=current_user.id,
            date=log_entry.date,
            morning_weight_kg=log_entry.morning_weight_kg,
            calories=log_entry.calories,
            protein_g=log_entry.protein_g,
            carbs_g=log_entry.carbs_g,
            fat_g=log_entry.fat_g,
            fiber_g=log_entry.fiber_g,
            steps=log_entry.steps,
            meals_json=log_entry.meals.model_dump_json(),
            notes=log_entry.notes.strip() if log_entry.notes else "",
        )
        db.add(log)

    for w_entry in body.workouts:
        workout_id = f"{int(time.time() * 1000)}-{random.random():.12f}"[:20]
        workout = Workout(
            id=workout_id,
            user_id=current_user.id,
            date=w_entry.date,
            workout_name=w_entry.workout_name.strip(),
            category=w_entry.category,
            duration_min=w_entry.duration_min,
            met=w_entry.met,
            calories_burned=w_entry.calories_burned,
        )
        db.add(workout)

    db.commit()

    return {
        "message": "Import successful",
        "logs_imported": len(body.logs),
        "workouts_imported": len(body.workouts),
    }
