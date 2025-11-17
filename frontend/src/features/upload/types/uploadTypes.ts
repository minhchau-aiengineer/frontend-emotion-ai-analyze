// src/features/upload/types/uploadTypes.ts
export type UploadKind = "image" | "audio" | "video";

export type FaceBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type VideoDetectionSubject = {
  box: FaceBox;
  emotion?: string;
  confidence?: number;
};

export type VideoDetection = {
  frameIndex: number;
  timeSec?: number | null;
  timestampMs?: number | null;
  frameWidth?: number;
  frameHeight?: number;
  subjects: VideoDetectionSubject[];
};

export type VideoMeta = {
  fps?: number;
  durationSec?: number;
  totalFrames?: number;
  sampledFrames?: number;
  processedFrames?: number;
  frameStep?: number;
};

export type UploadResultRow = {
  id: string;
  source: string;
  kind: UploadKind;
  label: string;
  confidence: number;
  latency: number;
  topK: { label: string; score: number }[];
  ts: number;
  fileUrl?: string;
  resultUrl?: string;
  sizeBytes?: number;
  faceLocations?: FaceBox[];
  videoDetections?: VideoDetection[];
  videoMeta?: VideoMeta;
  raw?: unknown;
};

