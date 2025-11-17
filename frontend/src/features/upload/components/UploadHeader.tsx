// src/features/upload/components/UploadHeader.tsx
import React from "react";
import { KEYFRAMES } from "../utils/keyframes";
import { Upload } from "lucide-react";

export const UploadHeader: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 mb-8">
      <style>{KEYFRAMES}</style>
      <div
        className="absolute inset-0 opacity-75"
        style={{
          background:
            "linear-gradient(90deg,#0ea5e9,#4f46e5,#8b5cf6,#4f46e5,#0ea5e9)",
          backgroundSize: "300% 100%",
          animation: "moveX 16s linear infinite",
        }}
      />
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/30"
            style={{
              left: `${(i * 57) % 100}%`,
              top: `${(i * 37) % 100}%`,
              opacity: 0.35,
              animation: `floatDot ${6 + (i % 5)}s ease-in-out ${i * 0.25}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative px-6 py-7 md:px-10 md:py-9 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 grid place-items-center text-sky-200">
          <Upload className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-extrabold text-sky-50">
            Upload
          </h1>
          <p className="text-slate-200/85">
            Tải ảnh, audio, video để xử lý và lưu lịch sử phân tích.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-slate-100">
            Glow UI
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-slate-100">
            Upload-ready
          </span>
        </div>
      </div>

      <div className="relative h-[3px] rounded-b-2xl overflow-hidden">
        <div
          className="absolute top-0 h-[3px] w-[35%] rounded-full"
          style={{
            background: "linear-gradient(90deg,#22d3ee,#a855f7,#22d3ee)",
            animation: "runLine 8s linear infinite",
          }}
        />
      </div>
    </div>
  );
};
