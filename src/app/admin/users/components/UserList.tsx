"use client";

import { deleteUser, resetPassword } from "../actions";
import { useState } from "react";

interface User {
  id: string;
  username: string;
  role: string;
}

interface UserListProps {
  users: User[];
  currentUserId: string;
}

export default function UserList({ users, currentUserId }: UserListProps) {
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, username: string) => {
    if (id === currentUserId) {
      alert("You cannot delete yourself.");
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteUser(id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete user");
      setIsDeleting(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingId) return;

    const formData = new FormData();
    formData.append("password", newPassword);

    try {
      await resetPassword(resettingId, formData);
      alert("Password reset successfully.");
      setResettingId(null);
      setNewPassword("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to reset password");
    }
  };

  return (
    <>
      <ul className="divide-y divide-slate-200">
        {users.length === 0 ? (
          <li className="px-6 py-4 text-center text-slate-500">No users found.</li>
        ) : (
          users.map((user) => (
            <li key={user.id}>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-900">{user.username}</span>
                  <span className="text-sm text-slate-500">Role: {user.role}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setResettingId(user.id)}
                    className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                  >
                    Reset Password
                  </button>
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      disabled={isDeleting === user.id}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      {isDeleting === user.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      {resettingId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Reset Password</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResettingId(null);
                    setNewPassword("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
