// src/components/AccountPopover.tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { X, ChevronUp, ChevronDown, Plus, LogOut } from "lucide-react";

export type AccountInfo = {
  id: string;
  name: string;
  email: string;
  color?: string;
  isDefault?: boolean;
  isCurrent?: boolean;
};

type AccountPopoverProps = {
  anchorOffset?: { bottom?: number; left?: number };
  current?: AccountInfo;
  accounts: AccountInfo[];
  onSelectAccount?: (id: string) => void;
  onAddAccount?: () => void;
  onLogoutAll?: () => void;
  onClose?: () => void;
};

const KEYFRAMES = `
@keyframes popIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const AccountPopoverInner: React.FC<AccountPopoverProps> = ({
  anchorOffset = { bottom: 92, left: 292 },
  current,
  accounts,
  onSelectAccount,
  onAddAccount,
  onLogoutAll,
  onClose,
}) => {
  const [showList, setShowList] = useState(true);

  return (
    <div
      className="fixed z-[99999]"
      style={{
        bottom: anchorOffset.bottom,
        left: anchorOffset.left,
      }}
    >
      <style>{KEYFRAMES}</style>
      <div
        className="w-[360px] max-h-[90vh] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_46px_rgba(0,0,0,0.45)] animate-[popIn_.18s_ease] backdrop-blur-lg text-slate-50 relative"
        style={{
          background:
            "linear-gradient(170deg, rgba(39,68,143,1) 0%, rgba(15,23,42,1) 65%)",
        }}
      >
        {/* 1. email + close */}
        <div className="flex items-center justify-between px-4 pt-4">
          <p className="text-xs mx-auto text-slate-100/80 leading-tight">
            {current?.email ?? "user@example.com"}
          </p>
          <button
            onClick={onClose}
            className="ml-2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-4 avatar + chào + nút */}
        <div className="flex flex-col items-center gap-3 px-4 pt-3 pb-4 text-center">
          <div
            className="w-16 h-16 rounded-full grid place-items-center text-lg font-semibold text-white shadow-lg"
            style={{
              background:
                current?.color ?? "linear-gradient(135deg,#0ea5e9,#6366f1)",
            }}
          >
            {current?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <p className="text-base font-semibold">
            Chào {current?.name ?? "bạn"},
          </p>
          <button
            onClick={() => console.log("open-account-management")}
            className="px-4 py-1.5 rounded-full bg-white/12 hover:bg-white/18 border border-white/12 text-xs transition"
          >
            Quản lý tài khoản của bạn
          </button>
        </div>

        {/* 5. Ẩn bớt tài khoản */}
        <button
          onClick={() => setShowList((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm bg-white/2 hover:bg-white/6 transition"
        >
          <span className="text-slate-100/85">Ẩn bớt tài khoản</span>
          {showList ? (
            <ChevronUp className="w-4 h-4 text-slate-50/70" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-50/70" />
          )}
        </button>

        {/* 6. Danh sách tài khoản */}
        {showList && (
          <div className="max-h-[220px] overflow-y-auto bg-slate-950/10">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  onSelectAccount?.(acc.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/6 transition text-left"
              >
                <div
                  className="w-9 h-9 rounded-full grid place-items-center text-sm font-semibold text-white"
                  style={{
                    background:
                      acc.color ??
                      "linear-gradient(135deg,#22d3ee,#6366f1)",
                  }}
                >
                  {acc.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-sm">{acc.name}</p>
                  <p className="text-[11px] text-slate-200/70">
                    {acc.email}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {acc.isDefault && (
                    <span className="text-[10px] px-1.5 py-[1px] rounded bg-white/10">
                      Mặc định
                    </span>
                  )}
                  {acc.isCurrent && (
                    <span className="text-[10px] px-1.5 py-[1px] rounded bg-emerald-400/25 text-emerald-50 border border-emerald-400/30">
                      Đang đăng nhập
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 7. Thêm tài khoản khác */}
        <button
          onClick={() => onAddAccount?.()}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-sm"
        >
          <span className="w-7 h-7 rounded-full bg-white/10 grid place-items-center">
            <Plus className="w-4 h-4" />
          </span>
          <span>Thêm tài khoản khác</span>
        </button>

        {/* 8. Đăng xuất tất cả */}
        <button
          onClick={() => onLogoutAll?.()}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-500/15 transition text-sm"
        >
          <span className="w-7 h-7 rounded-full bg-rose-500 grid place-items-center text-white">
            <LogOut className="w-4 h-4" />
          </span>
          <span>Đăng xuất khỏi tất cả tài khoản</span>
        </button>
      </div>
    </div>
  );
};

export const AccountPopover: React.FC<AccountPopoverProps> = (props) => {
  // portal ra body để không bị sidebar cắt
  return ReactDOM.createPortal(
    <AccountPopoverInner {...props} />,
    document.body
  );
};
