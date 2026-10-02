export type HistoryStatus = 'waiting' | 'processing' | 'completed' | 'failed' | 'info' | 'idle';

export interface HistoryRecord {
  id: string;
  toolName: string;
  workspaceId: string;
  utilityId: string;
  featureId: string;
  input: string;
  output: string;
  timestamp: string;
  status: HistoryStatus;
  outputPath?: string;
  metadata?: Record<string, unknown>;
  outputExists?: boolean;
}

const STORAGE_KEY = 'toiloki_history_v2';
const MAX_ENTRIES = 60;

export class HistoryService {
  /**
   * Check if output files still exist on disk and annotate records
   */
  static async verifyOutputExistence(): Promise<HistoryRecord[]> {
    const records = this.getRecords();
    if (!window.toiloki?.fs?.getStats) return records;

    let hasChanges = false;
    for (const rec of records) {
      if (rec.outputPath) {
        try {
          const stats = await window.toiloki.fs.getStats(rec.outputPath);
          const exists = !!stats.exists;
          if (rec.outputExists !== exists) {
            rec.outputExists = exists;
            hasChanges = true;
          }
        } catch {
          if (rec.outputExists !== false) {
            rec.outputExists = false;
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch (err) {
        console.error('Failed to update verified history records:', err);
      }
    }

    return records;
  }
  /**
   * Retrieve all recorded history entries
   */
  static getRecords(): HistoryRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load history from localStorage:', err);
    }
    return [
      {
        id: 'seed-1',
        toolName: 'PDF Merger',
        workspaceId: 'pdf',
        utilityId: 'page-organizer',
        featureId: 'merge-pdf',
        input: 'Contract_Part1.pdf, Contract_Part2.pdf',
        output: 'merged_contract.pdf (1.8 MB)',
        timestamp: 'Today, 11:20 AM',
        status: 'completed',
      },
      {
        id: 'seed-2',
        toolName: 'Compress Image',
        workspaceId: 'images',
        utilityId: 'image-optimizer',
        featureId: 'compress-image',
        input: 'banner_large.png (3.4 MB)',
        output: 'banner_large.webp (380 KB, -89%)',
        timestamp: 'Today, 09:45 AM',
        status: 'completed',
      },
      {
        id: 'seed-3',
        toolName: 'CSV to JSON',
        workspaceId: 'data',
        utilityId: 'data-converter',
        featureId: 'csv-to-json',
        input: 'records_q3.csv (420 rows)',
        output: 'records_q3.json (84 KB)',
        timestamp: 'Yesterday, 04:15 PM',
        status: 'completed',
      },
    ];
  }

  /**
   * Add a new history entry
   */
  static record(entry: {
    toolName: string;
    workspaceId: string;
    utilityId: string;
    featureId: string;
    input: string;
    output: string;
    status?: HistoryStatus;
  }): HistoryRecord {
    const existing = this.getRecords();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const newRecord: HistoryRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      toolName: entry.toolName,
      workspaceId: entry.workspaceId,
      utilityId: entry.utilityId,
      featureId: entry.featureId,
      input: entry.input,
      output: entry.output,
      timestamp: `${dateStr}, ${timeStr}`,
      status: entry.status || 'completed',
    };

    const updated = [newRecord, ...existing.filter((r) => r.id !== newRecord.id)].slice(0, MAX_ENTRIES);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save history entry:', err);
    }

    return newRecord;
  }

  /**
   * Remove a single record by ID
   */
  static remove(id: string): void {
    const records = this.getRecords().filter((r) => r.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      console.error('Failed to update history:', err);
    }
  }

  /**
   * Clear all history records
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }
}
