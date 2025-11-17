// users/components/UserFilters.tsx
import React, { ChangeEvent } from "react";
import { UserRole } from "../types/user";
import { UserFilter } from "../types/filters";

interface UserFiltersProps {
  roles: UserRole[];
  filters: UserFilter;
  onChange: (next: UserFilter) => void;
  onAddUser: () => void;
  onRefresh: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  roles,
  filters,
  onChange,
  onAddUser,
  onRefresh,
}) => {
  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {/* search */}
      <div className="relative flex-1 min-w-[240px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          >
            <circle cx="11" cy="11" r="5" />
            <path d="m16 16 2.5 2.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          name="search"
          value={filters.search}
          onChange={handleInput}
          placeholder="Search by name or email.."
          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
        />
      </div>

      {/* role */}
      <select
        name="role"
        value={filters.role}
        onChange={handleInput}
        className="bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 transition-all"
      >
        <option value="all">All roles</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {/* status */}
      <select
        name="status"
        value={filters.status}
        onChange={handleInput}
        className="bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 transition-all"
      >
        <option value="all">All status</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
        <option value="suspended">Suspended</option>
      </select>

      {/* refresh */}
      <button
        onClick={onRefresh}
        className="h-[38px] w-[38px] rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-100 hover:bg-slate-800/70 transition-all"
      >
        ⟳
      </button>

      {/* add user */}
      <button
        onClick={onAddUser}
        className="h-[38px] rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 text-sm font-medium text-white hover:brightness-110 transition-all"
      >
        + Add User
      </button>
    </div>
  );
};
