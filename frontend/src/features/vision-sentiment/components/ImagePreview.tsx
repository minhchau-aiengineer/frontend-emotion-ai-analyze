// vision-sentiment/components/ImagePreview.tsx
import React, { useEffect, useRef, useState } from "react";
import type { Box } from "../types";

const drawBoxes = (
  ctx: CanvasRenderingContext2D,
  boxes: Box[],
  scale: number,
  activeId: number | null
) => {
  ctx.save();
  boxes.forEach((b) => {
    ctx.strokeStyle = "rgba(56,189,248,.85)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(b.x * scale, b.y * scale, b.w * scale, b.h * scale);
  });
  const act = boxes.find((b) => b.id === activeId);
  if (act) {
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(168,85,247,.9)";
    ctx.lineWidth = 3;
    ctx.strokeRect(act.x * scale, act.y * scale, act.w * scale, act.h * scale);
  }
  ctx.restore();
};

type ImagePreviewProps = {
  sourceUrl?: string | null;
  boxes: Box[];
  activeId: number | null;
  emotion?: string | null;
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  sourceUrl,
  boxes,
  activeId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!sourceUrl) {
      setImg(null);
      return;
    }
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = sourceUrl;
  }, [sourceUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const maxW = 880;
    const ratio = Math.min(1, maxW / img.width);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.style.maxWidth = "100%"; // 👈 thêm dòng này
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "rgba(15,23,42,.6)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.drawImage(img, 0, 0, w, h);

    drawBoxes(ctx, boxes, ratio, activeId);
  }, [img, boxes, activeId]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/40 min-h-[280px] grid place-items-center">
      <canvas ref={canvasRef} />
    </div>
  );
};
