// src/features/vision-sentiment/hooks/useVisionRealtime.ts
import { useRef, useCallback } from "react";
import { useRealtimeLoop } from "../hooks/useRealtimeLoop";
import { predictFaceFromBlob } from "../services/visionApi";
import { cropFacesFromCanvas } from "../utils/crop";
import type { Box, ResultRow } from "../types";

type Params = {
  // 👇 cho phép null
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isRunning: boolean;
  setBoxes: (b: Box[]) => void;
  setCroppedFaceUrls: (m: Record<number, string>) => void;
  setCurrent: (r: ResultRow) => void;
  pushRow: (r: ResultRow) => void;
  interval?: number;
};

export const useVisionRealtime = ({
  videoRef,
  isRunning,
  setBoxes,
  setCroppedFaceUrls,
  setCurrent,
  pushRow,
  interval = 300,
}: Params) => {
  const processingRef = useRef(false);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const tick = useCallback(async () => {
    if (!isRunning) return;
    const video = videoRef.current;
    if (!video) return;
    if (processingRef.current) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const canvas = offscreenCanvasRef.current;

    const targetW = 640;
    const ratio = video.videoWidth / video.videoHeight || 1;
    const w = targetW;
    const h = Math.round(targetW / ratio);

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    processingRef.current = true;
    try {
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(
          (b) => (b ? res(b) : rej(new Error("toBlob fail"))),
          "image/jpeg",
          0.75
        )
      );

      const start = performance.now();
      const resp = await predictFaceFromBlob(blob, { skipSave: true });
      const latency = Math.round(performance.now() - start);

      if (resp.face_location) {
        const locs = Array.isArray(resp.face_location)
          ? resp.face_location
          : [resp.face_location];

        const boxes: Box[] = locs.map((loc, i) => ({
          id: i + 1,
          x: loc.left,
          y: loc.top,
          w: loc.right - loc.left,
          h: loc.bottom - loc.top,
        }));

        setBoxes(boxes);
        const crops = cropFacesFromCanvas(canvas, boxes);
        setCroppedFaceUrls(crops);
      } else {
        setBoxes([]);
        setCroppedFaceUrls({});
      }

      const topK = resp.all_emotions
        ? Object.entries(resp.all_emotions)
            .map(([label, score]) => ({ label, score }))
            .sort((a, b) => b.score - a.score)
        : [{ label: resp.emotion, score: resp.confidence }];

      const row: ResultRow = {
        id: String(Date.now()),
        source: "Realtime camera",
        label: resp.emotion ?? topK[0]?.label ?? "Unknown",
        confidence: resp.confidence ?? 0,
        latency,
        topK,
        ts: Date.now(),
      };

      setCurrent(row);
      pushRow(row);
    } finally {
      processingRef.current = false;
    }
  }, [
    isRunning,
    videoRef,
    setBoxes,
    setCroppedFaceUrls,
    setCurrent,
    pushRow,
  ]);

  useRealtimeLoop(isRunning, tick, interval);

  return {
    stopProcessing: () => {
      processingRef.current = false;
    },
  };
};
