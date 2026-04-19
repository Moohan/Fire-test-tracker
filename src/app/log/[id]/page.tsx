"use client";

import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { Equipment, EquipmentRequirement } from "@/types/equipment";

const TEST_CODES = [
  { code: "A", name: "Acceptance", type: "ACCEPTANCE" },
  { code: "U", name: "After Use", type: "FUNCTIONAL" },
  { code: "M", name: "Monthly", type: "FUNCTIONAL" },
  { code: "Q", name: "Quarterly", type: "FUNCTIONAL" },
  { code: "C", name: "Commencement of Duty", type: "FUNCTIONAL" },
  { code: "W", name: "Weekly", type: "FUNCTIONAL" },
  { code: "12", name: "Annually", type: "FUNCTIONAL" },
  { code: "OIC", name: "On Instruction", type: "FUNCTIONAL" },
];

interface EquipmentWithRequirements extends Equipment {
  requirements: EquipmentRequirement[];
}

export default function LogTestPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [testCode, setTestCode] = useState("W");
  const [result, setResult] = useState<"PASS" | "FAIL">("PASS");
  const [hoursUsed, setHoursUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  const { data: item, isLoading } = useQuery<EquipmentWithRequirements>({
    queryKey: ["equipment-item", id],
    queryFn: async () => {
      const res = await fetch(`/api/equipment/${id}`);
      if (!res.ok) throw new Error("Failed to fetch equipment");
      return res.json();
    },
  });

  const canMarkRemoved = useMemo(() => {
    return ["ADMIN", "WC", "CC"].includes(session?.user?.role || "");
  }, [session]);

  const handleMarkRemoved = async () => {
    if (
      !confirm(
        "Are you sure? This will remove the equipment from active rotation. This action will be logged.",
      )
    )
      return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("status", "OFF_RUN");
      formData.append("removedAt", new Date().toISOString());

      const res = await fetch(`/api/equipment/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update status");

      await queryClient.invalidateQueries({
        queryKey: ["equipment-dashboard"],
      });
      router.push("/dashboard");
    } catch {
      alert("An error occurred");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const selectedTest = TEST_CODES.find((t) => t.code === testCode);

    // Determine type based on requirements if possible, fallback to default
    let finalType: string = selectedTest?.type || "VISUAL";

    if (item?.requirements) {
      const freqMapping: Record<string, string> = {
        W: "WEEKLY",
        M: "MONTHLY",
        Q: "QUARTERLY",
        "12": "ANNUAL",
      };
      const freq = freqMapping[testCode];
      if (freq) {
        const req = item.requirements.find((r) => r.frequency === freq);
        if (req && req.type !== "NONE") {
          finalType = req.type;
        }
      }
    }

    const payload = {
      equipmentId: id,
      type: finalType,
      testCode,
      result,
      hoursUsed: item?.trackHours ? hoursUsed : undefined,
      notes,
      timestamp: new Date().toISOString(),
    };

    try {
      if (!navigator.onLine) {
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["equipment-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["equipment-item", id] }),
      ]);

      router.push("/dashboard");
    } catch (err) {
      const isNetworkError =
        err instanceof TypeError ||
        (err instanceof Error &&
          (err.message.includes("fetch") || err.message.includes("network")));

      if (isNetworkError || !navigator.onLine) {
        await db.pendingLogs.add(payload);
        router.push("/dashboard?queued=true");
      } else {
        setError((err as Error).message);
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (!item)
    return (
      <div className="p-6 text-center text-sfrs-red">Equipment not found</div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="mr-4 text-slate-500 hover:text-slate-900 flex items-center justify-center w-11 h-11 rounded-full hover:bg-slate-100 transition-colors"
          >
            <span aria-hidden="true">←</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 leading-none truncate">
              Record Test
            </h1>
            <p className="text-sm text-slate-500 leading-none mt-1 truncate">
              {item.name} ({item.externalId})
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {item.procedurePath && (
            <a
              href={item.procedurePath}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-md shadow-sm hover:bg-slate-50 min-h-[44px] flex items-center uppercase tracking-wider"
            >
              View EIC
            </a>
          )}
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
                You are currently offline. Your test will be queued and synced
                when you reconnect.
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                Test Code
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEST_CODES.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setTestCode(t.code)}
                    className={`py-3 px-2 rounded-md text-xs font-bold border transition-all min-h-[44px] flex flex-col items-center justify-center ${
                      testCode === t.code
                        ? "bg-sfrs-red border-sfrs-red text-white shadow-md ring-2 ring-sfrs-red/30 ring-offset-2"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">{t.code}</span>
                    <span className="opacity-70 text-[10px] uppercase tracking-tighter text-center leading-tight">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                Result
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResult("PASS")}
                  className={`py-4 px-4 rounded-md text-sm font-bold border transition-all min-h-[44px] flex items-center justify-center ${
                    result === "PASS"
                      ? "bg-sfrs-green border-sfrs-green text-white shadow-md ring-2 ring-sfrs-green/30 ring-offset-2"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-2" aria-hidden="true">
                    ✓
                  </span>{" "}
                  PASS
                </button>
                <button
                  type="button"
                  onClick={() => setResult("FAIL")}
                  className={`py-4 px-4 rounded-md text-sm font-bold border transition-all min-h-[44px] flex items-center justify-center ${
                    result === "FAIL"
                      ? "bg-sfrs-red border-sfrs-red text-white shadow-md ring-2 ring-sfrs-red/30 ring-offset-2"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-2" aria-hidden="true">
                    ✗
                  </span>{" "}
                  FAIL
                </button>
              </div>
            </div>

            {item.trackHours && (
              <div>
                <label
                  htmlFor="hoursUsed"
                  className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Actions/Hours Used (15 min increments)
                </label>
                <input
                  id="hoursUsed"
                  type="text"
                  value={hoursUsed}
                  onChange={(e) => setHoursUsed(e.target.value)}
                  placeholder="e.g. 0.25, 1.5, or 'Cleaned valve'"
                  className="w-full border border-slate-300 rounded-md p-3 text-slate-900 focus:ring-sfrs-red focus:border-sfrs-red min-h-[44px]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Replaced batteries, cleaned sensor..."
                className="w-full border border-slate-300 rounded-md p-3 text-slate-900 focus:ring-sfrs-red focus:border-sfrs-red transition-all min-h-[80px]"
              ></textarea>
            </div>

            <div className="pt-4 flex flex-col space-y-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sfrs-red text-white font-bold py-5 px-6 rounded-md shadow-lg hover:bg-sfrs-red/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 min-h-[56px]"
              >
                {isSubmitting
                  ? "Processing..."
                  : isOffline
                    ? "Queue Test Result"
                    : "Confirm Result"}
              </button>

              {!item.removedAt && canMarkRemoved && (
                <button
                  type="button"
                  onClick={handleMarkRemoved}
                  disabled={isSubmitting}
                  className="w-full bg-white border border-slate-300 text-slate-500 font-bold py-3 px-6 rounded-md hover:bg-slate-50 min-h-[48px] transition-colors"
                >
                  Mark as Expired/Removed from Service
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
