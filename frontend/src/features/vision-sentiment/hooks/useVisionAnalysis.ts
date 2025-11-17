// src/features/vision-sentiment/hooks/useVisionAnalysis.ts
import { useState, useCallback } from "react";
import {
  predictFaceFromBlob,
  predictFaceFromDataUrl,
} from "../services/visionApi";
import { cropFaceFromImage } from "../utils/crop";
import type { Box, ResultRow } from "../types";

type Params = {
  file: File | null;
  snapshotUrl: string | null;
  sourceUrl: string | null;
  setBoxes: (b: Box[]) => void;
  clearDetection: () => void;
  setCroppedFaceUrls: (m: Record<number, string>) => void;
};

export const useVisionAnalysis = ({
  file,
  snapshotUrl,
  sourceUrl,
  setBoxes,
  clearDetection,
  setCroppedFaceUrls,
}: Params) => {
  const [current, setCurrent] = useState<ResultRow | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeOnce = useCallback(
    async (sourceLabel: string) => {
      if (!file && !snapshotUrl) return;

      const start = performance.now();

      const resp = file
        ? await predictFaceFromBlob(file)
        : await predictFaceFromDataUrl(snapshotUrl!);

      const latency = Math.round(performance.now() - start);

      const topK = resp.all_emotions
        ? Object.entries(resp.all_emotions)
            .map(([label, score]) => ({ label, score }))
            .sort((a, b) => b.score - a.score)
        : [{ label: resp.emotion, score: resp.confidence }];

      const row: ResultRow = {
        id: String(Date.now()),
        source: sourceLabel,
        label: resp.emotion ?? topK[0]?.label ?? "Unknown",
        confidence: resp.confidence ?? 0,
        latency,
        topK,
        ts: Date.now(),
      };

      setCurrent(row);
      setRows((prev) => [row, ...prev]);

      // handle boxes
      if (resp.face_location) {
        const locs = Array.isArray(resp.face_location)
          ? resp.face_location
          : [resp.face_location];

        const bxs: Box[] = locs.map((loc, i) => ({
          id: i + 1,
          x: loc.left,
          y: loc.top,
          w: loc.right - loc.left,
          h: loc.bottom - loc.top,
        }));

        setBoxes(bxs);

        // crop từ ảnh gốc (upload / snapshot)
        if (sourceUrl) {
          const map: Record<number, string> = {};
          for (const b of bxs) {
            map[b.id] = await cropFaceFromImage(sourceUrl, b);
          }
          setCroppedFaceUrls(map);
        }
      } else {
        clearDetection();
        setCroppedFaceUrls({});
      }

      return row;
    },
    [file, snapshotUrl, sourceUrl, setBoxes, clearDetection, setCroppedFaceUrls]
  );

  const analyzeWithLoading = useCallback(
    async (label: string) => {
      setLoading(true);
      await analyzeOnce(label);
      setLoading(false);
    },
    [analyzeOnce]
  );

  return {
    current,
    rows,
    setRows,
    loading,
    analyzeOnce,
    analyzeWithLoading,
    setCurrent,
  };
};
