"use client";

import Dexie, { Table } from "dexie";

export interface PendingTestLog {
  id?: number;
  equipmentId: string;
  type: string;
  testCode?: string;
  result: "PASS" | "FAIL";
  hoursUsed?: string;
  notes?: string;
  timestamp: string;
  syncError?: string;
  failedAt?: string;
}

export class ETTDatabase extends Dexie {
  pendingLogs!: Table<PendingTestLog>;

  constructor() {
    super("ETTDatabase");
    this.version(3)
      .stores({
        pendingLogs: "++id, equipmentId, timestamp",
      })
      .upgrade(() => {
        // Migration logic if needed
      });
  }
}

export const db = new ETTDatabase();
