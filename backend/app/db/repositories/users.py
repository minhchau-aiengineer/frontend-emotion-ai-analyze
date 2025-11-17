"""Repository helpers for user management."""
from __future__ import annotations

import hashlib
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db import models


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def create_user(
    db: Session,
    *,
    email: str,
    password: str,
    full_name: Optional[str] = None,
    role: str = "member",
    is_active: bool = True,
) -> models.User:
    user = models.User(
        email=email.lower(),
        password_hash=_hash_password(password),
        full_name=full_name,
        role=role,
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session, limit: int = 200) -> list[models.User]:
    return (
        db.query(models.User)
        .order_by(desc(models.User.created_at))
        .limit(limit)
        .all()
    )


def get_user(db: Session, user_id: str) -> Optional[models.User]:
    return db.get(models.User, user_id)


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return (
        db.query(models.User)
        .filter(models.User.email == email.lower())
        .one_or_none()
    )


def update_user(
    db: Session,
    user: models.User,
    *,
    full_name: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    password: Optional[str] = None,
) -> models.User:
    if full_name is not None:
        user.full_name = full_name
    if role is not None:
        user.role = role
    if is_active is not None:
        user.is_active = is_active
    if password:
        user.password_hash = _hash_password(password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: models.User) -> None:
    db.delete(user)
    db.commit()


def verify_credentials(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if user.password_hash != _hash_password(password):
        return None
    return user
