from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from .log import LogCreate, LogRead
from .user import UserRead
from .workout import WorkoutCreate, WorkoutRead


class ExportResponse(BaseModel):
    version: int = 1
    exported_at: datetime
    user: UserRead
    logs: list[LogRead]
    workouts: list[WorkoutRead]


class ImportRequest(BaseModel):
    version: int = Field(1, ge=1, le=1)
    logs: list[LogCreate] = []
    workouts: list[WorkoutCreate] = []
