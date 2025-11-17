"""Repository helpers for the review (trash) queue."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db import models


def add_item(
    db: Session,
    *,
    module: str,
    original_id: str,
    source_label: Optional[str],
    label: Optional[str],
    confidence: Optional[float],
    deleted_by: Optional[str],
    size_bytes: Optional[int],
    payload: Optional[dict],
) -> models.ReviewQueueItem:
    item = models.ReviewQueueItem(
        module=module,
        original_id=original_id,
        source_label=source_label,
        label=label,
        confidence=confidence,
        deleted_by=deleted_by,
        size_bytes=size_bytes,
        payload=payload,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def list_items(db: Session, limit: int = 200) -> list[models.ReviewQueueItem]:
    return (
        db.query(models.ReviewQueueItem)
        .order_by(desc(models.ReviewQueueItem.deleted_at))
        .limit(limit)
        .all()
    )


def delete_item(db: Session, item_id: str) -> bool:
    item = db.get(models.ReviewQueueItem, item_id)
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def empty(db: Session) -> None:
    db.query(models.ReviewQueueItem).delete()
    db.commit()
