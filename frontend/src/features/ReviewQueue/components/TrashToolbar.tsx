import React from "react";
import { TrashFilters } from "../hooks/useTrash";

type Props = {
  selectedCount: number;
  filters: TrashFilters;
  setFilters: React.Dispatch<React.SetStateAction<TrashFilters>>;
  onRestore: () => void;
  onDelete: () => void;
  onEmpty: () => void;
};

export const TrashToolbar: React.FC<Props> = ({
  selectedCount,
  filters,
  setFilters,
  onRestore,
  onDelete,
  onEmpty,
}) => {
  const any = selectedCount > 0;

  return (
    <div className="bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3 mb-5 flex flex-wrap gap-3 items-center justify-between">
      {/* nhóm nút trái */}
      <div className="flex gap-2 items-center">
        <button
          onClick={onRestore}
          disabled={!any}
          className={`px-4 h-10 rounded-xl text-sm font-medium transition ${
            any
              ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm"
              : "bg-emerald-500/15 text-emerald-100/40 cursor-not-allowed"
          }`}
        >
          Khôi phục
        </button>
        <button
          onClick={onDelete}
          disabled={!any}
          className={`px-4 h-10 rounded-xl text-sm font-medium transition ${
            any
              ? "bg-rose-500 hover:bg-rose-400 text-white shadow-sm"
              : "bg-rose-500/15 text-rose-100/40 cursor-not-allowed"
          }`}
        >
          Xóa vĩnh viễn
        </button>
        <button
          onClick={onEmpty}
          className="px-4 h-10 rounded-xl text-sm font-medium bg-slate-800/40 hover:bg-slate-700/60 text-slate-100 border border-white/5"
        >
          Dọn sạch thùng rác
        </button>
      </div>

      {/* nhóm giữa + phải */}
      <div className="flex gap-2 items-center flex-wrap justify-end flex-1 md:flex-none">
        {/* search ở giữa như bạn nói */}
        <div className="relative">
          <input
            value={filters.q}
            onChange={(e) =>
              setFilters((f) => ({ ...f, q: e.target.value }))
            }
            placeholder="Tìm trong thùng rác..."
            className="bg-slate-900/40 border border-white/10 rounded-xl pl-3 pr-3 py-2 text-sm text-slate-100 w-[180px] md:w-[210px] focus:outline-none focus:ring-1 focus:ring-sky-500/50"
          />
        </div>

        <select
          className="bg-slate-900/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100"
          value={filters.type}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              type: e.target.value as TrashFilters["type"],
            }))
          }
        >
          <option value="all">Loại: Tất cả</option>
          <option value="vision">Vision</option>
          <option value="audio">Audio</option>
          <option value="text">Text</option>
          <option value="video">Video</option>
          <option value="fused">Max Fusion</option>
          <option value="other">Khác</option>
        </select>

        <select
          className="bg-slate-900/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100"
          value={filters.order}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              order: e.target.value as TrashFilters["order"],
            }))
          }
        >
          <option value="recent">Lần xóa gần đây nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="size">Kích thước tệp</option>
        </select>
      </div>
    </div>
  );
};
