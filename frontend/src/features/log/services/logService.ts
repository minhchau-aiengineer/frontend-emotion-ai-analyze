import { LogEntry, LogLevel } from "../utils/logTypes";

const SOURCES = ["vision", "audio", "text", "max-fusion", "system"] as const;
const ACTIONS = [
  "ANALYZE_FRAME",
  "RUN_SENTIMENT",
  "UPLOAD_FILE",
  "DELETE_ITEM",
  "QUEUE_REVIEW",
];

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genMockLog(count = 20): LogEntry[] {
  const now = Date.now();

  return Array.from({ length: count }).map((_, i) => {
    const level: LogLevel =
      i % 7 === 0 ? "error" : i % 5 === 0 ? "warning" : i % 4 === 0 ? "audit" : "info";

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(now - i * 60_000).toISOString(),
      source: randomPick(SOURCES),
      action: randomPick(ACTIONS),
      level,
      message:
        level === "error"
          ? "Model inference failed at frame 120 (GPU timeout)"
          : level === "warning"
          ? "High latency detected from vision pipeline"
          : "Operation completed successfully.",
      user: i % 3 === 0 ? "minh.nguyen" : "system",
      relatedId: i % 4 === 0 ? `RQ-${120 + i}` : undefined,
      meta: {
        duration_ms: 120 + i * 3,
        model: i % 2 === 0 ? "fused-emotion-v2" : "audio-v1",
        file: i % 5 === 0 ? "demo-face.mp4" : undefined,
      },
    };
  });
}

let MOCK_DB: LogEntry[] = genMockLog(30);

export async function fetchLogs(): Promise<LogEntry[]> {
  await new Promise((res) => setTimeout(res, 200));
  return [...MOCK_DB];
}

export async function clearLogs(): Promise<void> {
  await new Promise((res) => setTimeout(res, 150));
  MOCK_DB = [];
}

export async function appendLog(entry: LogEntry): Promise<void> {
  await new Promise((res) => setTimeout(res, 100));
  MOCK_DB = [entry, ...MOCK_DB];
}

/**
 * Xuất file log dưới dạng JSON hoặc CSV
 * @param format 'json' | 'csv'
 */
export async function exportLogs(format: "json" | "csv" = "json"): Promise<Blob> {
  if (format === "csv") {
    // chuyển mảng LogEntry thành CSV text
    const headers = [
      "timestamp",
      "source",
      "action",
      "level",
      "message",
      "user",
      "relatedId",
      "duration_ms",
      "model",
      "file",
    ];

    const rows = MOCK_DB.map((log) => [
      log.timestamp,
      log.source,
      log.action,
      log.level,
      `"${log.message.replace(/"/g, '""')}"`, // escape quote
      log.user,
      log.relatedId ?? "",
      log.meta?.duration_ms ?? "",
      log.meta?.model ?? "",
      log.meta?.file ?? "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return new Blob([csv], { type: "text/csv" });
  }

  // mặc định xuất JSON
  const json = JSON.stringify(MOCK_DB, null, 2);
  return new Blob([json], { type: "application/json" });
}
