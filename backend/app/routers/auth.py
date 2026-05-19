from __future__ import annotations

import random
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..models.calorie_intel import CalorieIntel
from ..models.user import User
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from ..services.auth_service import create_access_token, hash_password, verify_password

router = APIRouter()


def _generate_username(name: str, age: int) -> str:
    prefix = name.lower().replace(" ", "")[:3]
    age_suffix = str(age)[-2:].zfill(2)
    rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{prefix}{age_suffix}{rand}"


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    username = None
    for _ in range(200):
        candidate = _generate_username(body.name, body.age)
        if not db.query(User).filter(User.username == candidate).first():
            username = candidate
            break

    if username is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate a unique username",
        )

    user_id = f"{int(__import__('time').time() * 1000)}-{random.random()}"

    user = User(
        id=user_id,
        username=username,
        password_hash=hash_password(body.password),
        name=body.name.strip(),
        age=body.age,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
        gender=body.gender,
        diet_category=body.diet_category,
        goal_weight_kg=None,
        weekly_active_minutes_goal=150,
        preferred_deficit=500,
    )
    db.add(user)

    calorie_intel = CalorieIntel(
        user_id=user_id,
        age=body.age,
        gender=body.gender.lower() if body.gender in ("Female", "Male") else None,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
        activity_level=1.55,
    )
    db.add(calorie_intel)

    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.username)
    return TokenResponse(access_token=token, username=user.username)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(user.id, user.username)
    return TokenResponse(access_token=token, username=user.username)
