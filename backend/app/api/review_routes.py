"""Endpoints for managing the review (trash) queue."""
from __future__ import annotations

from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import models
from app.db.repositories import analysis as analysis_repo
from app.db.repositories import review_queue as review_repo
from app.schemas.review_schema import ReviewItem

router = APIRouter(prefix="/api/v1/review-queue", tags=["review-queue"])


@router.get("/", response_model=List[ReviewItem])
def list_review_items(db: Session = Depends(get_db), limit: int = 200) -> List[ReviewItem]:
    items = review_repo.list_items(db, limit)
    return [ReviewItem.model_validate(item) for item in items]


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_review_item(item_id: str, db: Session = Depends(get_db)) -> Response:
    deleted = review_repo.delete_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found in review queue")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/empty", 
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def empty_review_queue(db: Session = Depends(get_db)) -> Response:
    review_repo.empty(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{item_id}/restore")
def restore_item(
    item_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    item = db.get(models.ReviewQueueItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    payload = item.payload or {}
    module = (item.module or "").lower()

    restored_id: Optional[str] = None

    if module == "audio":
        restored = analysis_repo.log_audio_result(
            db,
            source_name=item.source_label or "Restored audio",
            label=item.label or "unknown",
            confidence=float(item.confidence or 0.0),
            latency_ms=int(payload.get("latency_ms", 0)),
            file_url=payload.get("file_url"),
            raw_result=payload.get("raw_result"),
        )
        restored_id = restored.id
    elif module == "vision":
        restored = analysis_repo.log_vision_result(
            db,
            source_name=item.source_label,
            label=item.label or "unknown",
            confidence=float(item.confidence or 0.0),
            latency_ms=int(payload.get("latency_ms", 0)),
            image_url=payload.get("image_url"),
            result_url=payload.get("result_url"),
            face_locations=payload.get("face_locations"),
            raw_result=payload.get("raw_result"),
        )
        restored_id = restored.id
    elif module.startswith("upload-"):
        kind = module.replace("upload-", "")
        restored = analysis_repo.log_upload_result(
            db,
            source_name=item.source_label or "Restored upload",
            kind=kind,
            label=item.label,
            confidence=float(item.confidence or 0.0) if item.confidence is not None else None,
            latency_ms=int(payload.get("latency_ms", 0)),
            file_url=payload.get("file_url"),
            result_url=payload.get("result_url"),
            size_bytes=item.size_bytes,
            face_locations=payload.get("face_locations"),
            top_emotions=payload.get("top_emotions"),
            extra=payload.get("extra"),
            raw_result=payload.get("raw_result"),
        )
        restored_id = restored.id
    elif module == "max-fusion":
        timeline = payload.get("timeline", [])
        session = analysis_repo.create_maxfusion_session(
            db,
            file_name=item.source_label or "Restored session",
            file_url=payload.get("file_url"),
            status=payload.get("status", "restored"),
            overall_label=item.label,
            overall_score=item.confidence,
            metadata=payload.get("metadata"),
            timeline=timeline,
        )
        restored_id = session.id
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported module for restore: {item.module}")

    review_repo.delete_item(db, item_id)

    return {"restored_id": restored_id or ""}
