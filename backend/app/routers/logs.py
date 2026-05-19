from __future__ import annotations

import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db
from ..models.log import Log
from ..models.user import User
from ..schemas.log import LogCreate, LogRead, LogUpdate, MealsSchema

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


@router.get("", response_model=list[LogRead])
def list_logs(
    sort: Literal["asc", "desc"] = "desc",
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = Log.date.asc() if sort == "asc" else Log.date.desc()
    logs = (
        db.query(Log)
        .filter(Log.user_id == current_user.id)
        .order_by(order)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_log_to_read(log) for log in logs]


@router.get("/{date}", response_model=LogRead)
def get_log(
    date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = (
        db.query(Log)
        .filter(Log.user_id == current_user.id, Log.date == date)
        .first()
    )
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    return _log_to_read(log)


@router.post("", response_model=LogRead, status_code=status.HTTP_201_CREATED)
def create_log(
    body: LogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Log)
        .filter(Log.user_id == current_user.id, Log.date == body.date)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Log already exists for {body.date}",
        )

    log = Log(
        user_id=current_user.id,
        date=body.date,
        morning_weight_kg=body.morning_weight_kg,
        calories=body.calories,
        protein_g=body.protein_g,
        carbs_g=body.carbs_g,
        fat_g=body.fat_g,
        fiber_g=body.fiber_g,
        steps=body.steps,
        meals_json=body.meals.model_dump_json(),
        notes=body.notes.strip() if body.notes else "",
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _log_to_read(log)


@router.put("/{date}", response_model=LogRead)
def update_log(
    date: str,
    body: LogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = (
        db.query(Log)
        .filter(Log.user_id == current_user.id, Log.date == date)
        .first()
    )
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field == "meals":
            log.meals_json = value.model_dump_json() if value else log.meals_json
        elif field == "notes":
            log.notes = value.strip() if value else ""
        else:
            setattr(log, field, value)

    db.commit()
    db.refresh(log)
    return _log_to_read(log)


@router.delete("/{date}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = (
        db.query(Log)
        .filter(Log.user_id == current_user.id, Log.date == date)
        .first()
    )
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")

    db.delete(log)
    db.commit()
