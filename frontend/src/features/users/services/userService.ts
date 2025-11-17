// users/services/userService.ts

import { User, UserRole } from '../types/user';

let ROLES: UserRole[] = [
  { id: 'admin', name: 'Admin', description: 'Full access' },
  { id: 'reviewer', name: 'Reviewer', description: 'Can review uploads' },
  { id: 'analyst', name: 'Analyst', description: 'Read-only analytics' },
];

let USERS: User[] = [
  {
    id: 'u1',
    fullName: 'Minh Nguyen',
    email: 'minh.nguyen@example.com',
    role: ROLES[0],
    status: 'online',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u2',
    fullName: 'Emotion Reviewer',
    email: 'reviewer@example.com',
    role: ROLES[1],
    status: 'offline',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u3',
    fullName: 'Vision Analyst',
    email: 'vision@example.com',
    role: ROLES[2],
    status: 'offline',
    lastLogin: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const userService = {
  async getUsers() {
    // giả lập gọi API
    return Promise.resolve([...USERS]);
  },

  async getRoles() {
    return Promise.resolve([...ROLES]);
  },

  async addUser(payload: {
    fullName: string;
    email: string;
    roleId: string;
  }) {
    const role = ROLES.find((r) => r.id === payload.roleId) ?? ROLES[1];
    const newUser: User = {
      id: `u${Date.now()}`,
      fullName: payload.fullName,
      email: payload.email,
      role,
      status: 'offline',
      createdAt: new Date().toISOString(),
    };
    USERS = [newUser, ...USERS];
    return Promise.resolve(newUser);
  },

  async updateUser(id: string, changes: Partial<User>) {
    USERS = USERS.map((u) => (u.id === id ? { ...u, ...changes } : u));
    return Promise.resolve(USERS.find((u) => u.id === id));
  },

  async suspendUser(id: string) {
    USERS = USERS.map((u) =>
      u.id === id ? { ...u, status: 'suspended' as const } : u
    );
    return Promise.resolve(true);
  },

  async deleteUser(id: string) {
    USERS = USERS.filter((u) => u.id !== id);
    return Promise.resolve(true);
  },
};
