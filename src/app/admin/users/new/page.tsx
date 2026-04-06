import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createUser } from "../actions";

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <Link href="/admin/users" className="text-sm text-sfrs-red hover:underline mb-1 inline-block">← Back to Users</Link>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">Add New User</h1>
      </header>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6">
        <form action={createUser} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 focus:ring-sfrs-red focus:border-sfrs-red min-h-[44px]"
                placeholder="e.g. firefighter_smith"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 focus:ring-sfrs-red focus:border-sfrs-red min-h-[44px]"
                placeholder="••••••••"
              />
              <p className="mt-2 text-xs text-slate-500">
                Min 6 characters, at least one uppercase and one lowercase letter.
              </p>
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Role
              </label>
              <select
                name="role"
                id="role"
                required
                defaultValue="USER"
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 focus:ring-sfrs-red focus:border-sfrs-red min-h-[44px]"
              >
                <option value="USER">Firefighter (Standard User)</option>
                <option value="ADMIN">Crew Commander (Admin)</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              className="w-full bg-sfrs-red text-white font-bold py-4 px-6 rounded-md shadow-lg hover:bg-sfrs-red/90 active:scale-[0.98] transition-all min-h-[44px]"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
