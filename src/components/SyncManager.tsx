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
    if (isSyncingRef.current || !navigator.onLine) return;

    const pending = await db.pendingLogs.toArray();
    if (pending.length === 0) {
      setPendingCount(0);
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    setPendingCount(pending.length);

    try {
      for (const log of pending) {
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

          if (res.ok || res.status === 400 || res.status === 404) {
            // If success or unfixable error (invalid data), remove from queue
            await db.pendingLogs.delete(log.id!);
          }
        } catch (err) {
          console.error("Failed to sync log:", err);
          // Stop syncing if we hit a network error
          break;
        }
      }
    } finally {
      const remaining = await db.pendingLogs.count();
      setPendingCount(remaining);
      setIsSyncing(false);
      isSyncingRef.current = false;

      if (pending.length > remaining) {
        queryClient.invalidateQueries({ queryKey: ["equipment-dashboard"] });
      }
    }
  }, [queryClient]);

  useEffect(() => {
    // Initial sync
    sync();

    const handleOnline = () => sync();
    window.addEventListener('online', handleOnline);

    const interval = setInterval(sync, 60000); // Check every minute

    return () => {
      window.removeEventListener('online', handleOnline);
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
