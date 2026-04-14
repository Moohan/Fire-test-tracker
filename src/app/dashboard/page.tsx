"use client";

import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import Link from "next/link";
import { useState, useEffect, useSyncExternalStore, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Local storage helper for offline sync status
const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

interface TestLogUser {
  fullName: string | null;
  username: string;
  role: string;
}

interface EquipmentItem {
  id: string;
  externalId: string;
  name: string;
  location: string;
  category: string;
  status: "ON_RUN" | "OFF_RUN";
  procedurePath: string | null;
  sfrsId: string | null;
  mfrId: string | null;
  removedAt: string | null;
  compliance: Array<{
    frequency: string;
    type: string;
    status: "PASSED" | "FAILED" | "OVERDUE" | "OUTSTANDING";
    overdueLabel?: string;
    lastTest?: {
      timestamp: string;
      user: TestLogUser;
    };
  }>;
}

const formatUserName = (user: TestLogUser | undefined) => {
  if (!user) return "Unknown";
  const rolePrefix = user.role === "ADMIN" ? "Admin" : user.role;
  const names = (user.fullName || user.username).split(" ");
  const lastName = names[names.length - 1];
  return `${rolePrefix} ${lastName}`.trim();
};

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showQueuedMessage, setShowQueuedMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get("queued") === "true") {
      const showTimer = setTimeout(() => setShowQueuedMessage(true), 0);
      const hideTimer = setTimeout(() => setShowQueuedMessage(false), 5000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [searchParams]);

  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  const {
    data: equipment,
    isLoading,
    error,
  } = useQuery<EquipmentItem[]>({
    queryKey: ["equipment-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading)
    return (
      <div className="p-6 text-center text-slate-500 font-medium">
        Loading Dashboard...
      </div>
    );

  if (error && !equipment) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-sfrs-red font-bold">
          Error: {(error as Error).message}
        </div>
        <button
          onClick={() => router.refresh()}
          className="bg-sfrs-red text-white px-4 py-2 rounded-md text-sm font-bold min-h-[44px]"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeEquipment = equipment?.filter((item) => !item.removedAt) || [];
  const removedEquipment = equipment?.filter((item) => item.removedAt) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASSED":
        return "bg-sfrs-green";
      case "FAILED":
        return "bg-sfrs-red";
      case "OVERDUE":
        return "bg-sfrs-amber";
      case "OUTSTANDING":
        return "bg-sfrs-grey";
      default:
        return "bg-slate-300";
    }
  };

  const getBadgeStyles = (item: EquipmentItem) => {
    if (item.removedAt)
      return {
        label: "REMOVED",
        classes: "bg-slate-100 text-slate-400 border-slate-200",
      };
    const isOtr = item.status === "OFF_RUN";
    const hasFail = item.compliance.some((c) => c.status === "FAILED");
    const hasOverdue = item.compliance.some((c) => c.status === "OVERDUE");

    if (isOtr || hasFail)
      return {
        label: isOtr ? "OTR" : "FAIL",
        classes: "bg-sfrs-red/10 text-sfrs-red border-sfrs-red/20",
      };
    if (hasOverdue)
      return {
        label: "OVERDUE",
        classes: "bg-sfrs-amber/10 text-sfrs-amber border-sfrs-amber/20",
      };
    if (item.compliance.some((c) => c.status === "OUTSTANDING"))
      return {
        label: "ATTN",
        classes: "bg-sfrs-grey/10 text-sfrs-grey border-sfrs-grey/20",
      };
    return {
      label: "OK",
      classes: "bg-sfrs-green/10 text-sfrs-green border-sfrs-green/20",
    };
  };

  const renderEquipmentCard = (item: EquipmentItem) => {
    const badge = getBadgeStyles(item);
    return (
      <div
        key={item.id}
        className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:border-slate-300 transition-colors"
      >
        <div className="p-4 flex-1">
          <div className="flex justify-between items-start mb-2">
            <div className="min-w-0 flex-1 mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {item.externalId}
              </span>
              <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">
                {item.name}
              </h2>
            </div>
            <span
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${badge.classes}`}
            >
              {badge.label}
            </span>
          </div>
          <div className="space-y-1 mb-4">
            <p className="text-xs text-slate-600">
              <span className="font-bold text-slate-400 uppercase mr-1">
                Loc:
              </span>{" "}
              {item.location}
            </p>
            <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 font-medium">
              {item.sfrsId && (
                <span>
                  <span className="text-slate-400 uppercase">SFRS:</span>{" "}
                  {item.sfrsId}
                </span>
              )}
              {item.mfrId && (
                <span>
                  <span className="text-slate-400 uppercase">Mfr:</span>{" "}
                  {item.mfrId}
                </span>
              )}
            </div>
          </div>
          {!item.removedAt && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Compliance Status
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {item.compliance.length > 0 ? (
                  item.compliance.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col bg-slate-50/50 p-2 rounded border border-slate-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                          {c.frequency} {c.type}
                        </span>
                        <div
                          className={`w-2.5 h-2.5 rounded-full shadow-sm ${getStatusColor(c.status)}`}
                          title={c.status}
                        ></div>
                      </div>
                      {c.status === "OVERDUE" && c.overdueLabel && (
                        <p className="text-[9px] font-bold text-sfrs-amber uppercase mt-1">
                          {c.overdueLabel}
                        </p>
                      )}
                      {(c.status === "PASSED" || c.status === "FAILED") &&
                        c.lastTest && (
                          <p className="text-[9px] text-slate-500 mt-1 flex justify-between">
                            <span className="font-medium">
                              {format(
                                new Date(c.lastTest.timestamp),
                                "dd/MM/yyyy",
                              )}
                            </span>
                            <span className="font-bold uppercase tracking-tighter">
                              {formatUserName(c.lastTest.user)}
                            </span>
                          </p>
                        )}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    No recurring tests configured.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex space-x-2">
          {!item.removedAt && (
            <Link
              href={`/log/${item.id}`}
              className="flex-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-md text-center hover:bg-slate-50 min-h-[44px] flex items-center justify-center uppercase tracking-wider shadow-sm"
            >
              Log Test
            </Link>
          )}
          {item.procedurePath && (
            <a
              href={item.procedurePath}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-md text-center hover:bg-slate-50 min-h-[44px] flex items-center justify-center uppercase tracking-wider shadow-sm"
              title="View Equipment Information Card"
            >
              EIC
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-none">
            SFRS ETT Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {format(new Date(), "eeee, do MMMM yyyy", { locale: enGB })}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-900 hidden sm:inline">
              {session?.user?.username}
            </span>
            {!isOnline && (
              <span className="text-[10px] font-bold text-sfrs-amber uppercase tracking-tighter">
                Offline Mode
              </span>
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

      <main className="flex-1 p-4 sm:p-6 space-y-8">
        {showQueuedMessage && (
          <div className="bg-sfrs-green text-white p-4 rounded-md shadow-lg flex items-center justify-between">
            <span className="font-bold">Test result queued successfully!</span>
            <button onClick={() => setShowQueuedMessage(false)} className="p-1">
              ✕
            </button>
          </div>
        )}

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
              Active Equipment
            </h2>
            {["ADMIN", "WC", "CC"].includes(session?.user?.role || "") && (
              <div className="flex space-x-2">
                <Link
                  href="/reports"
                  className="text-xs font-bold text-sfrs-red uppercase hover:underline"
                >
                  Reports
                </Link>
                <Link
                  href="/admin/equipment"
                  className="text-xs font-bold text-slate-500 uppercase hover:underline"
                >
                  Manage
                </Link>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeEquipment.map(renderEquipmentCard)}
          </div>
        </section>

        {removedEquipment.length > 0 && (
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Expired / Removed from Service
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {removedEquipment.map(renderEquipmentCard)}
            </div>
          </section>
        )}
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
    <Suspense
      fallback={
        <div className="p-6 text-center text-slate-500">
          Loading Dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
