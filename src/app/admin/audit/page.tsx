"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { useState } from "react";
import Link from "next/link";

interface AuditLog {
  id: string;
  equipmentId: string;
  timestamp: string;
  type: string;
  result: string;
  notes: string | null;
  equipment: {
    externalId: string;
    name: string;
  };
  user: {
    username: string;
  };
}

export default function AuditPage() {
  const queryClient = useQueryClient();
  const [filterResult, setFilterResult] = useState<string>("");

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs", filterResult],
    queryFn: async () => {
      const url = new URL("/api/audit", window.location.origin);
      if (filterResult) url.searchParams.set("result", filterResult);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/audit?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete log");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    }
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this log entry? This should only be done in exceptional circumstances.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link href="/admin/equipment" className="text-sm text-sfrs-red hover:underline mb-1 inline-block">← Back to Admin</Link>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Audit History</h1>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700">Filter Result:</label>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="border-slate-300 rounded-md text-sm focus:ring-sfrs-red focus:border-sfrs-red p-2"
            >
              <option value="">All Results</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
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
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Loading audit history...</td></tr>
                ) : logs?.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No logs found.</td></tr>
                ) : logs?.map((log) => (
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
                    <td className="px-4 py-4 text-sm">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-sfrs-red hover:text-sfrs-red font-bold text-xs uppercase"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
