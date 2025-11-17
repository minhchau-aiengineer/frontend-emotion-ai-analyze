// users/hooks/useUsers.ts

import { useEffect, useMemo, useState } from 'react';
import { userService } from '../services/userService';
import { User, UserRole } from '../types/user';
import { UserFilter } from '../types/filters';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<UserFilter>({
    search: '',
    role: 'all',
    status: 'all',
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [userList, roleList] = await Promise.all([
          userService.getUsers(),
          userService.getRoles(),
        ]);
        setUsers(userList);
        setRoles(roleList);
      } catch (err) {
        setError('Cannot load users');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !filters.search ||
        u.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
        u.email.toLowerCase().includes(filters.search.toLowerCase());

      const matchRole =
        filters.role === 'all' ? true : u.role.id === filters.role;

      const matchStatus =
        filters.status === 'all' ? true : u.status === filters.status;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, filters]);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (payload: {
    fullName: string;
    email: string;
    roleId: string;
  }) => {
    const newUser = await userService.addUser(payload);
    setUsers((prev) => [newUser, ...prev]);
  };

  const updateUser = async (id: string, changes: Partial<User>) => {
    const updated = await userService.updateUser(id, changes);
    if (updated) {
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setSelectedUser(updated);
    }
  };

  const suspendUser = async (id: string) => {
    await userService.suspendUser(id);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: 'suspended' as const } : u
      )
    );
  };

  const deleteUser = async (id: string) => {
    await userService.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (selectedUser?.id === id) setSelectedUser(null);
  };

  return {
    loading,
    users: filteredUsers,
    allUsers: users,
    roles,
    filters,
    setFilters,
    selectedUser,
    setSelectedUser,
    refresh,
    addUser,
    updateUser,
    suspendUser,
    deleteUser,
    error,
  };
}
