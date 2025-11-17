"""Repository helpers for system log entries."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db import models


def append(
    db: Session,
    *,
    source: str,
    action: str,
    level: str,
    message: str,
    user: Optional[str],
    related_id: Optional[str],
    meta: Optional[dict],
) -> models.SystemLog:
    entry = models.SystemLog(
        source=source,
        action=action,
        level=level,
        message=message,
        user=user,
        related_id=related_id,
        meta=meta,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_logs(db: Session, limit: int = 200) -> list[models.SystemLog]:
    return (
        db.query(models.SystemLog)
        .order_by(desc(models.SystemLog.timestamp))
        .limit(limit)
        .all()
    )


def delete_log(db: Session, log_id: str) -> bool:
    entry = db.get(models.SystemLog, log_id)
    if not entry:
        return False
    db.delete(entry)
    db.commit()
    return True


def clear(db: Session) -> None:
    db.query(models.SystemLog).delete()
    db.commit()
