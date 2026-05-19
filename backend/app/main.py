from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, calorie_intel, dashboard, data, logs, users, workouts


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="FitLog API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(logs.router, prefix="/logs", tags=["logs"])
app.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
app.include_router(calorie_intel.router, prefix="/calorie-intel", tags=["calorie-intel"])
app.include_router(data.router, prefix="/data", tags=["data"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])


@app.get("/health")
def health():
    return {"status": "ok"}
