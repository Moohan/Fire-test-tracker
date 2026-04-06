"use client";

import { useActionState } from "react";
import { createUser } from "../actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewUserPage() {
  const router = useRouter();
  const [error, action, isPending] = useActionState<string | null, FormData>(
    async (prevState: string | null, formData: FormData) => {
      try {
        await createUser(formData);
        router.push("/admin/users");
        return null;
      } catch (e: unknown) {
        return e instanceof Error ? e.message : String(e);
      }
    },
    null
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Link
          href="/admin/users"
          className="mr-4 text-rose-600 hover:text-rose-700"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add New User</h1>
      </div>

      <div className="bg-white shadow p-6 rounded-lg">
        <form action={action} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
              />
              <p className="mt-1 text-xs text-slate-500">
                Min 6 chars, at least 1 uppercase and 1 lowercase letter.
              </p>
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-700"
              >
                Role
              </label>
              <select
                name="role"
                id="role"
                defaultValue="USER"
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
              >
                <option value="USER">User (Firefighter)</option>
                <option value="ADMIN">Admin (Crew Commander)</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
