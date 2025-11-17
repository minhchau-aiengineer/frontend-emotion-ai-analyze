// src/features/ReviewQueue/types/trash.ts
export type TrashItem = {
  id: string;
  name: string;                // Tên
  sourceLabel?: string;        // Nguồn gốc (tên phiên, tên file gốc, task...)
  module: "vision" | "audio" | "text" | "video" | "fused" | "system" | string; // Mô-đun
  label?: string;              // Nhãn cảm xúc / trạng thái
  confidence?: number;         // 0..1
  deletedBy?: string;          // Người xóa
  deletedAt: string;           // ISO time
  sizeBytes?: number | null;   // Kích thước tệp
  originalPath?: string;       // Nguồn tệp
  itemType: "all" | "audio" | "vision" | "text" | "video" | "fused" | "other";
};
