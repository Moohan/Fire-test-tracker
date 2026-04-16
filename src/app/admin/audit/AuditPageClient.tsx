"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { useState } from "react";
import Link from "next/link";

interface AuditLog {
  id: string;
  equipmentId: string;
  timestamp: string | Date;
  type: string;
  result: string;
  notes: string | null;
  equipment: {
    externalId: string;
    name: string;
  };
  user: {
    username: string;
    fullName: string | null;
  };
}

interface AuditResponse {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface MetadataResponse {
  equipment: { id: string; externalId: string; name: string }[];
  users: { id: string; username: string; fullName: string | null }[];
}

interface AuditPageClientProps {
  initialLogs: AuditLog[];
  equipment: { id: string; externalId: string; name: string }[];
  users: { id: string; username: string; fullName: string | null }[];
}

export default function AuditPageClient({ initialLogs, equipment, users }: AuditPageClientProps) {
  const queryClient = useQueryClient();
  const [filterResult, setFilterResult] = useState<string>("");
  const [filterEquipment, setFilterEquipment] = useState<string>("");
  const [filterUser, setFilterUser] = useState<string>("");
  const [page, setPage] = useState(1);

  // Metadata is passed from server but also fetched for freshness if needed,
  // though we can just use the props.
  // Using query with initialData for metadata
  const { data: metadata } = useQuery<MetadataResponse>({
    queryKey: ["audit-metadata"],
    queryFn: async () => {
      const res = await fetch("/api/audit/metadata");
      if (!res.ok) throw new Error("Failed to fetch metadata");
      return res.json();
    },
    initialData: { equipment, users },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data, isLoading } = useQuery<AuditResponse>({
    queryKey: ["audit-logs", page, filterResult, filterEquipment, filterUser],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filterResult) params.append("result", filterResult);
      if (filterEquipment) params.append("equipmentId", filterEquipment);
      if (filterUser) params.append("userId", filterUser);

      const res = await fetch(`/api/audit/logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    // Only use initialLogs for the first page with no filters
    initialData: (page === 1 && !filterResult && !filterEquipment && !filterUser)
      ? {
          logs: initialLogs,
          pagination: {
            total: initialLogs.length,
            page: 1,
            limit: 20,
            totalPages: Math.ceil(initialLogs.length / 20) || 1
          }
        }
      : undefined,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/audit/logs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete log");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this log? This action is irreversible and will be logged in the audit trail.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4">
          <div>
            <Link href="/admin/equipment" className="text-sm text-sfrs-red hover:underline mb-1 inline-block">← Back to Admin</Link>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Audit History</h1>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Result</label>
              <select
                value={filterResult}
                onChange={(e) => {
                  setFilterResult(e.target.value);
                  setPage(1);
                }}
                className="w-full border-slate-300 rounded-md text-sm focus:ring-sfrs-red focus:border-sfrs-red p-2 min-h-[44px]"
              >
                <option value="">All Results</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipment</label>
              <select
                value={filterEquipment}
                onChange={(e) => {
                  setFilterEquipment(e.target.value);
                  setPage(1);
                }}
                className="w-full border-slate-300 rounded-md text-sm focus:ring-sfrs-red focus:border-sfrs-red p-2 min-h-[44px]"
              >
                <option value="">All Equipment</option>
                {metadata?.equipment.map(e => (
                  <option key={e.id} value={e.id}>{e.externalId} - {e.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">User</label>
              <select
                value={filterUser}
                onChange={(e) => {
                  setFilterUser(e.target.value);
                  setPage(1);
                }}
                className="w-full border-slate-300 rounded-md text-sm focus:ring-sfrs-red focus:border-sfrs-red p-2 min-h-[44px]"
              >
                <option value="">All Users</option>
                {metadata?.users.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Equipment</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Result</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Loading audit history...</td></tr>
                ) : data?.logs.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No logs found.</td></tr>
                ) : data?.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-slate-900 whitespace-nowrap">
                      {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: enGB })}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-900">
                      <div className="font-bold leading-none">{log.equipment.externalId}</div>
                      <div className="text-xs text-slate-500 leading-none mt-1">{log.equipment.name}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 font-medium">
                      {log.user.username}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-xs font-bold uppercase">{log.type}</span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`font-bold ${log.result === "PASS" ? "text-sfrs-green" : "text-sfrs-red"}`}>
                        {log.result === "PASS" ? "✓ PASS" : "✗ FAIL"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate" title={log.notes || ""}>
                      {log.notes || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-sfrs-red hover:bg-sfrs-red/10 transition-all font-bold text-xs uppercase px-3 py-2 rounded-md min-h-[44px] min-w-[64px]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 min-h-[44px]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 min-h-[44px]"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing <span className="font-medium">{(page-1)*data.pagination.limit + 1}</span> to <span className="font-medium">{Math.min(page*data.pagination.limit, data.pagination.total)}</span> of{' '}
                    <span className="font-medium">{data.pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 min-h-[44px]"
                    >
                      <span className="sr-only">Previous</span>
                      ←
                    </button>
                    {[...Array(data.pagination.totalPages)].map((_, i) => (
                      <button
                        key={i+1}
                        onClick={() => setPage(i+1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium min-h-[44px] ${
                          page === i+1
                            ? "z-10 bg-sfrs-red border-sfrs-red text-white"
                            : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {i+1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 min-h-[44px]"
                    >
                      <span className="sr-only">Next</span>
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
