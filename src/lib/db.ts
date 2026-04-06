"use client";

import Dexie, { Table } from 'dexie';

export interface PendingTestLog {
  id?: number;
  equipmentId: string;
  type: 'VISUAL' | 'FUNCTIONAL' | 'ACCEPTANCE';
  result: 'PASS' | 'FAIL';
  notes?: string;
  timestamp: string;
  syncError?: string;
  failedAt?: string;
}

export class ETTDatabase extends Dexie {
  pendingLogs!: Table<PendingTestLog>;

  constructor() {
    super('ETTDatabase');
    this.version(2).stores({
      pendingLogs: '++id, equipmentId, timestamp'
    });
  }
}

export const db = new ETTDatabase();
