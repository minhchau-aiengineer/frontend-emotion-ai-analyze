"""Repository helpers for persisting and querying analysis results."""
from __future__ import annotations

from typing import Iterable, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db import models


def log_audio_result(
    db: Session,
    *,
    source_name: str,
    label: str,
    confidence: float,
    latency_ms: int,
    file_url: Optional[str] = None,
    raw_result: Optional[dict] = None,
) -> models.AudioAnalysis:
    record = models.AudioAnalysis(
        source_name=source_name,
        label=label,
        confidence=confidence,
        latency_ms=latency_ms,
        file_url=file_url,
        raw_result=raw_result,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_audio_results(db: Session, limit: int = 100) -> list[models.AudioAnalysis]:
    return (
        db.query(models.AudioAnalysis)
        .order_by(desc(models.AudioAnalysis.created_at))
        .limit(limit)
        .all()
    )


def get_audio_result(db: Session, record_id: str) -> Optional[models.AudioAnalysis]:
    return db.get(models.AudioAnalysis, record_id)


def delete_audio_result(db: Session, record: models.AudioAnalysis) -> None:
    db.delete(record)
    db.commit()


def log_vision_result(
    db: Session,
    *,
    source_name: Optional[str],
    label: str,
    confidence: float,
    latency_ms: int,
    image_url: Optional[str],
    result_url: Optional[str],
    face_locations: Optional[dict],
    raw_result: Optional[dict] = None,
) -> models.VisionAnalysis:
    record = models.VisionAnalysis(
        source_name=source_name,
        label=label,
        confidence=confidence,
        latency_ms=latency_ms,
        image_url=image_url,
        result_url=result_url,
        face_locations=face_locations,
        raw_result=raw_result,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_vision_results(db: Session, limit: int = 100) -> list[models.VisionAnalysis]:
    return (
        db.query(models.VisionAnalysis)
        .order_by(desc(models.VisionAnalysis.created_at))
        .limit(limit)
        .all()
    )


def get_vision_result(db: Session, record_id: str) -> Optional[models.VisionAnalysis]:
    return db.get(models.VisionAnalysis, record_id)


def delete_vision_result(db: Session, record: models.VisionAnalysis) -> None:
    db.delete(record)
    db.commit()


def log_upload_result(
    db: Session,
    *,
    source_name: str,
    kind: str,
    label: Optional[str],
    confidence: Optional[float],
    latency_ms: int,
    file_url: Optional[str],
    result_url: Optional[str],
    size_bytes: Optional[int],
    face_locations: Optional[Iterable[dict]],
    top_emotions: Optional[Iterable[dict]],
    extra: Optional[dict],
    raw_result: Optional[dict] = None,
) -> models.UploadAnalysis:
    record = models.UploadAnalysis(
        source_name=source_name,
        kind=kind,
        label=label,
        confidence=confidence,
        latency_ms=latency_ms,
        file_url=file_url,
        result_url=result_url,
        size_bytes=size_bytes,
        face_locations=list(face_locations) if face_locations else None,
        top_emotions=list(top_emotions) if top_emotions else None,
        extra=extra,
        raw_result=raw_result,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_upload_results(db: Session, limit: int = 100) -> list[models.UploadAnalysis]:
    return (
        db.query(models.UploadAnalysis)
        .order_by(desc(models.UploadAnalysis.created_at))
        .limit(limit)
        .all()
    )


def get_upload_result(db: Session, record_id: str) -> Optional[models.UploadAnalysis]:
    return db.get(models.UploadAnalysis, record_id)


def delete_upload_result(db: Session, record: models.UploadAnalysis) -> None:
    db.delete(record)
    db.commit()

def create_maxfusion_session(
    db: Session,
    *,
    file_name: str,
    file_url: Optional[str],
    status: str,
    overall_label: Optional[str],
    overall_score: Optional[float],
    metadata: Optional[dict],
    timeline: Iterable[dict],
) -> models.MaxFusionSession:
    session_record = models.MaxFusionSession(
        file_name=file_name,
        file_url=file_url,
        status=status,
        overall_label=overall_label,
        overall_score=overall_score,
    session_meta=metadata,
    )
    db.add(session_record)
    db.flush()

    timeline_records = []
    for item in timeline:
        timeline_record = models.MaxFusionTimeline(
            session_id=session_record.id,
            timestamp_sec=item.get("timestamp_sec") or item.get("t") or 0.0,
            text_label=item.get("text_label") or item.get("text", {}).get("label"),
            text_score=item.get("text_score") or item.get("text", {}).get("score"),
            audio_label=item.get("audio_label") or item.get("audio", {}).get("label"),
            audio_score=item.get("audio_score") or item.get("audio", {}).get("score"),
            vision_label=item.get("vision_label") or item.get("vision", {}).get("label"),
            vision_score=item.get("vision_score") or item.get("vision", {}).get("score"),
            fused_label=item.get("fused_label") or item.get("fused", {}).get("label"),
            fused_score=item.get("fused_score") or item.get("fused", {}).get("score"),
        )
        timeline_records.append(timeline_record)

    if timeline_records:
        db.add_all(timeline_records)

    db.commit()
    db.refresh(session_record)
    return session_record


def list_maxfusion_sessions(db: Session, limit: int = 50) -> list[models.MaxFusionSession]:
    return (
        db.query(models.MaxFusionSession)
        .order_by(desc(models.MaxFusionSession.created_at))
        .limit(limit)
        .all()
    )


def list_maxfusion_timeline(db: Session, session_id: str) -> list[models.MaxFusionTimeline]:
    return (
        db.query(models.MaxFusionTimeline)
        .filter(models.MaxFusionTimeline.session_id == session_id)
        .order_by(models.MaxFusionTimeline.timestamp_sec)
        .all()
    )


def get_maxfusion_session(db: Session, session_id: str) -> Optional[models.MaxFusionSession]:
    return db.get(models.MaxFusionSession, session_id)


def delete_maxfusion_session(db: Session, session: models.MaxFusionSession) -> None:
    db.delete(session)
    db.commit()
