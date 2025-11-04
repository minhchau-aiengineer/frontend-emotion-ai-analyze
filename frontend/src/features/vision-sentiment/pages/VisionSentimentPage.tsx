// vision-sentiment/pages/VisionSentimentPage.tsx
import React, { useMemo, useRef, useState, useCallback } from "react";
import { AnimatedHeader } from "../components/AnimatedHeader";
import { ImagePreview } from "../components/ImagePreview";
import { DetailModal } from "../components/DetailModal";
import { Donut } from "../components/Donut";
import { ResultsTable } from "../components/ResultsTable";
import { useCamera } from "../hooks/useCamera";
import { useFaceDetection } from "../hooks/useFaceDetection";
import { useRealtimeLoop } from "../hooks/useRealtimeLoop";
import { tokens } from "../utils/tokens";
import { cx } from "../utils/cx";
import { formatBytes } from "../utils/formatBytes";
import type { ResultRow } from "../types";
import { RealtimePreview } from "../components/RealtimePreview";

type Tab = "upload" | "camera" | "realtime";

const REALTIME_INTERVAL = 200; // ms

const createMockResult = (
  source: string,
  latency: number
): ResultRow => ({
  id: String(Date.now()),
  source,
  label: "Happy",
  confidence: 0.78,
  latency,
  topK: [
    { label: "Happy", score: 0.61 },
    { label: "Neutral", score: 0.22 },
    { label: "Surprised", score: 0.09 },
  ],
  ts: Date.now(),
});

