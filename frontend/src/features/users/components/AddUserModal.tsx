// users/components/AddUserModal.tsx
import React, { useState, useEffect } from "react";
import { UserRole } from "../types/user";

interface AddUserModalProps {
  open: boolean;
  roles: UserRole[];
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    email: string;
    roleId: string;
  }) => Promise<void> | void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  open,
  roles,
  onClose,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "reviewer");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // reset khi mở
  useEffect(() => {
    if (open) {
      setFullName("");
      setEmail("");
      setRoleId(roles[0]?.id ?? "reviewer");
      setError(null);
      setSubmitting(false);
    }
  }, [open, roles]);

  if (!open) return null;

  const validate = () => {
    if (!fullName.trim()) return "Full name is required.";
    if (!email.trim()) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "Email is not valid.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    await onSubmit({ fullName: fullName.trim(), email: email.trim(), roleId });
    setSubmitting(false);
    onClose(); // đóng modal
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-[3px]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-[fadeIn_.15s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-slate-50 font-semibold text-lg">Add new user</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-100 flex items-center justify-center hover:bg-slate-700 transition-all"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-100">
            Full name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-100">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-100">
            Role
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 transition-all"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/10 rounded-lg px-3 py-2 mt-1">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-100 text-sm hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm text-white font-medium hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
