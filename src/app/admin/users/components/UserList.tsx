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
        <li className="px-6 py-12 text-center text-slate-500 font-medium">No users found.</li>
      ) : (
        users.map((user) => (
          <li key={user.id} className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-slate-900 leading-none">{user.username}</p>
                <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-bold">{user.role}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setResettingId(resettingId === user.id ? null : user.id)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold uppercase py-2.5 px-4 rounded-md shadow-sm hover:bg-slate-100 min-h-[44px] transition-colors"
                >
                  Reset Password
                </button>
                {user.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="bg-white border border-sfrs-red/30 text-sfrs-red text-xs font-bold uppercase py-2.5 px-4 rounded-md shadow-sm hover:bg-sfrs-red/5 min-h-[44px] transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {resettingId === user.id && (
              <form
                onSubmit={(e) => handleResetPassword(e, user.id)}
                className="mt-6 p-6 bg-slate-50 rounded-lg border border-slate-200 shadow-inner"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      pattern="(?=.*[a-z])(?=.*[A-Z]).{6,}"
                      title="Password must be at least 6 characters, contain at least one uppercase and one lowercase letter."
                      className="block w-full border border-slate-300 rounded-md shadow-sm p-3 focus:ring-sfrs-red focus:border-sfrs-red min-h-[44px] bg-white"
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Min 6 characters, at least one uppercase and one lowercase letter.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-sfrs-red text-white py-3 px-6 rounded-md text-sm font-bold hover:bg-sfrs-red/90 min-h-[48px] flex-1 shadow-md transition-all active:scale-[0.98]"
                    >
                      {isSubmitting ? "Resetting..." : "Save Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResettingId(null)}
                      className="bg-white border border-slate-300 text-slate-700 py-3 px-6 rounded-md text-sm font-bold hover:bg-slate-50 min-h-[48px] flex-1 shadow-sm transition-colors"
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
