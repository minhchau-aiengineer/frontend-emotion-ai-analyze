// src/features/vision-sentiment/components/VisionControlsPanel.tsx
import React from "react";
import { tokens } from "../utils/tokens";
import { cx } from "../utils/cx";
import { formatBytes } from "../utils/formatBytes";

type Tab = "upload" | "camera" | "realtime";

type Props = {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  // 👇 cho phép null
  videoRef: React.RefObject<HTMLVideoElement | null>;
  camReady: boolean;
  stream: MediaStream | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSnapshot: () => void;
  onFilePicked: (f: File) => void;
  onClear: () => void;
  isRealtimeRunning: boolean;
  setRealtimeRunning: (v: boolean) => void;
  file: File | null;
};

export const VisionControlsPanel: React.FC<Props> = ({
  tab,
  onTabChange,
  videoRef,
  camReady,
  stream,
  onStartCamera,
  onStopCamera,
  onSnapshot,
  onFilePicked,
  onClear,
  isRealtimeRunning,
  setRealtimeRunning,
  file,
}) => {
  return (
    <div className={cx(tokens.card, "p-6 min-h-[340px]")}>
      <div className="flex gap-2 mb-4">
        <button
          className={tokens.btn.tab}
          data-active={tab === "upload"}
          onClick={() => onTabChange("upload")}
        >
          Upload Image
        </button>
        <button
          className={tokens.btn.tab}
          data-active={tab === "camera"}
          onClick={() => onTabChange("camera")}
        >
          Camera Capture
        </button>
        <button
          className={tokens.btn.tab}
          data-active={tab === "realtime"}
          onClick={() => onTabChange("realtime")}
        >
          Realtime
        </button>
        <div className="ml-auto">
          <button className={tokens.btn.icon} onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      {tab === "upload" && (
        <label className="block">
          <div className="w-full border-2 border-dashed border-sky-500/40 hover:border-sky-400/70 rounded-2xl bg-slate-900/40 p-6 text-center cursor-pointer">
            <div className="text-sky-200 font-medium">
              Drop image here or click to browse
            </div>
            <div className="mt-1 text-sm text-slate-400">
              PNG, JPG, JPEG • up to 25MB
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFilePicked(f);
              }}
            />
          </div>
          {file && (
            <div className="mt-3 text-sm text-slate-300">
              Selected: {file.name} • {formatBytes(file.size)}
            </div>
          )}
        </label>
      )}

      {tab === "camera" && (
        <>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-h-[260px] object-contain bg-slate-900"
            />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              className={tokens.btn.primary}
              disabled={!camReady}
              onClick={onSnapshot}
            >
              Snapshot
            </button>
            {stream ? (
              <button className={tokens.btn.ghost} onClick={onStopCamera}>
                Turn Off Camera
              </button>
            ) : (
              <button className={tokens.btn.ghost} onClick={onStartCamera}>
                Turn On Camera
              </button>
            )}
            <div className="text-sm text-slate-400">
              Căn mặt ở trung tâm khung hình, ánh sáng đều.
            </div>
          </div>
        </>
      )}

      {tab === "realtime" && (
        <>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-h-[260px] object-contain bg-slate-900"
            />
          </div>
          <div className="flex items-center gap-3 mt-4">
            {!isRealtimeRunning ? (
              <button
                className={tokens.btn.primary}
                disabled={!camReady}
                onClick={() => setRealtimeRunning(true)}
              >
                Analyze (Start)
              </button>
            ) : (
              <button
                className={tokens.btn.ghost}
                onClick={() => setRealtimeRunning(false)}
              >
                Stop
              </button>
            )}

            {stream ? (
              <button className={tokens.btn.ghost} onClick={onStopCamera}>
                Turn Off Camera
              </button>
            ) : (
              <button className={tokens.btn.ghost} onClick={onStartCamera}>
                Turn On Camera
              </button>
            )}

            <div className="text-sm text-slate-400">
              Bấm Analyze để bắt đầu phân tích liên tục.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
