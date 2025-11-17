import React from "react";
import { Trash2 } from "lucide-react";

export const TrashHeader: React.FC = () => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 mb-6">
    {/* keyframes cho nền chạy + chấm + line */}
    <style>{`
      @keyframes moveX {
        0% { background-position: 0% 0; }
        100% { background-position: 300% 0; }
      }
      @keyframes floatDot {
        0%,100% { transform: translateY(0); opacity: .4; }
        50% { transform: translateY(-6px); opacity: 1; }
      }
      @keyframes runLine {
        0% { transform: translateX(-150%); }
        100% { transform: translateX(350%); }
      }
    `}</style>

    {/* nền động giống log header */}
    <div
      className="absolute inset-0 opacity-80 rounded-2xl"
      style={{
        background:
          "linear-gradient(90deg,#0f172a,#1d235e,#162447,#0f172a,#0f172a)",
        backgroundSize: "300% 100%",
        animation: "moveX 16s linear infinite",
      }}
    />
    {/* overlay làm dịu màu */}
    <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px] rounded-2xl" />

    {/* chấm động */}
    <div className="pointer-events-none absolute inset-0 rounded-2xl">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{
            left: `${(i * 61) % 100}%`,
            top: `${(i * 37) % 100}%`,
            opacity: 0.35,
            animation: `floatDot ${6 + (i % 5)}s ease-in-out ${i * 0.25}s infinite`,
          }}
        />
      ))}
    </div>

    {/* nội dung */}
    <div className="relative px-6 py-7 md:px-10 md:py-9 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 grid place-items-center text-sky-300 mr-1">
        <Trash2 className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-white">Trash</h1>
        <p className="text-slate-200/80">
          Các mục trong thùng rác sẽ bị xóa vĩnh viễn sau 30 ngày.
        </p>
      </div>
    </div>

    {/* line chạy dưới giống header kia */}
    <div className="relative h-[3px] overflow-hidden rounded-b-2xl">
      <div
        className="absolute top-0 left-0 h-[3px] w-[30%] rounded-full"
        style={{
          background: "linear-gradient(90deg,#22d3ee,#a855f7,#22d3ee)",
          animation: "runLine 8s linear infinite",
        }}
      />
    </div>
  </div>
);
