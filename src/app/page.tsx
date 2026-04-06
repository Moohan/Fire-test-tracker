"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  return (
    <main className="flex min-h-full flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          SFRS ETT
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Loading...
        </p>
      </div>
    </main>
  );
}
