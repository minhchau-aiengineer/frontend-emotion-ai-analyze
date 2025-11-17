# app/services/upload_service.py
import re
import time
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Any

import cv2
import numpy as np
from fastapi import UploadFile, HTTPException

from app.core.config import settings
from app.schemas.upload_schema import UploadResponse, EmotionScore, FaceBox
from app.services.face_service import FaceService
from app.services.audio_service import AudioService
from app.utils.image_utils import save_result_image


@dataclass
class StoredFile:
    """Giữ thông tin file đã lưu để tránh truyền tuple lộn xộn."""

    kind: str
    filename: str
    path: Path
    url: str
    size: int
    content_type: str
    raw_bytes: bytes


class UploadService:
    """
    Service chịu trách nhiệm:
    - kiểm tra loại & kích thước file
    - lưu file vào static/uploads/<kind>
    - gọi model tương ứng và dựng response thống nhất
    """

    def __init__(self):
        static_root = Path(getattr(settings, "STATIC_DIR", settings.BASE_DIR / "app" / "static"))
        self.upload_dir = static_root / "uploads"
        self.upload_dir.mkdir(parents=True, exist_ok=True)

        # tải model một lần để tái sử dụng
        self.face_service = FaceService()
        self.audio_service = AudioService()

    async def handle_image_upload(self, file: UploadFile) -> UploadResponse:
        stored = await self._save_file(file, "image")
        start = time.perf_counter()

        # decode ảnh sang numpy để gọi model
        img_array = self._decode_image(stored.raw_bytes)
        result = await self.face_service.predict_emotion(img_array, skip_save=True)
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])

        # ghi lại ảnh kết quả có bounding box để frontend xem
        result_path = save_result_image(
            original_img=img_array,
            face_location=result.get("face_location", {}),
            emotion=result.get("emotion", "Unknown"),
            confidence=float(result.get("confidence", 0.0)),
            file_name=f"result_{stored.filename}"
        )

        latency_ms = int((time.perf_counter() - start) * 1000)
        top_emotions = self._build_top_emotions(result.get("all_emotions"))
        face_box = self._normalize_face_location(result.get("face_location"))

        return UploadResponse(
            kind="image",
            filename=stored.filename,
            url=stored.url,
            content_type=stored.content_type,
            size=stored.size,
            latency_ms=latency_ms,
            emotion=result.get("emotion"),
            confidence=result.get("confidence"),
            all_emotions=result.get("all_emotions"),
            top_emotions=top_emotions,
            result_url=self._result_url(result_path),
            face_locations=[FaceBox(**face_box)] if face_box else None,
        )

    async def handle_video_upload(self, file: UploadFile) -> UploadResponse:
        stored = await self._save_file(file, "video")
        start = time.perf_counter()

        cap = cv2.VideoCapture(str(stored.path))
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Cannot read uploaded video")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1

        aggregated: Dict[str, float] = defaultdict(float)
        frame_results: List[dict] = []
        best_result: Optional[dict] = None
        best_frame: Optional[np.ndarray] = None
        frame_detections: List[Dict[str, Any]] = []

        fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
        target_rate = 4.0  # cố gắng phân tích khoảng 4 khung hình mỗi giây
        if fps > 0:
            step = max(int(round(fps / target_rate)), 1)
        else:
            step = max(total_frames // min(total_frames, 24), 1)

        max_processed_frames = 200
        processed_frames = 0
        last_pos_ms = 0.0

        frame_index = 0
        while True:
            ret, frame = cap.read()
            if not ret or processed_frames >= max_processed_frames:
                break

            if frame_index % step != 0:
                frame_index += 1
                last_pos_ms = float(cap.get(cv2.CAP_PROP_POS_MSEC) or last_pos_ms)
                continue

            result = await self.face_service.predict_emotion(frame, skip_save=True)
            if result.get("error"):
                frame_index += 1
                last_pos_ms = float(cap.get(cv2.CAP_PROP_POS_MSEC) or last_pos_ms)
                continue

            frame_results.append(result)
            processed_frames += 1
            for label, score in (result.get("all_emotions") or {}).items():
                aggregated[label] += float(score)

            if not best_result or float(result.get("confidence", 0.0)) > float(best_result.get("confidence", 0.0)):
                best_result = result
                best_frame = frame.copy()

            normalized_box = self._normalize_face_location(result.get("face_location"))
            if normalized_box:
                position_ms = float(cap.get(cv2.CAP_PROP_POS_MSEC) or 0.0)
                detection_entry: Dict[str, Any] = {
                    "frame_index": frame_index,
                    "time_sec": (position_ms / 1000.0) if position_ms else (frame_index / fps if fps > 0 else None),
                    "timestamp_ms": int(position_ms) if position_ms else (int((frame_index / fps) * 1000) if fps > 0 else None),
                    "frame_width": int(frame.shape[1]),
                    "frame_height": int(frame.shape[0]),
                    "subjects": [
                        {
                            "box": {k: int(v) for k, v in normalized_box.items()},
                            "emotion": result.get("emotion"),
                            "confidence": float(result.get("confidence", 0.0)),
                        }
                    ],
                }
                frame_detections.append(detection_entry)
                if position_ms:
                    last_pos_ms = position_ms

            frame_index += 1
            last_pos_ms = float(cap.get(cv2.CAP_PROP_POS_MSEC) or last_pos_ms)

        cap.release()

        if not frame_results or not aggregated:
            raise HTTPException(status_code=400, detail="No face detected in sampled video frames")

        # trung bình điểm theo số frame đã dùng
        for label in aggregated:
            aggregated[label] /= len(frame_results)

        top_emotions = self._build_top_emotions(aggregated)
        primary = top_emotions[0] if top_emotions else None
        latency_ms = int((time.perf_counter() - start) * 1000)

        result_url = None
        face_locations: Optional[List[FaceBox]] = None
        if best_result and best_frame is not None:
            result_path = save_result_image(
                original_img=best_frame,
                face_location=best_result.get("face_location", {}),
                emotion=best_result.get("emotion", primary.label if primary else "Unknown"),
                confidence=float(best_result.get("confidence", 0.0)),
                file_name=f"result_{stored.filename}.jpg"
            )
            result_url = self._result_url(result_path)
            best_box = self._normalize_face_location(best_result.get("face_location"))
            if best_box:
                face_locations = [FaceBox(**best_box)]

        return UploadResponse(
            kind="video",
            filename=stored.filename,
            url=stored.url,
            content_type=stored.content_type,
            size=stored.size,
            latency_ms=latency_ms,
            emotion=primary.label if primary else None,
            confidence=primary.score if primary else None,
            all_emotions=dict(aggregated),
            top_emotions=top_emotions,
            result_url=result_url,
            face_locations=face_locations,
            extra={
                "total_frames": total_frames,
                "sampled": len(frame_results),
                "processed_frames": processed_frames,
                "frame_step": step,
                "fps": fps,
                "duration_sec": (total_frames / fps) if fps > 0 else (last_pos_ms / 1000 if last_pos_ms else None),
                "frame_detections": frame_detections,
            },
        )

    async def handle_audio_upload(self, file: UploadFile) -> UploadResponse:
        stored = await self._save_file(file, "audio")
        start = time.perf_counter()

        result = await self.audio_service.predict(stored.raw_bytes, stored.content_type)
        latency_ms = int((time.perf_counter() - start) * 1000)

        top_emotions = self._build_top_emotions(result.get("all_emotions"))

        return UploadResponse(
            kind="audio",
            filename=stored.filename,
            url=stored.url,
            content_type=stored.content_type,
            size=stored.size,
            latency_ms=latency_ms,
            emotion=result.get("emotion"),
            confidence=result.get("confidence"),
            all_emotions=result.get("all_emotions"),
            top_emotions=top_emotions,
        )

    async def _save_file(self, file: UploadFile, kind: str) -> StoredFile:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Missing filename")

        content_type = file.content_type or "application/octet-stream"
        raw_bytes = await file.read()
        size = len(raw_bytes)

        # kiểm tra theo loại file
        if kind == "image":
            if content_type not in settings.ALLOWED_IMAGE_TYPES:
                raise HTTPException(status_code=400, detail=f"Image type not allowed: {content_type}")
            limit = settings.MAX_UPLOAD_SIZE
        elif kind == "audio":
            allowed_audio = set(settings.ALLOWED_AUDIO_TYPES)
            # một số trình duyệt (Chrome) gửi audio recorder dưới dạng video/webm
            allowed_audio.add("video/webm")
            if content_type not in allowed_audio:
                raise HTTPException(status_code=400, detail=f"Audio type not allowed: {content_type}")
            limit = settings.MAX_UPLOAD_SIZE
        elif kind == "video":
            if content_type not in settings.ALLOWED_VIDEO_TYPES:
                raise HTTPException(status_code=400, detail=f"Video type not allowed: {content_type}")
            limit = settings.MAX_VIDEO_SIZE
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported upload kind: {kind}")

        if size > limit:
            raise HTTPException(status_code=400, detail=f"File too large. Max allowed: {limit // (1024 * 1024)}MB")

        safe_name = self._safe_filename(file.filename)
        sub_dir = self.upload_dir / f"{kind}s"
        sub_dir.mkdir(parents=True, exist_ok=True)

        target = sub_dir / safe_name
        counter = 1
        while target.exists():
            stem = Path(safe_name).stem
            suffix = Path(safe_name).suffix
            target = sub_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        target.write_bytes(raw_bytes)
        url = f"/static/uploads/{kind}s/{target.name}"

        return StoredFile(
            kind=kind,
            filename=target.name,
            path=target,
            url=url,
            size=size,
            content_type=content_type,
            raw_bytes=raw_bytes,
        )

    def _safe_filename(self, filename: str) -> str:
        name = filename.strip().replace(" ", "_")
        name = re.sub(r"[^A-Za-z0-9_.-]", "_", name)
        return name or "upload.bin"

    def _decode_image(self, data: bytes) -> np.ndarray:
        arr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Cannot decode image bytes")
        return img

    def _build_top_emotions(self, raw: Optional[Dict[str, float]]) -> Optional[List[EmotionScore]]:
        if not raw:
            return None
        ordered = sorted(((label, float(score)) for label, score in raw.items()), key=lambda x: x[1], reverse=True)
        return [EmotionScore(label=label, score=score) for label, score in ordered]

    def _result_url(self, path: str) -> str:
        filename = Path(path).name
        return f"/static/results/{filename}"

    def _normalize_face_location(self, location: Optional[Dict[str, Any]]) -> Optional[Dict[str, int]]:
        if not location:
            return None
        if {"left", "top", "right", "bottom"}.issubset(location.keys()):
            return {
                "left": int(location["left"]),
                "top": int(location["top"]),
                "right": int(location["right"]),
                "bottom": int(location["bottom"]),
            }
        if {"x", "y", "width", "height"}.issubset(location.keys()):
            x = int(location["x"])
            y = int(location["y"])
            w = int(location["width"])
            h = int(location["height"])
            return {
                "left": x,
                "top": y,
                "right": x + w,
                "bottom": y + h,
            }
        return None
