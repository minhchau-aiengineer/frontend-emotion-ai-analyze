// src/features/upload/components/CurrentResultPanel.tsx
import React from "react";
import { tokens } from "../utils/tokens";
import { UploadResultRow } from "../types/uploadTypes";

const Donut: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 70;
  const C = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ width: 190, height: 190 }} className="relative">
      <svg viewBox="0 0 200 200" className="w-full h-full rotate-[-90deg]">
        <defs>
          <linearGradient id="gauge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={r}
          stroke="rgba(255,255,255,.14)"
          strokeWidth="18"
          fill="none"
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          stroke="url(#gauge)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: C,
            strokeDashoffset: C * (1 - p / 100),
            transition: "stroke-dashoffset .8s cubic-bezier(.2,.9,.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-4xl font-extrabold text-sky-200">{p}%</div>
          <div className="text-xs text-slate-400">confidence</div>
        </div>
      </div>
    </div>
  );
};

export const CurrentResultPanel: React.FC<{
  current: UploadResultRow | null;
}> = ({ current }) => {
  return (
    <div className={tokens.card + " p-6 min-h-[340px]"}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-sm uppercase tracking-widest text-slate-400">
            UPLOAD RESULT
          </div>
          <div
            className={
              "mt-1 text-3xl font-extrabold " +
              (current?.label === "Happy"
                ? "text-emerald-300"
                : current?.label === "Angry"
                ? "text-rose-300"
                : "text-slate-200")
            }
          >
            {current?.label ?? "—"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Source: {current?.source ?? "—"}
          </div>
        </div>
        <div className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-slate-900/40 text-slate-300">
          {current?.latency ?? 0} ms
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Donut pct={Math.round((current?.confidence ?? 0) * 100)} />
        <div>
          <div className="text-xs text-slate-400 mb-2">Top-K</div>
          <div className="grid gap-2">
            {(current?.topK ?? []).map((t) => (
              <div
                key={t.label}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-200">{t.label}</span>
                  <span className="text-slate-400 text-sm">
                    {Math.round(t.score * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-fuchsia-400"
                    style={{
                      width: `${Math.round(t.score * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {!current && (
            <div className="text-slate-400 text-sm mt-4">
              Chọn tệp và bấm Analyze để xem kết quả.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
