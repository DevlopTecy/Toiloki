import * as Diff from 'diff';
import { EngineResult } from '../../core/types/engine';

export interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export class DiffEngine {
  /**
   * Compare two text blocks line by line
   */
  static compareLines(originalText: string, modifiedText: string): EngineResult<{
    changes: DiffChange[];
    addedCount: number;
    removedCount: number;
  }> {
    const start = performance.now();
    try {
      const diffResult = Diff.diffLines(originalText, modifiedText);

      let addedCount = 0;
      let removedCount = 0;

      const changes: DiffChange[] = diffResult.map((part) => {
        if (part.added) addedCount += (part.value.match(/\n/g) || []).length || 1;
        if (part.removed) removedCount += (part.value.match(/\n/g) || []).length || 1;
        return {
          value: part.value,
          added: part.added,
          removed: part.removed,
        };
      });

      return {
        success: true,
        data: {
          changes,
          addedCount,
          removedCount,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }
}
