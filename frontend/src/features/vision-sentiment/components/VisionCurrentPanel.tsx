// src/features/vision-sentiment/components/VisionCurrentPanel.tsx
import React from "react";
import { tokens } from "../utils/tokens";
import { cx } from "../utils/cx";
import { Donut } from "./Donut";
import type { ResultRow } from "../types";

type Props = {
  current: ResultRow | null;
};

export const VisionCurrentPanel: React.FC<Props> = ({ current }) => {
  return (
    <div className={cx(tokens.card, "p-6 min-h-[340px]")}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-sm uppercase tracking-widest text-slate-400">
            VISION SENTIMENT
          </div>
          <div
            className={cx(
              "mt-1 text-3xl font-extrabold",
              current?.label === "Happy"
                ? "text-emerald-300"
                : current?.label === "Angry"
                ? "text-rose-300"
                : "text-slate-200"
            )}
          >
            {current?.label ?? "—"}
          </div>
        </div>
        <div className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-slate-900/40 text-slate-300">
          {current?.latency ?? 0} ms
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Donut pct={Math.round((current?.confidence ?? 0) * 100)} />
        <div>
          <div className="text-xs text-slate-400 mb-2">Top-K Emotions</div>
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
                    style={{ width: `${Math.round(t.score * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {!current && (
            <div className="text-slate-400 text-sm mt-4">
              Fair-Use: facial expression only — no sensitive attribute inference.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
