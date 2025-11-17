// src/features/upload/services/uploadService.ts
import {
  UploadKind,
  UploadResultRow,
  FaceBox,
  VideoDetection,
  VideoMeta,
  VideoDetectionSubject,
} from "../types/uploadTypes";
import { convertToWav } from "../../audio-sentiment/utils/audioConverter";

type FrameDetectionSubjectPayload = {
  box?: Partial<FaceBox> & Record<string, unknown>;
  face_location?: Partial<FaceBox> & Record<string, unknown>;
  emotion?: string;
  confidence?: number;
};

type FrameDetectionPayload = {
  frame_index?: number;
  time_sec?: number;
  timestamp_ms?: number;
  frame_width?: number;
  frame_height?: number;
  subjects?: FrameDetectionSubjectPayload[];
  boxes?: Array<Partial<FaceBox> & Record<string, unknown>>;
};

type UploadExtra = {
  total_frames?: number;
  sampled?: number;
  fps?: number;
  duration_sec?: number;
  frame_detections?: FrameDetectionPayload[];
  [key: string]: unknown;
};

type UploadApiResponse = {
  kind: UploadKind;
  filename: string;
  url: string;
  content_type: string;
  size: number;
  latency_ms: number;
  emotion?: string;
  confidence?: number;
  all_emotions?: Record<string, number>;
  top_emotions?: { label: string; score: number }[];
  result_url?: string;
  extra?: UploadExtra;
  face_locations?: FaceBox[];
};

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function analyzeUpload(
  kind: UploadKind,
  displayName: string,
  file?: File,
  fallbackUrl?: string
): Promise<UploadResultRow> {
  const form = new FormData();
  let payloadFile = file;

  if (!payloadFile && fallbackUrl) {
    // Nếu chỉ có preview URL (ví dụ blob từ recorder) thì fetch lại thành File.
    const resp = await fetch(fallbackUrl);
    if (!resp.ok) {
      throw new Error(`Cannot access preview source: ${resp.status}`);
    }
    const blob = await resp.blob();
    const ext = kind === "audio" ? "wav" : kind === "video" ? "mp4" : "jpg";
    payloadFile = new File([blob], `upload.${ext}`, { type: blob.type || fileMimeFallback(kind) });
  }

  if (!payloadFile) {
    throw new Error("No file available for upload analysis");
  }

  payloadFile = await ensureFileForKind(kind, payloadFile);

  form.append("file", payloadFile);

  const endpoint = `${BASE}/api/v1/upload/${kind}`;
  const started = performance.now();
  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
  });
  const measuredLatency = Math.round(performance.now() - started);

  if (!res.ok) {
    const detail = await safeReadError(res);
    throw new Error(detail || `Upload analyze failed with status ${res.status}`);
  }

  const data = (await res.json()) as UploadApiResponse;
  const topK = data.top_emotions?.map((t) => ({ label: t.label, score: t.score })) ?? [];
  const label = data.emotion ?? topK[0]?.label ?? "Unknown";
  const confidence = data.confidence ?? topK[0]?.score ?? 0;
  const videoMeta = extractVideoMeta(data.extra);
  const videoDetections = extractVideoDetections(data.extra);

  return {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    source: displayName,
    kind: data.kind ?? kind,
    label,
    confidence,
    latency: data.latency_ms ?? measuredLatency,
    topK,
    ts: Date.now(),
    fileUrl: absoluteUrl(data.url),
    resultUrl: absoluteUrl(data.result_url),
    sizeBytes: data.size,
    faceLocations: normalizeFaceBoxes(data.face_locations),
    videoMeta,
    videoDetections,
    raw: data,
  };
}

function fileMimeFallback(kind: UploadKind): string {
  if (kind === "audio") return "audio/wav";
  if (kind === "video") return "video/mp4";
  return "image/jpeg";
}

function absoluteUrl(relative?: string | null): string | undefined {
  if (!relative) return undefined;
  if (relative.startsWith("http://") || relative.startsWith("https://")) {
    return relative;
  }
  try {
    const url = new URL(relative, BASE);
    return url.toString();
  } catch (err) {
    console.error("Cannot build absolute URL", err);
    return undefined;
  }
}

async function safeReadError(res: Response): Promise<string | undefined> {
  try {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await res.json();
      return body.detail || body.error || JSON.stringify(body);
    }
    return await res.text();
  } catch (err) {
    return undefined;
  }
}

function normalizeFaceBoxes(boxes?: FaceBox[] | null): FaceBox[] | undefined {
  if (!boxes || !boxes.length) return undefined;
  return boxes.map((b) => ({
    left: Number(b.left),
    top: Number(b.top),
    right: Number(b.right),
    bottom: Number(b.bottom),
  }));
}

