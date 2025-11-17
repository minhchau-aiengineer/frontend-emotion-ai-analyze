// users/components/UserDetailPanel.tsx
import React, { useEffect, useState } from "react";
import { User } from "../types/user";
import { formatDateTime } from "../utils/formatDate";

interface UserDetailPanelProps {
  user: User | null;
  onClose: () => void;
  onUpdate: (id: string, changes: Partial<User>) => void;
  onToggleSuspend: (user: User) => void;
}

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  user,
  onClose,
  onUpdate,
  onToggleSuspend,
}) => {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setEditing(false);
    }
  }, [user]);

  if (!user) return null;

  const handleSave = () => {
    onUpdate(user.id, { fullName, email });
    setEditing(false);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-800 z-[80] shadow-xl translate-x-0 animate-[slideIn_.12s_ease-out]">
      <style>
        {`@keyframes slideIn { from { transform: translateX(100%);} to { transform: translateX(0);} }`}
      </style>
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100">User detail</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-800 text-slate-100 flex items-center justify-center hover:bg-slate-700 transition-all"
        >
          ✕
        </button>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-500/90 flex items-center justify-center text-lg font-semibold text-white">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-slate-50 font-medium">{user.fullName}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {!editing ? (
            <>
              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  Status:{" "}
                  <span className="capitalize text-slate-100">
                    {user.status}
                  </span>
                </p>
                <p>Last login: {formatDateTime(user.lastLogin)}</p>
                <p>Created at: {formatDateTime(user.createdAt)}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="w-full py-2 rounded-xl bg-slate-800 text-slate-100 text-sm hover:bg-slate-700 transition-all"
              >
                Edit profile
              </button>
              <button
                onClick={() => onToggleSuspend(user)}
                className={`w-full py-2 rounded-xl text-sm transition-all ${
                  user.status === "suspended"
                    ? "bg-emerald-500/90 hover:bg-emerald-500 text-white"
                    : "bg-rose-500/90 hover:bg-rose-500 text-white"
                }`}
              >
                {user.status === "suspended" ? "Activate user" : "Suspend user"}
              </button>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-xs">
                Full name
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-950/40 border border-slate-800 rounded-lg px-2 py-1 text-slate-50 outline-none focus:border-indigo-400 transition-all"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Email
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950/40 border border-slate-800 rounded-lg px-2 py-1 text-slate-50 outline-none focus:border-indigo-400 transition-all"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-100 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 rounded-lg bg-indigo-500 text-white text-xs hover:bg-indigo-400"
                >
                  Save
                </button>
              </div>
            </>
          )}
      </div>
    </div>
  );
};
