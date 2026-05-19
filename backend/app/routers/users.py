from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_current_user, get_db
from ..models.user import User
from ..schemas.user import UserRead, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserRead.from_orm_user(current_user)


@router.put("/me", response_model=UserRead)
def update_profile(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return UserRead.from_orm_user(current_user)
