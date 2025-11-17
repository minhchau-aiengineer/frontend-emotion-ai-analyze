// src/features/vision-sentiment/utils/deleteOneRow.ts
import type { ResultRow } from "../types";

/**
 * Xóa một phần tử trong danh sách dựa theo id (string hoặc number)
 * Tự động chuyển đổi kiểu dữ liệu phù hợp.
 */
export function deleteOneRow(
  rows: ResultRow[],
  id: string | number
): ResultRow[] {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) {
    // nếu id là chuỗi không thể convert sang số
    return rows.filter((r) => String(r.id) !== String(id));
  }
  return rows.filter((r) => Number(r.id) !== idNum);
}
