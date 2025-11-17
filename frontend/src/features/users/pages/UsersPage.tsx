// users/pages/UsersPage.tsx
import React, { useState } from "react";
import { useUsers } from "../hooks/useUsers";
import { UserFilters } from "../components/UserFilters";
import { UserStats } from "../components/UserStats";
import { UserTable } from "../components/UserTable";
import { AddUserModal } from "../components/AddUserModal";
import { UserDetailPanel } from "../components/UserDetailPanel";
import { UsersHeader } from "../components/UsersHeader";
import { Toast } from "../components/Toast";

const UsersPage: React.FC = () => {
  const {
    loading,
    users,
    allUsers,
    roles,
    filters,
    setFilters,
    selectedUser,
    setSelectedUser,
    refresh,
    addUser,
    suspendUser,
    deleteUser,
    updateUser,
  } = useUsers();

  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="p-5 bg-slate-950/50 min-h-screen relative">
      <UsersHeader />

      {/* filters (không còn chữ lặp) */}
      <UserFilters
        roles={roles}
        filters={filters}
        onChange={setFilters}
        onAddUser={() => setAddOpen(true)}
        onRefresh={refresh}
      />

      <UserStats users={allUsers} />

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">
          Loading users...
        </div>
      ) : (
        <UserTable
          users={users}
          onSelect={setSelectedUser}
          onSuspend={(u) => {
            suspendUser(u.id);
            showToast(
              u.status === "suspended" ? "User activated." : "User suspended."
            );
          }}
          onDelete={(u) => {
            deleteUser(u.id);
            showToast("User deleted.", "success");
          }}
        />
      )}

      {/* modal add */}
      <AddUserModal
        open={addOpen}
        roles={roles}
        onClose={() => setAddOpen(false)}
        onSubmit={async (payload) => {
          await addUser(payload);
          showToast("User created successfully.");
        }}
      />

      {/* profile panel */}
      <UserDetailPanel
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdate={updateUser}
        onToggleSuspend={(u) => {
          suspendUser(u.id);
          showToast(
            u.status === "suspended" ? "User activated." : "User suspended."
          );
        }}
      />

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[120]">
          <Toast message={toast.msg} type={toast.type} />
        </div>
      )}
    </div>
  );
};

export default UsersPage;
