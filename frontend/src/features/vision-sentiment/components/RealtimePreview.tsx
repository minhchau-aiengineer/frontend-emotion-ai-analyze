import React, { useEffect, useRef } from "react";
import type { Box } from "../types";

type RealtimePreviewProps = {
  stream: MediaStream | null;
  boxes: Box[];
  emotion?: string;
  confidence?: number;
};

export const RealtimePreview: React.FC<RealtimePreviewProps> = ({
  stream,
  boxes,
  emotion,
  confidence,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // gán stream vào video
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    if (stream) {
      video.srcObject = stream;
    } else {
      // không còn stream → tắt video
      video.srcObject = null;
    }
  }, [stream]);

  // vẽ overlay
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const render = () => {
      // nếu không có stream hoặc không có video → clear rồi khỏi vẽ nữa
      if (!video || !stream) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (!vw || !vh) {
        raf = requestAnimationFrame(render);
        return;
      }

      // sync kích thước
      canvas.width = vw;
      canvas.height = vh;

      ctx.clearRect(0, 0, vw, vh);

      boxes.forEach((b, idx) => {
        ctx.save();
        // viền xanh lá
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // label chỉ vẽ cho box đầu
        const hasLabel = idx === 0;
        if (hasLabel) {
          const labelText = emotion
            ? `${emotion} ${Math.round((confidence ?? 0) * 100)}%`
            : "face";

          const padX = 6;
          const padY = 4;
          ctx.font =
            "12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          const textWidth = ctx.measureText(labelText).width;
          const boxWidth = textWidth + padX * 2;
          const boxHeight = 20;

          const labelX = b.x;
          const labelY = b.y - boxHeight - 4;

          ctx.fillStyle = "#22c55e";
          ctx.fillRect(labelX, labelY, boxWidth, boxHeight);

          ctx.fillStyle = "#052e16"; // xanh đậm để chữ nổi
          ctx.fillText(labelText, labelX + padX, labelY + boxHeight - padY);
        }

        ctx.restore();
      });

      raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      // clear khi unmount
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [stream, boxes, emotion, confidence]);

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
