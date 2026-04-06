"use client";

import { useState } from "react";
import { deleteUser, resetPassword } from "../actions";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete user");
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>, userId: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await resetPassword(userId, formData);
      alert("Password reset successfully");
      setResettingId(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ul className="divide-y divide-slate-100">
      {users.length === 0 ? (
        <li className="px-6 py-12 text-center text-slate-500">No users found.</li>
      ) : (
        users.map((user) => (
          <li key={user.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900 leading-none">{user.username}</p>
                <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-medium">{user.role}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setResettingId(resettingId === user.id ? null : user.id)}
                  className="text-slate-600 hover:text-slate-900 text-sm font-bold uppercase min-h-[44px] px-2"
                >
                  Reset Password
                </button>
                {user.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-sfrs-red hover:text-sfrs-red/90 text-sm font-bold uppercase min-h-[44px] px-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {resettingId === user.id && (
              <form
                onSubmit={(e) => handleResetPassword(e, user.id)}
                className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-200"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="block w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-sfrs-red focus:border-sfrs-red"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-sfrs-red text-white py-2 px-4 rounded-md text-sm font-bold hover:bg-sfrs-red/90 min-h-[44px] flex-1"
                    >
                      {isSubmitting ? "Resetting..." : "Save Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResettingId(null)}
                      className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-md text-sm font-bold hover:bg-slate-50 min-h-[44px] flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </li>
        ))
      )}
    </ul>
  );
}
