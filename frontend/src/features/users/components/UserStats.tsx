// users/components/UserStats.tsx
import React from 'react';
import { User } from '../types/user';

interface UserStatsProps {
  users: User[];
}

export const UserStats: React.FC<UserStatsProps> = ({ users }) => {
  const total = users.length;
  const online = users.filter((u) => u.status === 'online').length;
  const suspended = users.filter((u) => u.status === 'suspended').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <p className="text-sm text-slate-400">Total Users</p>
        <p className="text-2xl font-semibold text-slate-50">{total}</p>
      </div>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <p className="text-sm text-slate-400">Online</p>
        <p className="text-2xl font-semibold text-emerald-300">{online}</p>
      </div>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <p className="text-sm text-slate-400">Suspended</p>
        <p className="text-2xl font-semibold text-rose-300">{suspended}</p>
      </div>
    </div>
  );
};
