from time import perf_counter

from fastapi import APIRouter, UploadFile, File, Request, Depends
from fastapi.responses import JSONResponse, HTMLResponse
from app.services.face_service import FaceService
from app.schemas.face_schema import FaceResponse, FaceUploadResponse
from typing import Dict, Any
import base64
import numpy as np
import cv2
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import analysis as analysis_repo
from app.db.repositories import logs as logs_repo

router = APIRouter()
# Lazily create FaceService to avoid heavy model load at import/startup
face_service = None

def get_face_service() -> FaceService:
    global face_service
    if face_service is None:
        face_service = FaceService()
    return face_service

@router.post("/upload", response_model=FaceUploadResponse)
async def upload_face(file: UploadFile = File(...)):
    """Upload and process face image"""
    svc = get_face_service()
    result = await svc.process_image(file)
    return result

@router.post("/predict")
async def predict_emotion(
    file: UploadFile = File(...),
    skip_save: bool = False,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Predict emotion from face image.

    Parameters:
    - file: Image file to analyze
    - skip_save: If True, skip saving result image (for realtime mode)

    Returns:
    - emotion: Predicted emotion
    - confidence: Confidence score (percentage)
    - face_location: Bounding box coordinates of detected face
    - all_emotions: Probability scores for all emotions
    - result_image: Path to the result image with face detection box (if skip_save=False)
    """
    svc = get_face_service()
    start = perf_counter()
    result = await svc.predict_emotion(file, skip_save=skip_save)
    latency_ms = int((perf_counter() - start) * 1000)

    analysis_repo.log_vision_result(
        db,
        source_name=file.filename,
        label=str(result.get("emotion", "unknown")),
        confidence=float(result.get("confidence", 0.0)),
        latency_ms=latency_ms,
        image_url=None,
        result_url=result.get("result_image"),
        face_locations=result.get("face_location"),
        raw_result=result,
    )

    logs_repo.append(
        db,
        source="vision",
        action="RUN_SENTIMENT",
        level="info",
        message="Vision sentiment analysis completed",
        user=None,
        related_id=file.filename,
        meta={"latency_ms": latency_ms},
    )

    payload = dict(result)
    payload["latency_ms"] = latency_ms
    return JSONResponse(content=payload)

@router.post("/predict-webcam")
async def predict_webcam(request: Request, db: Session = Depends(get_db)):
    """
    Predict emotion from webcam image (base64)
    """
    try:
        data = await request.json()
        image_base64 = data.get("image_base64", "")

        # Convert base64 to numpy array
        b64_data = image_base64.split(",", 1)[1] if "," in image_base64 else image_base64
        img_bytes = base64.b64decode(b64_data)
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        # Get prediction
        svc = get_face_service()
        start = perf_counter()
        result = await svc.predict_emotion(img)
        latency_ms = int((perf_counter() - start) * 1000)

        # Include face location for drawing on canvas
        analysis_repo.log_vision_result(
            db,
            source_name="webcam-frame",
            label=str(result.get("emotion", "unknown")),
            confidence=float(result.get("confidence", 0.0)),
            latency_ms=latency_ms,
            image_url=None,
            result_url=None,
            face_locations=result.get("face_location"),
            raw_result=result,
        )

        return JSONResponse(content={
            "label": result["emotion"],
            "confidence": float(result["confidence"]),
            "face_location": result["face_location"],
            "all_emotions": result["all_emotions"],
            "latency_ms": latency_ms,
        })
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )