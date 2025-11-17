import React from "react";
import { TrashItem } from "../types/trashTypes";

function fmtBytes(bytes?: number | null) {
  if (!bytes && bytes !== 0) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function fmtTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

type Props = {
  items: TrashItem[];
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
};

export const TrashTable: React.FC<Props> = ({
  items,
  selected,
  setSelected,
}) => {
  const all = items.length > 0 && selected.length === items.length;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? items.map((i) => i.id) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  return (
    <div className="rounded-2xl border border-slate-700/40 overflow-hidden bg-slate-800/40 shadow-md transition-all">
      <table className="w-full text-sm">
        <thead className="bg-slate-700/40 text-slate-100">
          <tr>
            <th className="px-4 py-3 text-left w-8">
              <input
                type="checkbox"
                checked={all}
                onChange={(e) => toggleAll(e.target.checked)}
                className="accent-sky-500"
              />
            </th>
            <th className="px-4 py-3 text-left">Tên</th>
            <th className="px-4 py-3 text-left">Nguồn gốc</th>
            <th className="px-4 py-3 text-left">Modun</th>
            <th className="px-4 py-3 text-left">Nhãn</th>
            <th className="px-4 py-3 text-left">Confidence</th>
            <th className="px-4 py-3 text-left">Người xóa</th>
            <th className="px-4 py-3 text-left">Thời gian xóa</th>
            <th className="px-4 py-3 text-left">Zize</th>
            <th className="px-4 py-3 text-left">Nguồn tệp</th>
          </tr>
        </thead>
        <tbody className="text-slate-100/90">
          {items.map((it) => (
            <tr
              key={it.id}
              className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors"
            >
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={selected.includes(it.id)}
                  onChange={(e) => toggleOne(it.id, e.target.checked)}
                  className="accent-sky-500"
                />
              </td>
              <td className="px-4 py-2 whitespace-nowrap">{it.name}</td>
              <td className="px-4 py-2">{it.sourceLabel || "—"}</td>
              <td className="px-4 py-2">{it.module}</td>
              <td className="px-4 py-2">{it.label || "—"}</td>
              <td className="px-4 py-2">
                {typeof it.confidence === "number"
                  ? `${(it.confidence * 100).toFixed(1)}%`
                  : "—"}
              </td>
              <td className="px-4 py-2">{it.deletedBy || "system"}</td>
              <td className="px-4 py-2">{fmtTime(it.deletedAt)}</td>
              <td className="px-4 py-2">{fmtBytes(it.sizeBytes)}</td>
              <td className="px-4 py-2">{it.originalPath || "—"}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td
                colSpan={10}
                className="px-4 py-10 text-center text-slate-400 bg-slate-800/30"
              >
                Thùng rác trống.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
