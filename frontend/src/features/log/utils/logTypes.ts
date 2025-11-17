// src/features/log/utils/logTypes.ts

export type LogLevel = "info" | "warning" | "error" | "audit" | "debug";

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  source:
  | "vision"
  | "audio"
  | "text"
  | "max-fusion"
  | "system"
  | "frontend"
  | "backend";
  action: string; // vd: "ANALYZE_FRAME", "UPLOAD_FILE"
  level: LogLevel;
  message: string;
  user?: string;
  relatedId?: string; // vd: liên kết review-queue
  meta?: Record<string, any>;
}
