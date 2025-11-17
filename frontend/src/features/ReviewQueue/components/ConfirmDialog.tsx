// src/features/review-queue/components/ConfirmDialog.tsx
import React from "react";

const BASE_CARD =
  "rounded-2xl bg-slate-800/60 backdrop-blur-md border border-white/10 shadow-xl";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  msg: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onClose: () => void;
  onConfirm?: () => void;
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  msg,
  confirmLabel = "Xác nhận",
  tone = "danger",
  onClose,
  onConfirm,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`${BASE_CARD} w-[min(640px,92vw)] p-6 relative z-10`}>
        <h3 className="text-xl font-semibold text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-300 mb-5">{msg}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 h-10 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-100 border border-white/10"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className={
              tone === "danger"
                ? "px-4 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-900/30"
                : "px-4 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-medium shadow-lg shadow-sky-900/20"
            }
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
