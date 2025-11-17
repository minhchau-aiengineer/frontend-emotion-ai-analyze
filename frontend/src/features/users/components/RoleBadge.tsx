// users/components/RoleBadge.tsx
import React from 'react';
import { UserRole } from '../types/user';

interface RoleBadgeProps {
  role: UserRole;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const map: Record<string, string> = {
    admin: 'bg-violet-500/10 text-violet-300',
    reviewer: 'bg-emerald-500/10 text-emerald-300',
    analyst: 'bg-sky-500/10 text-sky-300',
  };
  const cls = map[role.id] || 'bg-slate-500/10 text-slate-200';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {role.name}
    </span>
  );
};
