"""Endpoints powering the analytics dashboard."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import dashboard as dashboard_repo
from app.schemas.analytics_schema import AudioResult
from app.schemas.log_schema import LogEntry
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


class Totals(BaseModel):
    audio: int
    vision: int
    upload: int
    maxfusion: int


class Averages(BaseModel):
    audio_confidence: float
    vision_confidence: float
    upload_confidence: float


class DashboardSummary(BaseModel):
    totals: Totals
    averages: Averages
    latest_audio: List[AudioResult]
    latest_logs: List[LogEntry]


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    summary = dashboard_repo.get_summary(db)
    totals = Totals(**summary["totals"])
    averages = Averages(**summary["averages"])
    latest_audio = [AudioResult.model_validate(item) for item in summary["latest_audio"]]
    latest_logs = [LogEntry.model_validate(item) for item in summary["latest_logs"]]
    return DashboardSummary(
        totals=totals,
        averages=averages,
        latest_audio=latest_audio,
        latest_logs=latest_logs,
    )
