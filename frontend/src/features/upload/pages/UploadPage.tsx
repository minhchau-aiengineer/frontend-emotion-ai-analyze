// src/features/upload/pages/UploadPage.tsx
import React from "react";
import { UploadHeader } from "../components/UploadHeader";
import { UploadTabs } from "../components/UploadTabs";
import { UploadDropzone } from "../components/UploadDropzone";
import { CurrentResultPanel } from "../components/CurrentResultPanel";
import { UploadResultsTable } from "../components/UploadResultsTable";
import { useUploadAnalyzer } from "../hooks/useUploadAnalyzer";
import { tokens, cx } from "../utils/tokens";
import { PreviewContainer, UploadPreview } from "../components/UploadPreview";

export default function UploadPage(): React.ReactElement {
  const {
    kind,
    setKind,
    file,
    onPickFile,
    sourceUrl,
    loading,
    runAnalyze,
    current,
    rows,
    filtered,
    q,
    setQ,
    clearInputs,
    clearHistory,
    deleteOne,
  } = useUploadAnalyzer();

  const activeResult = current && current.kind === kind ? current : null;

  // export JSON
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ uploads: rows }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "upload_history.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // export CSV
  const exportCSV = () => {
    const header = [
      "index",
      "source",
      "type",
      "label",
      "confidence",
      "latency",
      "time",
    ];
    const body = rows.map((r, i) => [
      String(i + 1),
      r.source.replace(/"/g, '""'),
      r.kind,
      r.label,
      `${Math.round(r.confidence * 100)}%`,
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
    a.download = "upload_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <UploadHeader />

      {/* 2 ô trên: trái upload – phải preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ô trên TRÁI: chỉ upload (tab + dropzone) */}
        <div className={cx(tokens.card, "p-6 min-h-[340px]")}>
          <UploadTabs kind={kind} onChange={setKind} onClear={clearInputs} />
          <UploadDropzone kind={kind} onPick={onPickFile} file={file} />
        </div>

        {/* ô trên PHẢI: preview */}
        <PreviewContainer>
          <UploadPreview
            kind={kind}
            sourceUrl={sourceUrl}
            faceBoxes={activeResult?.faceLocations}
            label={activeResult?.label}
            confidence={activeResult?.confidence}
            videoDetections={activeResult?.videoDetections}
            videoMeta={activeResult?.videoMeta}
          />
          <div className="mt-4 text-xs text-slate-400">
            Hệ thống sẽ phân tích nội dung dựa trên loại tệp bạn tải lên.
          </div>
        </PreviewContainer>

        {/* ô dưới TRÁI: nút Analyze + nội dung chữ */}
        <div className={cx(tokens.card, "p-6 min-h-[240px]")}>
          <div className="text-slate-200 font-semibold mb-2">
            Processing / Notes
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Chọn tệp ở ô trên bên trái rồi bấm <b>Analyze</b> để xử lý. Bạn có thể
            <b> Clear</b> để chọn lại tệp khác.
          </p>
          <div className="flex gap-3 mb-6">
            <button
              className={tokens.btn.primary}
              onClick={runAnalyze}
              disabled={loading || (!file && !sourceUrl)}
            >
              {loading ? "Analyzing…" : "Analyze"}
            </button>
            <button className={tokens.btn.subtle} onClick={clearInputs}>
              Clear
            </button>
          </div>
          <ul className="text-sm text-slate-400 grid gap-1">
            <li>✓ Image → detect faces / objects (server).</li>
            <li>✓ Audio → extract features (mfcc / embedding).</li>
            <li>✓ Video → sample frames & run emotion model.</li>
            <li>✓ Tất cả kết quả sẽ lưu vào bảng lịch sử bên dưới.</li>
          </ul>
        </div>

        {/* ô dưới PHẢI: kết quả hiện tại */}
        <CurrentResultPanel current={current} />
      </div>

      {/* bảng lịch sử */}
      <UploadResultsTable
        rows={rows}
        filtered={filtered}
        q={q}
        setQ={setQ}
        onClearAll={clearHistory}
        onExportJSON={exportJSON}
        onExportCSV={exportCSV}
        onDeleteOne={deleteOne}
      />
    </div>
  );
}
