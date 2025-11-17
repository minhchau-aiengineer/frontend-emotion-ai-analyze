// src/features/upload/components/UploadResultsTable.tsx
import React from "react";
import { tokens } from "../utils/tokens";
import { UploadResultRow } from "../types/uploadTypes";

type Props = {
  rows: UploadResultRow[];
  filtered: UploadResultRow[];
  q: string;
  setQ: (s: string) => void;
  onClearAll: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onDeleteOne?: (id: string) => void; // 👈 thêm vào đây
};

export const UploadResultsTable: React.FC<Props> = ({
  rows,
  filtered,
  q,
  setQ,
  onClearAll,
  onExportJSON,
  onExportCSV,
  onDeleteOne,
}) => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-sky-200 mb-3">Upload History</h3>
      <div className="flex items-center gap-3 mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="flex-1 rounded-xl bg-slate-900/60 border border-white/10 px-3 h-10 text-slate-200 focus:ring-2 focus:ring-sky-500/40 outline-none"
        />
        <div className="flex gap-2">
          <button className={tokens.btn.subtle} onClick={onClearAll}>
            Clear all
          </button>
          <button
            className={tokens.btn.subtle}
            onClick={onExportJSON}
            disabled={!rows.length}
          >
            Export JSON
          </button>
          <button
            className={tokens.btn.subtle}
            onClick={onExportCSV}
            disabled={!rows.length}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className={tokens.card + " overflow-hidden"}>
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10 text-slate-300">
            <tr>
              <th className="text-left px-3 py-2 w-14">#</th>
              <th className="text-left px-3 py-2">Source</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Label</th>
              <th className="text-left px-3 py-2">Confidence</th>
              <th className="text-left px-3 py-2">Latency</th>
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-right px-5 py-2 w-20"></th> 
            </tr>
          </thead>
          <tbody>
            {!filtered.length ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">
                  No uploads yet.
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 truncate max-w-[420px]" title={r.source}>
                    {r.source}
                  </td>
                  <td className="px-3 py-2 capitalize">{r.kind}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        r.label === "Happy"
                          ? "text-emerald-300"
                          : r.label === "Angry"
                          ? "text-rose-300"
                          : "text-slate-200"
                      }
                    >
                      {r.label}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {Math.round(r.confidence * 100)}%
                  </td>
                  <td className="px-3 py-2">{r.latency} ms</td>
                  <td className="px-3 py-2">
                    {new Date(r.ts).toLocaleString()}
                  </td>
                  {/* nút delete */}
                  <td className="py-2 pr-5 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteOne?.(r.id)}
                      className="text-sm text-red-400 hover:text-red-200 mr-5"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
