"""Analytics endpoints for audio, vision, upload and max fusion modules."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import analysis as analysis_repo
from app.db.repositories import review_queue as review_repo
from app.schemas.analytics_schema import (
    AudioResult,
    MaxFusionSession,
    MaxFusionSessionCreate,
    MaxFusionTimelineItem,
    UploadResult,
    VisionResult,
)
from app.schemas.review_schema import ReviewItem

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/audio", response_model=List[AudioResult])
def list_audio_results(
    limit: int = Query(100, le=500, ge=1),
    db: Session = Depends(get_db),
) -> List[AudioResult]:
    records = analysis_repo.list_audio_results(db, limit)
    return [AudioResult.model_validate(r) for r in records]


@router.delete("/audio/{result_id}", response_model=ReviewItem)
def delete_audio_result(
    result_id: str,
    deleted_by: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> ReviewItem:
    record = analysis_repo.get_audio_result(db, result_id)
    if not record:
        raise HTTPException(status_code=404, detail="Audio result not found")

    review_item = review_repo.add_item(
        db,
        module="audio",
        original_id=record.id,
        source_label=record.source_name,
        label=record.label,
        confidence=record.confidence,
        deleted_by=deleted_by,
        size_bytes=None,
        payload={
            "latency_ms": record.latency_ms,
            "file_url": record.file_url,
            "raw_result": record.raw_result,
        },
    )
    analysis_repo.delete_audio_result(db, record)
    return ReviewItem.model_validate(review_item)


@router.get("/vision", response_model=List[VisionResult])
def list_vision_results(
    limit: int = Query(100, le=500, ge=1),
    db: Session = Depends(get_db),
) -> List[VisionResult]:
    records = analysis_repo.list_vision_results(db, limit)
    return [VisionResult.model_validate(r) for r in records]


@router.delete("/vision/{result_id}", response_model=ReviewItem)
def delete_vision_result(
    result_id: str,
    deleted_by: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> ReviewItem:
    record = analysis_repo.get_vision_result(db, result_id)
    if not record:
        raise HTTPException(status_code=404, detail="Vision result not found")

    review_item = review_repo.add_item(
        db,
        module="vision",
        original_id=record.id,
        source_label=record.source_name,
        label=record.label,
        confidence=record.confidence,
        deleted_by=deleted_by,
        size_bytes=None,
        payload={
            "latency_ms": record.latency_ms,
            "image_url": record.image_url,
            "result_url": record.result_url,
            "face_locations": record.face_locations,
            "raw_result": record.raw_result,
        },
    )
    analysis_repo.delete_vision_result(db, record)
    return ReviewItem.model_validate(review_item)


@router.get("/upload", response_model=List[UploadResult])
def list_upload_results(
    limit: int = Query(100, le=500, ge=1),
    db: Session = Depends(get_db),
) -> List[UploadResult]:
    records = analysis_repo.list_upload_results(db, limit)
    return [UploadResult.model_validate(r) for r in records]


@router.delete("/upload/{result_id}", response_model=ReviewItem)
def delete_upload_result(
    result_id: str,
    deleted_by: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> ReviewItem:
    record = analysis_repo.get_upload_result(db, result_id)
    if not record:
        raise HTTPException(status_code=404, detail="Upload result not found")

    review_item = review_repo.add_item(
        db,
        module=f"upload-{record.kind}",
        original_id=record.id,
        source_label=record.source_name,
        label=record.label,
        confidence=record.confidence,
        deleted_by=deleted_by,
        size_bytes=record.size_bytes,
        payload={
            "latency_ms": record.latency_ms,
            "file_url": record.file_url,
            "result_url": record.result_url,
            "face_locations": record.face_locations,
            "top_emotions": record.top_emotions,
            "extra": record.extra,
            "raw_result": record.raw_result,
        },
    )
    analysis_repo.delete_upload_result(db, record)
    return ReviewItem.model_validate(review_item)


@router.get("/maxfusion", response_model=List[MaxFusionSession])
def list_maxfusion_sessions(
    limit: int = Query(50, le=200, ge=1),
    db: Session = Depends(get_db),
) -> List[MaxFusionSession]:
    records = analysis_repo.list_maxfusion_sessions(db, limit)
    return [MaxFusionSession.model_validate(r) for r in records]


@router.get("/maxfusion/{session_id}/timeline", response_model=List[MaxFusionTimelineItem])
def get_maxfusion_timeline(session_id: str, db: Session = Depends(get_db)) -> List[MaxFusionTimelineItem]:
    session = analysis_repo.get_maxfusion_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    timeline = analysis_repo.list_maxfusion_timeline(db, session_id)
    return [MaxFusionTimelineItem.model_validate(item) for item in timeline]


@router.post("/maxfusion", response_model=MaxFusionSession, status_code=201)
def create_maxfusion_session(
    payload: MaxFusionSessionCreate,
    db: Session = Depends(get_db),
) -> MaxFusionSession:
    session_record = analysis_repo.create_maxfusion_session(
        db,
        file_name=payload.file_name,
        file_url=payload.file_url,
        status=payload.status,
        overall_label=payload.overall_label,
        overall_score=payload.overall_score,
        metadata=payload.metadata,
        timeline=[item.model_dump() for item in payload.timeline],
    )
    return MaxFusionSession.model_validate(session_record)


@router.delete("/maxfusion/{session_id}", response_model=ReviewItem)
def delete_maxfusion_session(
    session_id: str,
    deleted_by: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> ReviewItem:
    session_record = analysis_repo.get_maxfusion_session(db, session_id)
    if not session_record:
        raise HTTPException(status_code=404, detail="Session not found")

    timeline_items = analysis_repo.list_maxfusion_timeline(db, session_record.id)
    timeline_payload = [
        {
            "timestamp_sec": t.timestamp_sec,
            "text_label": t.text_label,
            "text_score": t.text_score,
            "audio_label": t.audio_label,
            "audio_score": t.audio_score,
            "vision_label": t.vision_label,
            "vision_score": t.vision_score,
            "fused_label": t.fused_label,
            "fused_score": t.fused_score,
        }
        for t in timeline_items
    ]

    review_item = review_repo.add_item(
        db,
        module="max-fusion",
        original_id=session_record.id,
        source_label=session_record.file_name,
        label=session_record.overall_label,
        confidence=session_record.overall_score,
        deleted_by=deleted_by,
        size_bytes=None,
        payload={
            "status": session_record.status,
            "file_url": session_record.file_url,
            "metadata": session_record.session_meta,
            "timeline": timeline_payload,
        },
    )
    analysis_repo.delete_maxfusion_session(db, session_record)
    return ReviewItem.model_validate(review_item)
