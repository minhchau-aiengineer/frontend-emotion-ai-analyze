// vision-sentiment/components/RealtimePreview.tsx
import React, { useEffect, useRef } from "react";
import type { Box } from "../types";

type RealtimePreviewProps = {
  stream: MediaStream | null;
  boxes: Box[];
};

export const RealtimePreview: React.FC<RealtimePreviewProps> = ({
  stream,
  boxes,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // gán stream vào video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // vẽ boxes lên canvas overlay
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) {
        requestAnimationFrame(draw);
        return;
      }

      // resize canvas theo video
      canvas.width = vw;
      canvas.height = vh;

      ctx.clearRect(0, 0, vw, vh);

      boxes.forEach((b) => {
        ctx.save();
        ctx.strokeStyle = "rgba(56,189,248,.85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.restore();
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [boxes]);

  return (
    <div className="relative w-full rounded-xl border border-white/10 bg-slate-900/40 min-h-[280px] overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain bg-slate-900"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
