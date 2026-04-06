"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";

interface ComplianceStatus {
  frequency: string;
  type: string;
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

export default function Dashboard() {
  const { data: session } = useSession();
  const { data: equipment, isLoading, error } = useQuery<EquipmentItem[]>({
    queryKey: ["equipment-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="p-6 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-center text-sfrs-red">Error: {(error as Error).message}</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">SFRS ETT Dashboard</h1>
          <p className="text-sm text-slate-500">{format(new Date(), "eeee, do MMMM yyyy", { locale: enGB })}</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium hidden sm:inline">{session?.user?.username}</span>
          <button
            onClick={() => signOut()}
            className="text-sm font-medium text-sfrs-red hover:text-sfrs-red/80 hover:underline transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {equipment?.map((item) => {
            const isOtr = item.status === "OFF_RUN";
            const anyOutstanding = item.compliance.some(c => !c.satisfied);

            return (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.externalId}</span>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">{item.name}</h2>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isOtr
                        ? "bg-sfrs-red/10 text-sfrs-red"
                        : anyOutstanding
                          ? "bg-sfrs-amber/10 text-sfrs-amber"
                          : "bg-sfrs-green/10 text-sfrs-green"
                    }`}>
                      {item.status === "OFF_RUN" ? "OTR" : anyOutstanding ? "ATTN" : "OK"}
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <p className="text-sm text-slate-600"><span className="font-medium">Loc:</span> {item.location}</p>
                    <div className="flex flex-wrap gap-x-4 text-xs text-slate-500">
                      {item.sfrsId && <span><span className="font-medium text-slate-700">SFRS:</span> {item.sfrsId}</span>}
                      {item.mfrId && <span><span className="font-medium text-slate-700">Mfr:</span> {item.mfrId}</span>}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {item.compliance.length > 0 ? item.compliance.map((c, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${c.satisfied ? "bg-sfrs-green" : c.hasFail ? "bg-sfrs-red" : "bg-slate-300"}`}></div>
                          <span className="text-xs text-slate-600">{c.frequency} ({c.type})</span>
                        </div>
                      )) : <p className="text-xs text-slate-400 col-span-2">No requirements</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 border-t border-slate-200 flex space-x-2">
                  <Link
                    href={`/log/${item.id}`}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm font-bold py-2 px-3 rounded-md text-center hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm min-h-[44px] flex items-center justify-center"
                  >
                    Log Test
                  </Link>
                  {item.procedurePath && (
                    <a
                      href={item.procedurePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-slate-300 text-slate-700 text-sm font-bold py-2 px-3 rounded-md text-center hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm min-h-[44px] flex items-center justify-center"
                      title="View EIC"
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
        <div className="fixed bottom-6 right-6">
          <Link
            href="/admin/equipment"
            className="bg-sfrs-red text-white p-4 rounded-full shadow-lg hover:bg-sfrs-red/90 active:scale-95 transition-all flex items-center justify-center min-w-[56px] min-h-[56px]"
            title="Admin Panel"
          >
            ⚙️
          </Link>
        </div>
      )}
    </div>
  );
}
