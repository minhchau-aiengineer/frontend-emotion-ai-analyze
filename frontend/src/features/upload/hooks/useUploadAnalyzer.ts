// src/features/upload/hooks/useUploadAnalyzer.ts
import { useMemo, useState } from "react";
import { UploadKind, UploadResultRow } from "../types/uploadTypes";
import { analyzeUpload } from "../services/uploadService";

export function useUploadAnalyzer() {
  const [kind, setKind] = useState<UploadKind>("image");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<UploadResultRow | null>(null);
  const [rows, setRows] = useState<UploadResultRow[]>([]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.source.toLowerCase().includes(s) ||
        r.label.toLowerCase().includes(s) ||
        r.kind.toLowerCase().includes(s)
    );
  }, [q, rows]);

  const onPickFile = (f: File) => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setFile(f);
    setSourceUrl(URL.createObjectURL(f));
    setCurrent(null);
  };

  const runAnalyze = async () => {
    if (!file && !sourceUrl) return;
    setLoading(true);
    const displayName = file
      ? `${file.name} • ${formatBytes(file.size)}`
      : kind === "audio"
        ? "Audio stream"
        : kind === "video"
          ? "Video stream"
          : "Image";

    try {
      const result = await analyzeUpload(
        kind,
        displayName,
        file ?? undefined,
        sourceUrl ?? undefined
      );
      setCurrent(result);
      setRows((prev) => [result, ...prev]);

      // Cập nhật preview để hiển thị kết quả đã annotate từ backend
      if (result.kind === "audio" && result.fileUrl) {
        if (sourceUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(sourceUrl);
        }
        setSourceUrl(result.fileUrl);
      }
    } catch (error) {
      console.error("Analyze upload failed", error);
    } finally {
      setLoading(false);
    }
  };

  const clearInputs = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setFile(null);
    setSourceUrl(null);
    setCurrent(null);
  };

  const clearHistory = () => setRows([]);

  // ✅ THÊM: hàm xóa 1 dòng theo id
  const deleteOne = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return {
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
    deleteOne, // ✅ THÊM: expose ra ngoài để bảng gọi
  };
}

function formatBytes(b: number) {
  if (!b) return "0 B";
  const k = 1024;
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(2)} ${u[i]}`;
}
