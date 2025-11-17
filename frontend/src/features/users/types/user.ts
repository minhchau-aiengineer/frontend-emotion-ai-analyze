// users/types/user.ts

export type UserStatus = 'online' | 'offline' | 'suspended';

export interface UserRole {
  id: string;
  name: string; // 'Admin' | 'Reviewer' | ...
  description?: string;
  permissions?: string[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string; // ISO string
  createdAt?: string;
}
