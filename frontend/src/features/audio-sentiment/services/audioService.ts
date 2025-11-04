// audio-sentiment/services/audioService.ts
import type { AudioSentimentResult } from "../types";
import { makeSineWav } from "../utils/makeSineWav";

// chỗ này bạn đổi URL / header / token sau này chỉ trong file này
const API_ENDPOINT = "/api/analyze/audio";

export async function analyzeAudioFile(
  file: File
): Promise<AudioSentimentResult> {
  const fd = new FormData();
  fd.append("file", file);
  const start = performance.now();
  const res = await fetch(API_ENDPOINT, { method: "POST", body: fd });
  const latency = Math.round(performance.now() - start);
  if (!res.ok) {
    throw new Error("Analyze failed");
  }
  const json = await res.json();
  return {
    label: json.label ?? "Neutral",
    confidence: json.confidence ?? 0.5,
    topK: json.topK ?? [],
    latency,
  };
}

export async function analyzeAudioBlob(
  blob: Blob
): Promise<AudioSentimentResult> {
  // nếu server chấp nhận multipart giống file thì dùng chung
  const fd = new FormData();
  fd.append("file", blob, "recorded_audio.webm");
  const start = performance.now();
  const res = await fetch(API_ENDPOINT, { method: "POST", body: fd });
  const latency = Math.round(performance.now() - start);
  if (!res.ok) {
    throw new Error("Analyze failed");
  }
  const json = await res.json();
  return {
    label: json.label ?? "Neutral",
    confidence: json.confidence ?? 0.5,
    topK: json.topK ?? [],
    latency,
  };
}

// demo sample – bạn có thể đổi thành fetch từ server
export async function fetchDemoSample(): Promise<File> {
  const demoBlob = makeSineWav(1, 440, 16000);
  return new File([demoBlob], "demo.wav", { type: "audio/wav" });
}
