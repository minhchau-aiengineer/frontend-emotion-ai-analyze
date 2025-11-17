// src/features/log/components/LogAnimatedHeader.tsx
import React, { useState } from "react";
import { Download, Trash2, ListTree, ChevronDown } from "lucide-react";

const KEYFRAMES = `
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
`;

type ExportFormat = "json" | "csv";

type LogAnimatedHeaderProps = {
  title?: string;
  subtitle?: string;
  onExport?: (format: ExportFormat) => void;
  onClear?: () => void;
};

export const LogAnimatedHeader: React.FC<LogAnimatedHeaderProps> = ({
  title = "System Logs",
  subtitle = "Lịch sử hoạt động của các mô-đun (Vision, Audio, Text, Max Fusion...)",
  onExport,
  onClear,
}) => {
  const [openMenu, setOpenMenu] = useState(false);

  const handleExport = (format: ExportFormat) => {
    setOpenMenu(false);
    onExport?.(format);
  };

  return (
    <div className="relative mb-8">
      <style>{KEYFRAMES}</style>

      {/* khối nền có bo góc + overflow, KHÔNG chứa dropdown */}
      <div className="relative rounded-2xl border border-white/10">
        {/* bg chạy (sáng hơn, đồng bộ bảng log header) */}
        <div
          className="absolute inset-0 opacity-80 rounded-2xl"
          style={{
            background:
              "linear-gradient(90deg,#1e293b,#2f3f7a,#3b4a86,#1e293b,#1e293b)",
            backgroundSize: "300% 100%",
            animation: "moveX 16s linear infinite",
          }}
        />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] rounded-2xl" />

        {/* chấm bay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl">
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
          {/* line dưới */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-b-2xl">
            <div
              className="h-[3px] w-[35%] rounded-full"
              style={{
                background: "linear-gradient(90deg,#22d3ee,#a855f7,#22d3ee)",
                animation: "runLine 8s linear infinite",
              }}
            />
          </div>
        </div>

        {/* content */}
        <div className="relative px-6 py-7 md:px-10 md:py-9 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 grid place-items-center text-sky-300 mr-1">
            <ListTree className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-50 leading-tight">
              {title}
            </h1>
            <p className="text-slate-200/85 text-sm md:text-base">{subtitle}</p>
          </div>

          {/* vùng action để dropdown bay ra ngoài */}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setOpenMenu((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-slate-100 border border-white/10"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4 opacity-70" />
              </button>

              {openMenu && (
                <div
                  className="absolute right-0 mt-2 w-40 bg-slate-900/95 border border-white/10 rounded-lg shadow-lg backdrop-blur-md z-30"
                  onMouseLeave={() => setOpenMenu(false)}
                >
                  <button
                    onClick={() => handleExport("json")}
                    className="w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClear}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/85 hover:bg-rose-500 text-sm text-white"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