function extractVideoMeta(extra?: UploadExtra): VideoMeta | undefined {
  if (!extra) return undefined;
  const meta: VideoMeta = {};
  const fps = toFiniteNumber(extra.fps);
  if (fps !== undefined) meta.fps = fps;
  const duration = toFiniteNumber(extra.duration_sec);
  if (duration !== undefined) meta.durationSec = duration;
  const totalFrames = toFiniteNumber(extra.total_frames);
  if (totalFrames !== undefined) meta.totalFrames = Math.round(totalFrames);
  const sampledFrames = toFiniteNumber(extra.sampled);
  if (sampledFrames !== undefined) meta.sampledFrames = Math.round(sampledFrames);
  const processedFrames = toFiniteNumber(extra.processed_frames);
  if (processedFrames !== undefined) meta.processedFrames = Math.round(processedFrames);
  const frameStep = toFiniteNumber(extra.frame_step);
  if (frameStep !== undefined) meta.frameStep = Math.max(1, Math.round(frameStep));
  return Object.keys(meta).length ? meta : undefined;
}

function extractVideoDetections(extra?: UploadExtra): VideoDetection[] | undefined {
  const payload = extra?.frame_detections;
  if (!Array.isArray(payload) || payload.length === 0) return undefined;

  const detections: VideoDetection[] = [];

  payload.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const frameIndex = toFiniteNumber(entry.frame_index);
    const subjectsPayload = Array.isArray(entry.subjects) ? entry.subjects : [];
    const boxesFallback = Array.isArray(entry.boxes) ? entry.boxes : [];

    const subjects: VideoDetectionSubject[] = [];

    if (subjectsPayload.length > 0) {
      subjectsPayload.forEach((subject) => {
        if (!subject || typeof subject !== "object") return;
        const box = normalizeFaceBoxFromAny(subject.box ?? subject.face_location ?? subject);
        if (!box) return;
        subjects.push({
          box,
          emotion: typeof subject.emotion === "string" ? subject.emotion : undefined,
          confidence: toFiniteNumber(subject.confidence),
        });
      });
    } else if (boxesFallback.length > 0) {
      boxesFallback.forEach((rawBox) => {
        const box = normalizeFaceBoxFromAny(rawBox);
        if (box) subjects.push({ box });
      });
    }

    if (!subjects.length) return;

    const timeSec = toFiniteNumber(entry.time_sec);
    const timestampMs = toFiniteNumber(entry.timestamp_ms);
    const normalizedTimestamp = timestampMs !== undefined ? Math.round(timestampMs) : undefined;
    const frameWidth = toFiniteNumber(entry.frame_width);
    const frameHeight = toFiniteNumber(entry.frame_height);

    detections.push({
      frameIndex: frameIndex !== undefined ? Math.max(0, Math.round(frameIndex)) : 0,
      timeSec,
      timestampMs: normalizedTimestamp,
      frameWidth: frameWidth !== undefined ? Math.round(frameWidth) : undefined,
      frameHeight: frameHeight !== undefined ? Math.round(frameHeight) : undefined,
      subjects,
    });
  });

  if (!detections.length) return undefined;

  detections.sort((a, b) => detectionSortValue(a) - detectionSortValue(b));

  return detections;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeFaceBoxFromAny(raw: unknown): FaceBox | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const left = toFiniteNumber(obj.left ?? obj.x);
  const top = toFiniteNumber(obj.top ?? obj.y);
  let right = toFiniteNumber(obj.right);
  let bottom = toFiniteNumber(obj.bottom);
  const width = toFiniteNumber(obj.width);
  const height = toFiniteNumber(obj.height);

  if (right === undefined && left !== undefined && width !== undefined) {
    right = left + width;
  }
  if (bottom === undefined && top !== undefined && height !== undefined) {
    bottom = top + height;
  }

  if (left === undefined || top === undefined || right === undefined || bottom === undefined) {
    return undefined;
  }

  return {
    left: Math.round(left),
    top: Math.round(top),
    right: Math.round(right),
    bottom: Math.round(bottom),
  };
}

function detectionSortValue(det: VideoDetection): number {
  if (det.timeSec !== undefined && det.timeSec !== null) {
    return det.timeSec;
  }
  if (det.timestampMs !== undefined && det.timestampMs !== null) {
    return det.timestampMs / 1000;
  }
  return det.frameIndex;
}

async function ensureFileForKind(kind: UploadKind, file: File): Promise<File> {
  if (kind !== "audio") return file;
  if (file.type === "audio/wav") return file;

  try {
    const wavBlob = await convertToWav(file);
    const base = file.name?.replace(/\.[^./]+$/, "") || "audio";
    return new File([wavBlob], `${base}.wav`, { type: "audio/wav" });
  } catch (error) {
    console.error("Failed to convert audio to WAV", error);
    throw error instanceof Error
      ? error
      : new Error("Cannot convert audio file to WAV format");
  }
}
