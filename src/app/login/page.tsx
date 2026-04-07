"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Sign in to SFRS ETT
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your credentials to access the equipment tracker.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                disabled={isSubmitting}
                className="relative block w-full rounded-md border border-slate-300 py-3 text-slate-900 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-sfrs-red focus:border-sfrs-red sm:text-sm px-4 disabled:opacity-50 min-h-[48px]"
                placeholder="e.g. jbloggs"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className="relative block w-full rounded-md border border-slate-300 py-3 text-slate-900 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-sfrs-red focus:border-sfrs-red sm:text-sm px-4 disabled:opacity-50 min-h-[48px]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md bg-sfrs-red py-4 px-3 text-sm font-bold text-white hover:bg-sfrs-red/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sfrs-red disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px] shadow-lg"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
