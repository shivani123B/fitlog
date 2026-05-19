from __future__ import annotations

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db
from ..models.log import Log
from ..models.user import User
from ..models.workout import Workout
from ..schemas.dashboard import DashboardSummary

router = APIRouter()


def _compute_streak(dates: list[str]) -> int:
    if not dates:
        return 0

    sorted_dates = sorted({d for d in dates}, reverse=True)
    parsed = [datetime.strptime(d, "%Y-%m-%d").date() for d in sorted_dates]

    today = date.today()
    if parsed[0] != today and parsed[0] != today - timedelta(days=1):
        return 0

    streak = 1
    for i in range(1, len(parsed)):
        if parsed[i - 1] - parsed[i] == timedelta(days=1):
            streak += 1
        else:
            break
    return streak


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()

    logs = (
        db.query(Log)
        .filter(Log.user_id == current_user.id)
        .order_by(Log.date.asc())
        .all()
    )
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == current_user.id)
        .all()
    )

    start_weight = None
    latest_weight = None
    for log in logs:
        if log.morning_weight_kg is not None:
            if start_weight is None:
                start_weight = log.morning_weight_kg
            latest_weight = log.morning_weight_kg

    recent_logs = [l for l in logs if l.calories is not None][-7:]
    weekly_avg = None
    if recent_logs:
        weekly_avg = round(sum(l.calories for l in recent_logs) / len(recent_logs), 1)

    today_log = next((l for l in logs if l.date == today_str), None)
    today_intake = today_log.calories if today_log else None

    today_workouts = [w for w in workouts if w.date == today_str]
    today_burn = round(sum(w.calories_burned for w in today_workouts), 1)

    today_net = None
    if today_intake is not None:
        today_net = round(today_intake - today_burn, 1)

    log_dates = [l.date for l in logs]
    workout_dates = [w.date for w in workouts]

    return DashboardSummary(
        latest_weight_kg=latest_weight,
        start_weight_kg=start_weight,
        goal_weight_kg=current_user.goal_weight_kg,
        weekly_avg_calories=weekly_avg,
        log_streak=_compute_streak(log_dates),
        workout_streak=_compute_streak(workout_dates),
        today_intake=today_intake,
        today_burn=today_burn,
        today_net_deficit=today_net,
        total_logs=len(logs),
        total_workouts=len(workouts),
    )