export const VisionSentimentPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>("upload");
  const isCameraMode = tab === "camera" || tab === "realtime";

  // camera
  const {
    videoRef,
    camReady,
    stream,
    startCamera,
    stopCamera,
    takeSnapshot,
  } = useCamera(isCameraMode);

  // face detection
  const {
    boxes,
    activeId,
    setActiveId,
    runFaceDetection,
    clearDetection,
  } = useFaceDetection();

  // file / snapshot
  const [file, setFile] = useState<File | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const sourceUrl = snapshotUrl || (file ? URL.createObjectURL(file) : null);

  // current result
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<ResultRow | null>(null);

  // results table
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [q, setQ] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ResultRow | null>(null);

  // realtime state
  const [isRealtimeRunning, setIsRealtimeRunning] = useState(false);
  const processingRef = useRef(false); // để không chồng xử lý
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // filtered rows
  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.source.toLowerCase().includes(s) ||
        r.label.toLowerCase().includes(s) ||
        String(Math.round(r.confidence * 100)).includes(s)
    );
  }, [q, rows]);

  // khi chọn file
  const onFilePicked = (f: File) => {
    if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    setSnapshotUrl(null);
    setFile(f);
    const url = URL.createObjectURL(f);
    runFaceDetection(url);
  };

  // chụp từ camera (tab camera)
  const handleSnapshot = () => {
    const url = takeSnapshot();
    if (!url) return;
    if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    setSnapshotUrl(url);
    setFile(null);
    runFaceDetection(url);
  };

  // hàm phân tích dùng chung (cho cả upload/camera & realtime)
  const runAnalyzeOnSource = useCallback(
    async (sourceLabel: string) => {
      const start = performance.now();
      // mock gọi API
      await new Promise((r) => setTimeout(r, 650));
      const latency = Math.round(performance.now() - start);
      const row = createMockResult(sourceLabel, latency);
      setCurrent(row);
      setRows((p) => [row, ...p]);
    },
    []
  );

  // analyze từ nút Analyze (upload / camera)
  const analyze = async () => {
    if (!sourceUrl) return;
    setLoading(true);
    const label =
      tab === "camera"
        ? "Camera snapshot"
        : file
        ? `${file.name} • ${formatBytes(file.size)}`
        : "Image";
    await runAnalyzeOnSource(label);
    setLoading(false);
  };

  const clearAllInputs = () => {
    if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    setSnapshotUrl(null);
    setFile(null);
    clearDetection();
    setCurrent(null);
  };

  // export JSON/CSV
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ results: rows }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vision_sentiment_results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const header = ["index", "source", "label", "confidence", "latency", "time"];
    const body = rows.map((r, i) => [
      String(i + 1),
      r.source.replace(/"/g, '""'),
      r.label,
      String(Math.round(r.confidence * 100) + "%"),
      String(r.latency),
      new Date(r.ts).toLocaleString(),
    ]);
    const csv =
      [header, ...body]
        .map((line) => line.map((c) => `"${c}"`).join(","))
        .join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vision_sentiment_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ====== REALTIME LOOP ======
  const realtimeTick = useCallback(async () => {
    if (!isRealtimeRunning) return;
    if (!videoRef.current) return;
    if (processingRef.current) return; // đang xử lý thì bỏ

    const video = videoRef.current;
    // tạo / lấy canvas ẩn
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const canvas = offscreenCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    processingRef.current = true;

    // detect → để preview vẽ box
    await runFaceDetection(dataUrl);

    // analyze → cập nhật kết quả & bảng
    await runAnalyzeOnSource("Realtime camera");

    processingRef.current = false;
  }, [isRealtimeRunning, videoRef, runFaceDetection, runAnalyzeOnSource]);

  // chạy loop chỉ khi isRealtimeRunning = true
  useRealtimeLoop(isRealtimeRunning, realtimeTick, REALTIME_INTERVAL);

  // khi đổi tab khỏi realtime thì dừng
  const changeTab = (t: Tab) => {
    setTab(t);
    if (t !== "realtime") {
      setIsRealtimeRunning(false);
      processingRef.current = false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <AnimatedHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: các mode */}
        <div className={cx(tokens.card, "p-6 min-h-[340px]")}>
          <div className="flex gap-2 mb-4">
            <button
              className={tokens.btn.tab}
              data-active={tab === "upload"}
              onClick={() => changeTab("upload")}
            >
              Upload Image
            </button>
            <button
              className={tokens.btn.tab}
              data-active={tab === "camera"}
              onClick={() => changeTab("camera")}
            >
              Camera Capture
            </button>
            <button
              className={tokens.btn.tab}
              data-active={tab === "realtime"}
              onClick={() => changeTab("realtime")}
            >
              Realtime
            </button>
            <div className="ml-auto">
              <button className={tokens.btn.icon} onClick={clearAllInputs}>
                Clear
              </button>
            </div>
          </div>

          {/* UPLOAD */}
          {tab === "upload" ? (
            <label className="block">
              <div className="w-full border-2 border-dashed border-sky-500/40 hover:border-sky-400/70 transition-colors rounded-2xl bg-slate-900/40 p-6 text-center cursor-pointer">
                <div className="text-sky-200 font-medium">
                  Drop image here or click to browse
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  PNG, JPG, JPEG, BMP, TIFF • up to 25MB
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
          ) : null}

          {/* CAMERA CAPTURE */}
          {tab === "camera" ? (
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
                  onClick={handleSnapshot}
                >
                  Snapshot
                </button>
                {stream ? (
                  <button className={tokens.btn.ghost} onClick={stopCamera}>
                    Turn Off Camera
                  </button>
                ) : (
                  <button className={tokens.btn.ghost} onClick={startCamera}>
                    Turn On Camera
                  </button>
                )}
                <div className="text-sm text-slate-400">
                  Căn mặt ở trung tâm khung hình, ánh sáng đều.
                </div>
              </div>
            </>
          ) : null}

          {/* REALTIME */}
          {tab === "realtime" ? (
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
                    onClick={() => setIsRealtimeRunning(true)}
                  >
                    Analyze (Start)
                  </button>
                ) : (
                  <button
                    className={tokens.btn.ghost}
                    onClick={() => {
                      setIsRealtimeRunning(false);
                      processingRef.current = false;
                    }}
                  >
                    Stop
                  </button>
                )}

                {stream ? (
                  <button className={tokens.btn.ghost} onClick={stopCamera}>
                    Turn Off Camera
                  </button>
                ) : (
                  <button className={tokens.btn.ghost} onClick={startCamera}>
                    Turn On Camera
                  </button>
                )}

                <div className="text-sm text-slate-400">
                  Bấm Analyze để bắt đầu phân tích liên tục.
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Panel 2: Preview */}
        <div className={cx(tokens.card, "p-6 min-h-[340px]")}>
        <div className="text-sm text-slate-400 mb-2">Preview</div>

        {tab === "realtime" ? (
            // realtime: show video + overlay
            <RealtimePreview stream={stream} boxes={boxes} />
        ) : sourceUrl ? (
            // upload / camera: show image preview như cũ
            <ImagePreview
            sourceUrl={sourceUrl}
            boxes={boxes}
            activeId={activeId}
            />
        ) : (
            <div className="rounded-xl border border-white/10 bg-slate-900/40 min-h-[280px] grid place-items-center text-slate-400">
            Preview will appear here after you upload or take a snapshot.
            </div>
        )}
        </div>

        {/* Panel 3: Faces + actions */}
        <div className={cx(tokens.card, "p-6 min-h-[340px]")}>
          <div className="text-slate-200 font-semibold mb-2">
            Detected faces
          </div>
          {boxes.length ? (
            <div className="flex gap-2 overflow-x-auto py-2">
              {boxes.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveId(b.id)}
                  className={cx(
                    "min-w-[88px] h-[88px] rounded-xl border transition-colors",
                    activeId === b.id
                      ? "border-sky-400 ring-2 ring-sky-500/40"
                      : "border-white/10"
                  )}
                >
                  <div className="w-full h-full bg-slate-700/40 flex items-center justify-center text-slate-300 text-sm">
                    #{b.id}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-slate-400">
              No faces yet — upload or take a snapshot.
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

          {tab !== "realtime" ? (
            <div className="mt-6 flex gap-3">
              <button
                className={tokens.btn.primary}
                onClick={analyze}
                disabled={loading || !sourceUrl}
              >
                {loading ? "Analyzing…" : "Analyze"}
              </button>
              <button className={tokens.btn.ghost} onClick={clearAllInputs}>
                Clear
              </button>
            </div>
          ) : (
            <div className="mt-6 text-xs text-slate-500">
              Realtime đang dùng nút Analyze/Stop bên panel trái.
            </div>
          )}
        </div>

        {/* Panel 4: Current Result */}
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
                        style={{
                          width: `${Math.round(t.score * 100)}%`,
                          transition: "width .6s cubic-bezier(.2,.9,.2,1)",
                        }}
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
      </div>

      {/* TABLE */}
      <ResultsTable
        rows={rows}
        filtered={filtered}
        query={q}
        onQueryChange={setQ}
        onClearAll={() => setRows([])}
        onExportJSON={exportJSON}
        onExportCSV={exportCSV}
        onRowClick={(row) => {
          setSelectedRow(row);
          setOpen(true);
        }}
      />

      <DetailModal
        open={open}
        onClose={() => setOpen(false)}
        row={selectedRow}
      />
    </div>
  );
};

export default VisionSentimentPage;
