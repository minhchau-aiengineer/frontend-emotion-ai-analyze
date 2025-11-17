// vision-sentiment/hooks/useFaceDetection.ts
import { useState } from "react";
import type { Box } from "../types";

export const useFaceDetection = () => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  // mock
  const runFaceDetection = async (imageUrl: string) => {
    await new Promise((r) => setTimeout(r, 350));
    const faces = Math.max(1, Math.round(Math.random() * 1) + 1);
    const arr: Box[] = Array.from({ length: faces }).map((_, i) => ({
      id: i + 1,
      x: 60 + i * 120,
      y: 60 + (i % 2) * 70,
      w: 140,
      h: 140,
    }));
    setBoxes(arr);
    setActiveId(arr[0]?.id ?? null);
    return arr;
  };

  const clearDetection = () => {
    setBoxes([]);
    setActiveId(null);
  };

   // allow external code to set boxes (e.g. from backend face_location)
  const setBoxesExternal = (b: Box[]) => {
    console.log("useFaceDetection: setBoxesExternal called with:", b);
    setBoxes(b);
    const newActiveId = b[0]?.id ?? null;
    console.log("useFaceDetection: Setting activeId to:", newActiveId);
    setActiveId(newActiveId);
  };

  return {
    boxes,
    activeId,
    setActiveId,
    runFaceDetection,
    clearDetection,
    setBoxes: setBoxesExternal,
  };
};
