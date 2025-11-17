// src/features/vision-sentiment/pages/VisionSentimentPage.tsx
import React, { useMemo, useState } from "react";
import { AnimatedHeader } from "../components/AnimatedHeader";
import { ResultsTable } from "../components/ResultsTable";
import { useCamera } from "../hooks/useCamera";
import { useFaceDetection } from "../hooks/useFaceDetection";
import { useVisionAnalysis } from "../hooks/useVisionAnalysis";
import { useVisionRealtime } from "../hooks/useVisionRealtime";
import { VisionControlsPanel } from "../components/VisionControlsPanel";
import { VisionPreviewPanel } from "../components/VisionPreviewPanel";
import { VisionFacesPanel } from "../components/VisionFacesPanel";
import { VisionCurrentPanel } from "../components/VisionCurrentPanel";
import { tokens } from "../utils/tokens";
import { cx } from "../utils/cx";
import { deleteOneRow } from "../utils/deleteOneRow";
import type { ResultRow } from "../types";

type Tab = "upload" | "camera" | "realtime";

const REALTIME_INTERVAL = 300;

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

  // face detection state
  const {
    boxes,
    activeId,
    setActiveId,
    setBoxes,
    clearDetection,
  } = useFaceDetection();

  // file / snapshot state
  const [file, setFile] = useState<File | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const sourceUrl = snapshotUrl || (file ? URL.createObjectURL(file) : null);

  // cropped faces
  const [croppedFaceUrls, setCroppedFaceUrls] = useState<
    Record<number, string>
  >({});

  // analysis hook
  const {
    current,
    rows,
    setRows,
    loading,
    analyzeWithLoading,
    setCurrent,
  } = useVisionAnalysis({
    file,
    snapshotUrl,
    sourceUrl,
    setBoxes,
    clearDetection,
    setCroppedFaceUrls,
  });

  // realtime on top of camera
  const [isRealtimeRunning, setIsRealtimeRunning] = useState(false);
  useVisionRealtime({
    videoRef: videoRef as React.RefObject<HTMLVideoElement>, // 👈 ép kiểu tránh TS2322
    isRunning: isRealtimeRunning,
    setBoxes,
    setCroppedFaceUrls,
    setCurrent,
    pushRow: (r: ResultRow) => setRows((p) => [r, ...p]),
    interval: REALTIME_INTERVAL,
  });

  // filter rows
  const [q, setQ] = useState("");
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

  // ============ handlers ============

  const handleFilePicked = (f: File) => {
    if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    setSnapshotUrl(null);
    setFile(f);
    // khi chọn file mới → clear khung cũ
    clearDetection();
    setCroppedFaceUrls({});
  };

  const handleSnapshot = () => {
    const url = takeSnapshot();
    if (!url) return;
    if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    setSnapshotUrl(url);
    setFile(null);
    clearDetection();
    setCroppedFaceUrls({});
  };

  const handleAnalyzeClick = async () => {
    if (!sourceUrl) return;
    const label =
      tab === "camera"
        ? "Camera snapshot"
        : file
        ? file.name
        : "Image";
    await analyzeWithLoading(label);
  };

  const handleClearAll = () => {
    if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    setSnapshotUrl(null);
    setFile(null);
    clearDetection();
    setCroppedFaceUrls({});
    setCurrent(null);
  };

  // 👇 quan trọng: stop camera thì clear luôn boxes + faces + realtime
  const handleStopCamera = () => {
    stopCamera();
    setIsRealtimeRunning(false);
    clearDetection();
    setCroppedFaceUrls({});
    // giữ current thì donut vẫn hiển thị, nếu muốn tắt luôn thì:
    // setCurrent(null);
  };

  // export
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

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <AnimatedHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: controls */}
        <VisionControlsPanel
          tab={tab}
          onTabChange={(t) => {
            setTab(t);
            if (t !== "realtime") {
              setIsRealtimeRunning(false);
              // đổi tab khỏi realtime → xoá khung
              clearDetection();
              setCroppedFaceUrls({});
            }
          }}
          videoRef={videoRef as React.RefObject<HTMLVideoElement>} // 👈 ép kiểu
          camReady={camReady}
          stream={stream}
          onStartCamera={startCamera}
          onStopCamera={handleStopCamera} // 👈 dùng handler đã clear
          onSnapshot={handleSnapshot}
          onFilePicked={handleFilePicked}
          onClear={handleClearAll}
          isRealtimeRunning={isRealtimeRunning}
          setRealtimeRunning={setIsRealtimeRunning}
          file={file}
        />

        {/* PANEL 2: preview */}
        <VisionPreviewPanel
          tab={tab}
          sourceUrl={sourceUrl}
          stream={stream}
          boxes={boxes}
          activeId={activeId}
          emotion={current?.label}
          confidence={current?.confidence}
        />

        {/* PANEL 3: faces */}
        <VisionFacesPanel
          boxes={boxes}
          activeId={activeId}
          onSelect={setActiveId}
          croppedFaceUrls={croppedFaceUrls}
          isRealtime={tab === "realtime"}
          onAnalyzeClick={handleAnalyzeClick}
          onClearClick={handleClearAll}
          analyzeDisabled={loading || !sourceUrl}
        />

        {/* PANEL 4: current result */}
        <VisionCurrentPanel current={current} />
      </div>

      {/* TABLE */}
      <div className={cx(tokens.card, "mt-8 p-6")}>
        <ResultsTable
          rows={rows}
          filtered={filtered}
          query={q}
          onQueryChange={setQ}
          onClearAll={() => setRows([])}
          onExportJSON={exportJSON}
          onExportCSV={exportCSV}
          onRowClick={() => {}}
          onDeleteOne={(id) => setRows((prev) => deleteOneRow(prev, id))}
        />
      </div>
    </div>
  );
};

export default VisionSentimentPage;
