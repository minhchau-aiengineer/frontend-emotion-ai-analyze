# app/schemas/upload_schema.py
from pydantic import BaseModel
from typing import Optional, Dict, List, Literal, Any


class EmotionScore(BaseModel):
    label: str
    score: float


class FaceBox(BaseModel):
    left: int
    top: int
    right: int
    bottom: int


class UploadResponse(BaseModel):
    kind: Literal["image", "video", "audio"]
    filename: str
    url: str
    content_type: str
    size: int
    latency_ms: int

    # kết quả model trả về (nếu có)
    emotion: Optional[str] = None
    confidence: Optional[float] = None
    all_emotions: Optional[Dict[str, float]] = None
    top_emotions: Optional[List[EmotionScore]] = None
    result_url: Optional[str] = None
    face_locations: Optional[List[FaceBox]] = None
    extra: Optional[Dict[str, Any]] = None
