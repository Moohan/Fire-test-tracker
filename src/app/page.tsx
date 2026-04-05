"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-lg font-medium text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-full flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          SFRS ETT
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Equipment Testing Tracker
        </p>

        <div className="mt-10 border rounded-lg bg-white p-6 shadow-sm">
          {session ? (
            <div className="space-y-4">
              <div className="text-left">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Logged in as
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {session.user.username}
                </p>
                <p className="text-sm text-slate-600">
                  Role: {session.user.role}
                </p>
              </div>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin/equipment"
                  className="w-full flex justify-center py-2 px-4 border border-rose-600 rounded-md shadow-sm text-sm font-medium text-rose-600 bg-white hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Manage Equipment
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600">You are not logged in.</p>
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
