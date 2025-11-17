// users/components/UserTable.tsx
import React from 'react';
import { User } from '../types/user';
import { formatDateTime } from '../utils/formatDate';
import { RoleBadge } from './RoleBadge';

interface UserTableProps {
  users: User[];
  onSelect: (user: User) => void;
  onSuspend: (user: User) => void;
  onDelete: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onSelect,
  onSuspend,
  onDelete,
}) => {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full text-left text-sm text-slate-200">
        <thead className="bg-slate-900/70">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last login</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-5 text-center text-slate-400"
              >
                No users found.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr
              key={u.id}
              className="border-t border-slate-800/60 hover:bg-slate-800/30 cursor-pointer"
              onClick={() => onSelect(u)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/80 text-white flex items-center justify-center font-semibold">
                    {u.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-slate-50">
                      {u.fullName}
                    </div>
                    <div className="text-xs text-slate-500">ID: {u.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3">
                <RoleBadge role={u.role} />
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' +
                    (u.status === 'online'
                      ? 'bg-emerald-500/10 text-emerald-200'
                      : u.status === 'offline'
                      ? 'bg-slate-500/10 text-slate-200'
                      : 'bg-rose-500/10 text-rose-200')
                  }
                >
                  {u.status}
                </span>
              </td>
              <td className="px-4 py-3">{formatDateTime(u.lastLogin)}</td>
              <td
                className="px-4 py-3"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="flex gap-2 justify-end">
                  {u.status !== 'suspended' && (
                    <button
                      onClick={() => onSuspend(u)}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-xs hover:bg-slate-700"
                    >
                      Suspend
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(u)}
                    className="px-2 py-1 rounded-lg bg-rose-500/80 text-xs hover:bg-rose-500"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
