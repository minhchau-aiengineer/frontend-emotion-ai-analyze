// src/features/vision-sentiment/components/VisionPreviewPanel.tsx
import React from "react";
import { tokens } from "../utils/tokens";
import { cx } from "../utils/cx";
import { ImagePreview } from "./ImagePreview";
import { RealtimePreview } from "./RealtimePreview";
import type { Box } from "../types";

type Tab = "upload" | "camera" | "realtime";

type Props = {
  tab: Tab;
  sourceUrl: string | null;
  stream: MediaStream | null;
  boxes: Box[];
  activeId: number | null;
  emotion?: string;
  confidence?: number;
};

export const VisionPreviewPanel: React.FC<Props> = ({
  tab,
  sourceUrl,
  stream,
  boxes,
  activeId,
  emotion,
  confidence,
}) => {
  return (
    <div className={cx(tokens.card, "p-6 min-h-[340px]")}>
      <div className="text-sm text-slate-400 mb-2">Preview</div>
      {tab === "realtime" ? (
        <RealtimePreview
          stream={stream}
          boxes={boxes}
          emotion={emotion}
          confidence={confidence}
        />
      ) : sourceUrl ? (
        <ImagePreview
          sourceUrl={sourceUrl}
          boxes={boxes}
          activeId={activeId}
          emotion={emotion}
        />
      ) : (
        <div className="rounded-xl border border-white/10 bg-slate-900/40 min-h-[280px] grid place-items-center text-slate-400">
          Preview will appear here after you upload or take a snapshot.
        </div>
      )}
    </div>
  );
};
