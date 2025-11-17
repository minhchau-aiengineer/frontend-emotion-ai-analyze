"""Pydantic schemas for review queue endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReviewItem(BaseModel):
    id: str
    module: str
    original_id: str
    source_label: Optional[str] = None
    label: Optional[str] = None
    confidence: Optional[float] = None
    deleted_by: Optional[str] = None
    deleted_at: datetime
    size_bytes: Optional[int] = None
    payload: Optional[dict] = None

    class Config:
        from_attributes = True
