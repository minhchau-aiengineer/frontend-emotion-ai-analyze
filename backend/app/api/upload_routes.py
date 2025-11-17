# app/api/upload_routes.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.upload_schema import UploadResponse
from app.services.upload_service import UploadService
from app.db.database import get_db
from app.db.repositories import analysis as analysis_repo
from app.db.repositories import logs as logs_repo

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])

upload_service = UploadService()


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Nhận ảnh, lưu vào static/uploads, chạy model nhận diện khuôn mặt.
    """
    try:
        response = await upload_service.handle_image_upload(file)

        analysis_repo.log_upload_result(
            db,
            source_name=response.filename,
            kind="image",
            label=response.emotion,
            confidence=float(response.confidence) if response.confidence is not None else None,
            latency_ms=response.latency_ms,
            file_url=response.url,
            result_url=response.result_url,
            size_bytes=response.size,
            face_locations=[box.model_dump() for box in response.face_locations] if response.face_locations else None,
            top_emotions=[score.model_dump() for score in response.top_emotions] if response.top_emotions else None,
            extra=response.extra,
            raw_result=response.model_dump(),
        )

        logs_repo.append(
            db,
            source="vision",
            action="UPLOAD_IMAGE",
            level="info",
            message=f"Image analysis completed: {response.emotion}",
            user=None,
            related_id=response.filename,
            meta={"latency_ms": response.latency_ms},
        )

        return response
    except HTTPException:
        # ném lại cho FastAPI
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/video", response_model=UploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Nhận video, sample vài frame rồi dùng chung model khuôn mặt.
    """
    try:
        response = await upload_service.handle_video_upload(file)

        analysis_repo.log_upload_result(
            db,
            source_name=response.filename,
            kind="video",
            label=response.emotion,
            confidence=float(response.confidence) if response.confidence is not None else None,
            latency_ms=response.latency_ms,
            file_url=response.url,
            result_url=response.result_url,
            size_bytes=response.size,
            face_locations=[box.model_dump() for box in response.face_locations] if response.face_locations else None,
            top_emotions=[score.model_dump() for score in response.top_emotions] if response.top_emotions else None,
            extra=response.extra,
            raw_result=response.model_dump(),
        )

        logs_repo.append(
            db,
            source="vision",
            action="UPLOAD_VIDEO",
            level="info",
            message=f"Video analysis completed: {response.emotion}",
            user=None,
            related_id=response.filename,
            meta={
                "latency_ms": response.latency_ms,
                "sampled": response.extra.get("sampled") if response.extra else None,
            },
        )

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audio", response_model=UploadResponse)
async def upload_audio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Nhận audio, gọi model âm thanh để lấy cảm xúc.
    """
    try:
        response = await upload_service.handle_audio_upload(file)

        analysis_repo.log_upload_result(
            db,
            source_name=response.filename,
            kind="audio",
            label=response.emotion,
            confidence=float(response.confidence) if response.confidence is not None else None,
            latency_ms=response.latency_ms,
            file_url=response.url,
            result_url=response.result_url,
            size_bytes=response.size,
            face_locations=None,
            top_emotions=[score.model_dump() for score in response.top_emotions] if response.top_emotions else None,
            extra=response.extra,
            raw_result=response.model_dump(),
        )

        logs_repo.append(
            db,
            source="audio",
            action="UPLOAD_AUDIO",
            level="info",
            message=f"Upload audio analysis completed: {response.emotion}",
            user=None,
            related_id=response.filename,
            meta={"latency_ms": response.latency_ms},
        )

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
