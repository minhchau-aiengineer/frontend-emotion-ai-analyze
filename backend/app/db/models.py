"""SQLAlchemy models representing persisted entities for the Emotion AI platform."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (Boolean, Column, DateTime, Float, ForeignKey, Integer,
                        LargeBinary, String, Text, func)
from sqlalchemy.dialects.mssql import JSON
from sqlalchemy.orm import relationship

from app.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(64), nullable=False, default="member")
    is_active = Column(Boolean, nullable=False, default=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)


class AudioAnalysis(Base, TimestampMixin):
    __tablename__ = "audio_analysis"

    id = Column(String(36), primary_key=True, default=_uuid)
    source_name = Column(String(255), nullable=False)
    label = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    file_url = Column(String(512), nullable=True)
    raw_result = Column(JSON, nullable=True)


class VisionAnalysis(Base, TimestampMixin):
    __tablename__ = "vision_analysis"

    id = Column(String(36), primary_key=True, default=_uuid)
    source_name = Column(String(255), nullable=True)
    label = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)
    latency_ms = Column(Integer, nullable=False)
    image_url = Column(String(512), nullable=True)
    result_url = Column(String(512), nullable=True)
    face_locations = Column(JSON, nullable=True)
    raw_result = Column(JSON, nullable=True)


class UploadAnalysis(Base, TimestampMixin):
    __tablename__ = "upload_analysis"

    id = Column(String(36), primary_key=True, default=_uuid)
    source_name = Column(String(255), nullable=False)
    kind = Column(String(16), nullable=False)
    label = Column(String(64), nullable=True)
    confidence = Column(Float, nullable=True)
    latency_ms = Column(Integer, nullable=False)
    file_url = Column(String(512), nullable=True)
    result_url = Column(String(512), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    face_locations = Column(JSON, nullable=True)
    top_emotions = Column(JSON, nullable=True)
    extra = Column(JSON, nullable=True)
    raw_result = Column(JSON, nullable=True)


class MaxFusionSession(Base, TimestampMixin):
    __tablename__ = "maxfusion_sessions"

    id = Column(String(36), primary_key=True, default=_uuid)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(512), nullable=True)
    status = Column(String(32), nullable=False, default="completed")
    overall_label = Column(String(64), nullable=True)
    overall_score = Column(Float, nullable=True)
    session_meta = Column(JSON, nullable=True)
    timeline_items = relationship(
        "MaxFusionTimeline",
        back_populates="session",
        cascade="all, delete-orphan",
    )


class MaxFusionTimeline(Base):
    __tablename__ = "maxfusion_timeline"

    id = Column(String(36), primary_key=True, default=_uuid)
    session_id = Column(String(36), ForeignKey("maxfusion_sessions.id", ondelete="CASCADE"), nullable=False)
    timestamp_sec = Column(Float, nullable=False)
    text_label = Column(String(64), nullable=True)
    text_score = Column(Float, nullable=True)
    audio_label = Column(String(64), nullable=True)
    audio_score = Column(Float, nullable=True)
    vision_label = Column(String(64), nullable=True)
    vision_score = Column(Float, nullable=True)
    fused_label = Column(String(64), nullable=True)
    fused_score = Column(Float, nullable=True)

    session = relationship("MaxFusionSession", back_populates="timeline_items")


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(String(36), primary_key=True, default=_uuid)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    source = Column(String(64), nullable=False)
    action = Column(String(128), nullable=False)
    level = Column(String(16), nullable=False)
    message = Column(Text, nullable=False)
    user = Column(String(128), nullable=True)
    related_id = Column(String(64), nullable=True)
    meta = Column(JSON, nullable=True)


class ReviewQueueItem(Base, TimestampMixin):
    __tablename__ = "review_queue"

    id = Column(String(36), primary_key=True, default=_uuid)
    module = Column(String(64), nullable=False)
    original_id = Column(String(36), nullable=False)
    source_label = Column(String(255), nullable=True)
    label = Column(String(64), nullable=True)
    confidence = Column(Float, nullable=True)
    deleted_by = Column(String(128), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    size_bytes = Column(Integer, nullable=True)
    payload = Column(JSON, nullable=True)


class StoredFile(Base, TimestampMixin):
    __tablename__ = "stored_files"

    id = Column(String(36), primary_key=True, default=_uuid)
    module = Column(String(64), nullable=False)
    original_name = Column(String(255), nullable=False)
    content_type = Column(String(128), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    path = Column(String(512), nullable=False)
    sha256 = Column(String(128), nullable=True)
    data = Column(LargeBinary, nullable=True)
