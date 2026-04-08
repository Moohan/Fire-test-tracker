"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { db } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";

export default function SyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();
  const isSyncingRef = useRef(false);

  const sync = useCallback(async () => {
    // Always update pending count first
    const allPending = await db.pendingLogs.toArray();
    // Only count those that haven't failed with a 400/404 yet for the badge
    const activePending = allPending.filter(p => !p.syncError);
    setPendingCount(activePending.length);

    if (isSyncingRef.current || !navigator.onLine || activePending.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      for (const log of activePending) {
        try {
          const res = await fetch("/api/tests/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              equipmentId: log.equipmentId,
              type: log.type,
              result: log.result,
              notes: log.notes,
              timestamp: log.timestamp,
            }),
          });

          if (res.ok) {
            await db.pendingLogs.delete(log.id!);
          } else if (res.status === 400 || res.status === 404) {
            // Mark as failed instead of deleting
            const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
            await db.pendingLogs.update(log.id!, {
              syncError: errorData.error || `HTTP ${res.status}`,
              failedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Failed to sync log:", err);
          // Stop syncing if we hit a network error
          break;
        }
      }
    } finally {
      const remainingLogs = await db.pendingLogs.toArray();
      const remainingActive = remainingLogs.filter(p => !p.syncError);
      setPendingCount(remainingActive.length);
      setIsSyncing(false);
      isSyncingRef.current = false;

      // If we processed any successfully, invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["equipment-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    }
  }, [queryClient]);

  useEffect(() => {
    sync();

    const handleOnline = () => sync();
    const handleOffline = () => {
      // Still query local DB to update UI badge when offline
      db.pendingLogs.toArray().then(logs => {
        setPendingCount(logs.filter(p => !p.syncError).length);
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(sync, 60000); // Check every minute

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [sync]);

  if (pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lg flex items-center space-x-2 animate-pulse">
      <div className="w-2 h-2 bg-sfrs-amber rounded-full"></div>
      <span>{isSyncing ? "Syncing..." : `${pendingCount} pending logs`}</span>
    </div>
  );
}
