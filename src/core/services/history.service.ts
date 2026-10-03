export type HistoryStatus = 'waiting' | 'processing' | 'completed' | 'failed' | 'info' | 'idle';

export interface HistoryRecord {
  id: string;
  toolName: string;
  workspaceId: string;
  groupId: string;
  utilityId: string;
  input: string;
  output: string;
  displayLabel?: string; // Human-readable "Converted 175 characters to uppercase"
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
    if (!(window as any).toiloki?.fs?.getStats) return records;

    let hasChanges = false;
    for (const rec of records) {
      if (rec.outputPath) {
        try {
          const stats = await (window as any).toiloki.fs.getStats(rec.outputPath);
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
   * Retrieve all recorded history entries. Returns [] when no real data exists (no seed data).
   */
  static getRecords(): HistoryRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Failed to load history from localStorage:', err);
    }
    return [];
  }

  /**
   * Generate a human-readable display label for a history record.
   * Examples: "Compressed image → banner.webp"
   *           "Merged 3 PDF files → merged_output.pdf"
   *           "Case conversion (175 chars)"
   */
  static buildDisplayLabel(entry: {
    toolName: string;
    input: string;
    output: string;
  }): string {
    const { toolName, input, output } = entry;
    // If output has file.ext (size) pattern, show "ToolName → filename"
    if (output && output.match(/\.\w{2,4}\s*\(/)) {
      return `${toolName} → ${output.split('(')[0].trim()}`;
    }
    // If output shows char count
    const charMatch = output.match(/(\d+)\s*char/i);
    if (charMatch) {
      return `${toolName} (${charMatch[1]} chars)`;
    }
    // If input has row count
    const rowMatch = input.match(/\((\d+)\s*rows?\)/i);
    if (rowMatch) {
      return `${toolName} · ${rowMatch[1]} rows`;
    }
    // Generic fallback: just the tool name
    return toolName;
  }

  /**
   * Add a new history entry. Skips empty runs and merges consecutive identical entries.
   */
  static record(entry: {
    toolName: string;
    workspaceId: string;
    groupId: string;
    utilityId: string;
    input: string;
    output: string;
    status?: HistoryStatus;
  }): HistoryRecord | null {
    // Skip empty runs (0 chars output)
    const trimmedOutput = (entry.output || '').trim();
    if (!trimmedOutput) return null;

    const existing = this.getRecords();

    // Merge consecutive identical entries (same utility + same input + same output)
    const last = existing[0];
    if (
      last &&
      last.utilityId === entry.utilityId &&
      last.input === entry.input &&
      last.output === entry.output
    ) {
      return last;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const displayLabel = this.buildDisplayLabel(entry);

    const newRecord: HistoryRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      toolName: entry.toolName,
      workspaceId: entry.workspaceId,
      groupId: entry.groupId,
      utilityId: entry.utilityId,
      input: entry.input,
      output: entry.output,
      displayLabel,
      timestamp: `${dateStr}, ${timeStr}`,
      status: entry.status || 'completed',
    };

    const updated = [newRecord, ...existing].slice(0, MAX_ENTRIES);

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
