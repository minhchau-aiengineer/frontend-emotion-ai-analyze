"""User management endpoints."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import users as users_repo
from app.schemas.user_schema import UserAuth, UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    if users_repo.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = users_repo.create_user(
        db,
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role or "member",
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    return UserOut.model_validate(user)


@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), limit: int = 200) -> List[UserOut]:
    users = users_repo.list_users(db, limit)
    return [UserOut.model_validate(user) for user in users]


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)) -> UserOut:
    user = users_repo.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, db: Session = Depends(get_db)) -> UserOut:
    user = users_repo.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = users_repo.update_user(
        db,
        user,
        full_name=payload.full_name,
        role=payload.role,
        is_active=payload.is_active,
        password=payload.password,
    )
    return UserOut.model_validate(updated_user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_user(user_id: str, db: Session = Depends(get_db)) -> Response:
    user = users_repo.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    users_repo.delete_user(db, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/login")
def authenticate_user(payload: UserAuth, db: Session = Depends(get_db)) -> dict:
    user = users_repo.verify_credentials(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"user_id": user.id, "role": user.role}
