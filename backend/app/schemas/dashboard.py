from __future__ import annotations

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    latest_weight_kg: float | None = None
    start_weight_kg: float | None = None
    goal_weight_kg: float | None = None
    weekly_avg_calories: float | None = None
    log_streak: int = 0
    workout_streak: int = 0
    today_intake: float | None = None
    today_burn: float = 0
    today_net_deficit: float | None = None
    total_logs: int = 0
    total_workouts: int = 0
