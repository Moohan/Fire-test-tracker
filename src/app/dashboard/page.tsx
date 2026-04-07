"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { useSyncExternalStore, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface ComplianceStatus {
  frequency: string;
  type: string;
  status: "PASSED" | "FAILED" | "OVERDUE" | "OUTSTANDING";
  satisfied: boolean;
  hasFail: boolean;
  windowId: string;
}

interface EquipmentItem {
  id: string;
  externalId: string;
  name: string;
  location: string;
  category: string;
  sfrsId: string | null;
  mfrId: string | null;
  status: "ON_RUN" | "OFF_RUN";
  procedurePath: string | null;
  compliance: ComplianceStatus[];
}

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [showQueuedMessage, setShowQueuedMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get("queued") === "true") {
      // Wrap in timeout to avoid synchronous setState in effect lint error
      const initTimer = setTimeout(() => {
        setShowQueuedMessage(true);
      }, 0);

      const hideTimer = setTimeout(() => setShowQueuedMessage(false), 5000);
      return () => {
        clearTimeout(initTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [searchParams]);

  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true // Default to true for SSR
  );

  const { data: equipment, isLoading, error } = useQuery<EquipmentItem[]>({
    queryKey: ["equipment-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getStatusColor = (status: "PASSED" | "FAILED" | "OVERDUE" | "OUTSTANDING") => {
    switch (status) {
      case "PASSED": return "bg-sfrs-green";
      case "FAILED": return "bg-sfrs-red";
      case "OVERDUE": return "bg-sfrs-amber";
      case "OUTSTANDING": return "bg-sfrs-grey";
      default: return "bg-slate-300";
    }
  };

  const getBadgeStyles = (item: EquipmentItem) => {
    const isOtr = item.status === "OFF_RUN";
    const hasFail = item.compliance.some(c => c.status === "FAILED");
    const hasOverdue = item.compliance.some(c => c.status === "OVERDUE");

    if (isOtr || hasFail) {
      return { label: isOtr ? "OTR" : "FAIL", classes: "bg-sfrs-red/10 text-sfrs-red border-sfrs-red/20" };
    }
    if (hasOverdue) {
      return { label: "OVERDUE", classes: "bg-sfrs-amber/10 text-sfrs-amber border-sfrs-amber/20" };
    }
    const hasOutstanding = item.compliance.some(c => c.status === "OUTSTANDING");
    if (hasOutstanding) {
      return { label: "ATTN", classes: "bg-sfrs-grey/10 text-sfrs-grey border-sfrs-grey/20" };
    }
    return { label: "OK", classes: "bg-sfrs-green/10 text-sfrs-green border-sfrs-green/20" };
  };

  if (isLoading) return <div className="p-6 text-center">Loading dashboard...</div>;
  if (error && !equipment) return <div className="p-6 text-center text-sfrs-red">Error: {(error as Error).message}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none">SFRS ETT Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">{format(new Date(), "eeee, do MMMM yyyy", { locale: enGB })}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-900 hidden sm:inline">{session?.user?.username}</span>
            {!isOnline && (
              <span className="text-[10px] font-bold text-sfrs-amber uppercase tracking-tighter">Offline Mode</span>
            )}
          </div>
          <button
            onClick={() => signOut()}
            className="text-sm font-bold text-sfrs-red hover:bg-sfrs-red/10 px-3 py-2 rounded-md transition-all min-h-[44px]"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {showQueuedMessage && (
          <div className="bg-sfrs-green text-white p-4 rounded-md shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <span className="font-bold">Test result queued successfully!</span>
            <button onClick={() => setShowQueuedMessage(false)} className="p-1">✕</button>
          </div>
        )}

        {!isOnline && (
          <div className="bg-sfrs-amber/10 border border-sfrs-amber/20 p-3 rounded-md flex items-center space-x-3 shadow-sm">
            <div className="w-2 h-2 bg-sfrs-amber rounded-full animate-pulse"></div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Working Offline: Changes will sync when you reconnect.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {equipment?.map((item) => {
            const badge = getBadgeStyles(item);

            return (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1 mr-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.externalId}</span>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">{item.name}</h2>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <p className="text-xs text-slate-600"><span className="font-bold text-slate-400 uppercase mr-1">Loc:</span> {item.location}</p>
                    <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 font-medium">
                      {item.sfrsId && <span><span className="text-slate-400 uppercase">SFRS:</span> {item.sfrsId}</span>}
                      {item.mfrId && <span><span className="text-slate-400 uppercase">Mfr:</span> {item.mfrId}</span>}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Compliance Status</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {item.compliance.length > 0 ? item.compliance.map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50/50 p-1.5 rounded border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{c.frequency} {c.type}</span>
                          <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${getStatusColor(c.status)}`} title={c.status}></div>
                        </div>
                      )) : <p className="text-[10px] text-slate-400 italic">No recurring tests configured.</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 border-t border-slate-200 flex space-x-2">
                  <Link
                    href={`/log/${item.id}`}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-md text-center hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm min-h-[44px] flex items-center justify-center uppercase tracking-wider"
                  >
                    Log Test
                  </Link>
                  {item.procedurePath && (
                    <a
                      href={item.procedurePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-md text-center hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm min-h-[44px] flex items-center justify-center uppercase tracking-wider"
                      title="View Equipment Information Card"
                    >
                      EIC
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {session?.user.role === "ADMIN" && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            href="/admin/equipment"
            className="bg-sfrs-red text-white p-4 rounded-full shadow-2xl hover:bg-sfrs-red/90 active:scale-90 transition-all flex items-center justify-center min-w-[64px] min-h-[64px] border-4 border-white"
            title="Admin Management"
          >
            <span className="text-2xl">⚙️</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
