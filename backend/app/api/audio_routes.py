from time import perf_counter

from fastapi import APIRouter, UploadFile, File, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.services.audio_service import AudioService
from app.schemas.audio_schema import AudioResponse, AudioUploadResponse
from app.db.database import get_db
from app.db.repositories import analysis as analysis_repo
from app.db.repositories import logs as logs_repo

router = APIRouter()
audio_service = AudioService()


@router.post("/upload", response_model=AudioUploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file"""
    result = await audio_service.process_audio(file)
    return result


@router.post("/predict")
async def predict_audio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Predict emotion from uploaded audio file"""
    start = perf_counter()
    result = await audio_service.predict(file)
    latency_ms = int((perf_counter() - start) * 1000)

    analysis_repo.log_audio_result(
        db,
        source_name=file.filename or "uploaded-audio",
        label=str(result.get("emotion", "unknown")),
        confidence=float(result.get("confidence", 0.0)),
        latency_ms=latency_ms,
        file_url=None,
        raw_result=result,
    )

    logs_repo.append(
        db,
        source="audio",
        action="RUN_SENTIMENT",
        level="info",
        message="Audio analysis completed",
        user=None,
        related_id=file.filename,
        meta={"latency_ms": latency_ms},
    )

    payload = dict(result)
    payload["latency_ms"] = latency_ms
    return JSONResponse(content=payload)


@router.post("/predict-base64")
async def predict_audio_base64(
    request: Request,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Predict emotion from base64-encoded audio in JSON body.

    JSON body should be: { "audio_base64": "data:audio/wav;base64,..." }
    """
    try:
        data = await request.json()
        audio_b64 = data.get("audio_base64", "")
        if not audio_b64:
            return JSONResponse(status_code=400, content={"detail": "Missing audio_base64 field"})

        # remove data:...;base64, prefix if present
        b64_data = audio_b64.split(",", 1)[1] if "," in audio_b64 else audio_b64
        import base64

        audio_bytes = base64.b64decode(b64_data)

        start = perf_counter()
        result = await audio_service.predict(audio_bytes)
        latency_ms = int((perf_counter() - start) * 1000)

        analysis_repo.log_audio_result(
            db,
            source_name="base64-audio",
            label=str(result.get("emotion", "unknown")),
            confidence=float(result.get("confidence", 0.0)),
            latency_ms=latency_ms,
            file_url=None,
            raw_result=result,
        )

        payload = dict(result)
        payload["latency_ms"] = latency_ms
        return JSONResponse(content=payload)
    except Exception as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})
