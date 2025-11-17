"""Pydantic schemas for analytics-related endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AudioResult(BaseModel):
    id: str
    source_name: str
    label: str
    confidence: float
    latency_ms: int
    created_at: datetime
    file_url: Optional[str] = None
    raw_result: Optional[dict] = None

    class Config:
        from_attributes = True


class VisionResult(BaseModel):
    id: str
    source_name: Optional[str] = None
    label: str
    confidence: float
    latency_ms: int
    image_url: Optional[str] = None
    result_url: Optional[str] = None
    face_locations: Optional[dict] = None
    created_at: datetime
    raw_result: Optional[dict] = None

    class Config:
        from_attributes = True


class UploadResult(BaseModel):
    id: str
    source_name: str
    kind: str
    label: Optional[str] = None
    confidence: Optional[float] = None
    latency_ms: int
    file_url: Optional[str] = None
    result_url: Optional[str] = None
    size_bytes: Optional[int] = None
    face_locations: Optional[list] = None
    top_emotions: Optional[list] = None
    extra: Optional[dict] = None
    created_at: datetime
    raw_result: Optional[dict] = None

    class Config:
        from_attributes = True


class MaxFusionTimelineItem(BaseModel):
    id: Optional[str] = None
    timestamp_sec: float
    text_label: Optional[str] = None
    text_score: Optional[float] = None
    audio_label: Optional[str] = None
    audio_score: Optional[float] = None
    vision_label: Optional[str] = None
    vision_score: Optional[float] = None
    fused_label: Optional[str] = None
    fused_score: Optional[float] = None

    class Config:
        from_attributes = True


class MaxFusionSession(BaseModel):
    id: str
    file_name: str
    file_url: Optional[str] = None
    status: str
    overall_label: Optional[str] = None
    overall_score: Optional[float] = None
    metadata: Optional[dict] = Field(default=None, alias="session_meta")
    created_at: datetime
    timeline_items: List[MaxFusionTimelineItem] = Field(default_factory=list)

    class Config:
        from_attributes = True
        allow_population_by_field_name = True


class MaxFusionTimelineIn(BaseModel):
    timestamp_sec: float = Field(..., ge=0)
    text: Optional[dict] = None
    audio: Optional[dict] = None
    vision: Optional[dict] = None
    fused: Optional[dict] = None


class MaxFusionSessionCreate(BaseModel):
    file_name: str
    file_url: Optional[str] = None
    status: str = "completed"
    overall_label: Optional[str] = None
    overall_score: Optional[float] = None
    metadata: Optional[dict] = None
    timeline: List[MaxFusionTimelineIn] = Field(default_factory=list)
