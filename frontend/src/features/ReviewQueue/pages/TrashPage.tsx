import React, { useState } from "react";
import { TrashHeader } from "../components/TrashHeader";
import { TrashToolbar } from "../components/TrashToolbar";
import { TrashTable } from "../components/TrashTable";
import { useTrash } from "../hooks/useTrash";

const TrashPage: React.FC = () => {
  const {
    filtered,
    selected,
    setSelected,
    filters,
    setFilters,
    restore,
    deleteForever,
    empty,
  } = useTrash();

  const [confirm, setConfirm] = useState<
    null | { type: "restore" | "delete" | "empty" }
  >(null);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <TrashHeader />

      <TrashToolbar
        selectedCount={selected.length}
        filters={filters}
        setFilters={setFilters}
        onRestore={() => setConfirm({ type: "restore" })}
        onDelete={() => setConfirm({ type: "delete" })}
        onEmpty={() => setConfirm({ type: "empty" })}
      />

      <TrashTable
        items={filtered}
        selected={selected}
        setSelected={setSelected}
      />

      {/* simple confirm */}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div
            className="absolute inset-0 bg-slate-900/70"
            onClick={() => setConfirm(null)}
          />
          <div className="relative bg-slate-900 rounded-2xl border border-white/10 p-6 w-[min(420px,90vw)]">
            <h2 className="text-lg font-semibold text-white mb-2">
              {confirm.type === "restore"
                ? "Khôi phục mục đã chọn?"
                : confirm.type === "delete"
                ? "Xóa vĩnh viễn mục đã chọn?"
                : "Dọn sạch toàn bộ thùng rác?"}
            </h2>
            <p className="text-slate-300 mb-4">
              {confirm.type === "restore"
                ? "Các mục sẽ xuất hiện lại ở bảng gốc (Vision, Audio, ...)."
                : confirm.type === "delete"
                ? "Bạn sẽ không thể khôi phục lại sau khi xóa."
                : "Tất cả mục trong thùng rác sẽ bị xóa vĩnh viễn."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-xl bg-slate-700/70 text-slate-100"
                onClick={() => setConfirm(null)}
              >
                Hủy
              </button>
              <button
                className={`px-4 py-2 rounded-xl ${
                  confirm.type === "restore"
                    ? "bg-emerald-500 hover:bg-emerald-400"
                    : "bg-rose-500 hover:bg-rose-400"
                } text-white`}
                onClick={async () => {
                  if (confirm.type === "restore") {
                    await restore(selected);
                  } else if (confirm.type === "delete") {
                    await deleteForever(selected);
                  } else {
                    await empty();
                  }
                  setConfirm(null);
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashPage;
