"""Endpoints for viewing and managing system logs."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import logs as logs_repo
from app.schemas.log_schema import LogCreate, LogEntry

router = APIRouter(prefix="/api/v1/logs", tags=["logs"])


@router.get("/", response_model=List[LogEntry])
def list_logs(db: Session = Depends(get_db), limit: int = 200) -> List[LogEntry]:
    entries = logs_repo.list_logs(db, limit)
    return [LogEntry.model_validate(entry) for entry in entries]


@router.post("/", response_model=LogEntry, status_code=status.HTTP_201_CREATED)
def append_log(payload: LogCreate, db: Session = Depends(get_db)) -> LogEntry:
    entry = logs_repo.append(
        db,
        source=payload.source,
        action=payload.action,
        level=payload.level,
        message=payload.message,
        user=payload.user,
        related_id=payload.related_id,
        meta=payload.meta,
    )
    return LogEntry.model_validate(entry)


@router.delete(
    "/{log_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_log(log_id: str, db: Session = Depends(get_db)) -> Response:
    deleted = logs_repo.delete_log(db, log_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/clear",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def clear_logs(db: Session = Depends(get_db)) -> Response:
    logs_repo.clear(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
