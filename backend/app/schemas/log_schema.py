"""Pydantic schemas for system logs."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LogEntry(BaseModel):
    id: str
    timestamp: datetime
    source: str
    action: str
    level: str
    message: str
    user: Optional[str] = None
    related_id: Optional[str] = None
    meta: Optional[dict] = None

    class Config:
        from_attributes = True


class LogCreate(BaseModel):
    source: str = Field(..., example="system")
    action: str = Field(..., example="UPLOAD_FILE")
    level: str = Field(..., example="info")
    message: str
    user: Optional[str] = None
    related_id: Optional[str] = None
    meta: Optional[dict] = None
