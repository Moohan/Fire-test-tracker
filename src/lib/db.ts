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
        // No migration required because new fields (testCode, hoursUsed) are optional
        // and existing records remain valid for version 3.
        // No migration required because new fields (testCode, hoursUsed) are optional
        // and existing records remain valid for version 3.
        // Migration logic if needed
      });
  }
}

export const db = new ETTDatabase();
