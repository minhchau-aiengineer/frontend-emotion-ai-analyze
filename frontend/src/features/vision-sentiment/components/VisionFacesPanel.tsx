// src/features/vision-sentiment/components/VisionFacesPanel.tsx
import React from "react";
import { tokens } from "../utils/tokens";
import { cx } from "../utils/cx";
import type { Box } from "../types";

type Props = {
  boxes: Box[];
  activeId: number | null;
  onSelect: (id: number) => void;
  croppedFaceUrls: Record<number, string>;
  isRealtime: boolean;
  onAnalyzeClick?: () => void;
  onClearClick?: () => void;
  analyzeDisabled?: boolean;
};

export const VisionFacesPanel: React.FC<Props> = ({
  boxes,
  activeId,
  onSelect,
  croppedFaceUrls,
  isRealtime,
  onAnalyzeClick,
  onClearClick,
  analyzeDisabled,
}) => {
  return (
    <div className={cx(tokens.card, "p-6 min-h-[340px]")}>
      <div className="text-slate-200 font-semibold mb-2">Detected faces</div>
      {boxes.length ? (
        <div className="flex gap-2 overflow-x-auto py-2">
          {boxes.map((b) => {
            const url = croppedFaceUrls[b.id];
            return (
              <button
                key={b.id}
                onClick={() => onSelect(b.id)}
                className={cx(
                  "min-w-[88px] h-[88px] rounded-xl border transition-colors overflow-hidden",
                  activeId === b.id
                    ? "border-sky-400 ring-2 ring-sky-500/40"
                    : "border-white/10"
                )}
              >
                {url ? (
                  <img src={url} alt={`Face ${b.id}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-700/40 flex items-center justify-center text-slate-300 text-sm">
                    #{b.id}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-slate-400">
          No faces yet — upload, snapshot or start realtime.
        </div>
      )}

      <div className="mt-6">
        <div className="text-sm text-slate-300 font-medium mb-2">
          Preprocess
        </div>
        <ul className="text-sm text-slate-400 grid gap-1">
          <li>✓ Face detection → draw bounding boxes</li>
          <li>✓ Grayscale + resize 224×224 preview</li>
        </ul>
      </div>

      {!isRealtime ? (
        <div className="mt-6 flex gap-3">
          <button
            className={tokens.btn.primary}
            onClick={onAnalyzeClick}
            disabled={analyzeDisabled}
          >
            Analyze
          </button>
          <button className={tokens.btn.ghost} onClick={onClearClick}>
            Clear
          </button>
        </div>
      ) : (
        <div className="mt-6 text-xs text-slate-500">
          Realtime đang dùng nút Analyze/Stop bên panel trái.
        </div>
      )}
    </div>
  );
};
