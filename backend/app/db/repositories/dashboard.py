"""Repository helpers for dashboard aggregations."""
from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import models


def get_summary(db: Session) -> dict:
    audio_count = db.query(func.count(models.AudioAnalysis.id)).scalar() or 0
    vision_count = db.query(func.count(models.VisionAnalysis.id)).scalar() or 0
    upload_count = db.query(func.count(models.UploadAnalysis.id)).scalar() or 0
    maxfusion_count = db.query(func.count(models.MaxFusionSession.id)).scalar() or 0

    avg_audio_conf = db.query(func.avg(models.AudioAnalysis.confidence)).scalar() or 0.0
    avg_vision_conf = db.query(func.avg(models.VisionAnalysis.confidence)).scalar() or 0.0
    avg_upload_conf = db.query(func.avg(models.UploadAnalysis.confidence)).scalar() or 0.0

    latest_audio = (
        db.query(models.AudioAnalysis)
        .order_by(models.AudioAnalysis.created_at.desc())
        .limit(5)
        .all()
    )

    latest_logs = (
        db.query(models.SystemLog)
        .order_by(models.SystemLog.timestamp.desc())
        .limit(10)
        .all()
    )

    return {
        "totals": {
            "audio": audio_count,
            "vision": vision_count,
            "upload": upload_count,
            "maxfusion": maxfusion_count,
        },
        "averages": {
            "audio_confidence": float(avg_audio_conf),
            "vision_confidence": float(avg_vision_conf),
            "upload_confidence": float(avg_upload_conf),
        },
        "latest_audio": latest_audio,
        "latest_logs": latest_logs,
    }
