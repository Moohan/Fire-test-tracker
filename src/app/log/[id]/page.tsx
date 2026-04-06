"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { db } from "@/lib/db";

export default function LogTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [type, setType] = useState<"VISUAL" | "FUNCTIONAL" | "ACCEPTANCE">("VISUAL");
  const [result, setResult] = useState<"PASS" | "FAIL">("PASS");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: item, isLoading } = useQuery({
    queryKey: ["equipment-item", id],
    queryFn: async () => {
      const res = await fetch(`/api/equipment/${id}`);
      if (!res.ok) throw new Error("Failed to fetch equipment data");
      return res.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      equipmentId: id,
      type,
      result,
      notes,
      timestamp: new Date().toISOString(),
    };

    try {
      if (!navigator.onLine) {
        // Save to Dexie if offline
        await db.pendingLogs.add(payload);
        router.push("/dashboard?queued=true");
        return;
      }

      const res = await fetch("/api/tests/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log test");
      }

      router.push("/dashboard");
    } catch (err) {
      if (!navigator.onLine) {
         // Fallback to offline queue if request fails and we're now offline
         await db.pendingLogs.add(payload);
         router.push("/dashboard?queued=true");
      } else {
        setError((err as Error).message);
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (!item) return <div className="p-6 text-center text-sfrs-red">Equipment not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center sticky top-0 z-10">
        <Link href="/dashboard" className="mr-4 text-slate-500 hover:text-slate-900 flex items-center justify-center w-11 h-11 rounded-full hover:bg-slate-100 transition-colors">
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none">Record Test</h1>
          <p className="text-sm text-slate-500 leading-none mt-1">{item.name}</p>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-sfrs-red/10 text-sfrs-red border border-sfrs-red/20 rounded-md text-sm font-medium">
                {error}
              </div>
            )}

            {isOffline && (
              <div className="p-3 bg-sfrs-amber/10 text-sfrs-amber border border-sfrs-amber/20 rounded-md text-sm">
                You are currently offline. Your test will be queued and synced when you reconnect.
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Test Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(["VISUAL", "FUNCTIONAL", "ACCEPTANCE"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-3 px-4 rounded-md text-sm font-bold border transition-all min-h-[44px] ${
                      type === t
                        ? "bg-sfrs-red border-sfrs-red text-white shadow-md ring-2 ring-sfrs-red/30 ring-offset-2"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Result</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResult("PASS")}
                  className={`py-3 px-4 rounded-md text-sm font-bold border transition-all min-h-[44px] flex items-center justify-center ${
                    result === "PASS"
                      ? "bg-sfrs-green border-sfrs-green text-white shadow-md ring-2 ring-sfrs-green/30 ring-offset-2"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-2">✓</span> PASS
                </button>
                <button
                  type="button"
                  onClick={() => setResult("FAIL")}
                  className={`py-3 px-4 rounded-md text-sm font-bold border transition-all min-h-[44px] flex items-center justify-center ${
                    result === "FAIL"
                      ? "bg-sfrs-red border-sfrs-red text-white shadow-md ring-2 ring-sfrs-red/30 ring-offset-2"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-2">✗</span> FAIL
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Notes (Optional)</label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Replaced batteries, cleaned sensor..."
                className="w-full border border-slate-300 rounded-md p-3 text-slate-900 focus:ring-sfrs-red focus:border-sfrs-red transition-all min-h-[100px]"
              ></textarea>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sfrs-red text-white font-bold py-4 px-6 rounded-md shadow-lg hover:bg-sfrs-red/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 min-h-[44px]"
              >
                {isSubmitting ? "Processing..." : isOffline ? "Queue Test Result" : "Confirm Result"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
