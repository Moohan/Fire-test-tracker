import Dexie, { Table } from 'dexie';

export interface PendingTestLog {
  id?: number;
  equipmentId: string;
  type: 'VISUAL' | 'FUNCTIONAL' | 'ACCEPTANCE';
  result: 'PASS' | 'FAIL';
  notes?: string;
  timestamp: string;
}

export class ETTDatabase extends Dexie {
  pendingLogs!: Table<PendingTestLog>;

  constructor() {
    super('ETTDatabase');
    this.version(1).stores({
      pendingLogs: '++id, equipmentId, timestamp'
    });
  }
}

export const db = new ETTDatabase();
