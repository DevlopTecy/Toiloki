import { WorkspaceId } from '../types/workspace';

export interface TrashItem {
  id: string;
  fileName: string;
  originalPath: string;
  fileSize: number;
  deletedAt: string;
  sourceUtility: string;
  workspaceId: WorkspaceId;
  previewText?: string;
  dataBuffer?: Uint8Array;
}

const TRASH_STORAGE_KEY = 'toiloki_trash_registry';

export class TrashService {
  private static inMemoryBuffers = new Map<string, Uint8Array>();

  /**
   * Quarantine a deleted or overwritten file into Toiloki Trash
   */
  static async moveToTrash(item: {
    fileName: string;
    originalPath: string;
    fileSize: number;
    sourceUtility: string;
    workspaceId: WorkspaceId;
    previewText?: string;
    buffer?: Uint8Array;
  }): Promise<TrashItem> {
    const id = `trash_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const trashItem: TrashItem = {
      id,
      fileName: item.fileName,
      originalPath: item.originalPath,
      fileSize: item.fileSize,
      deletedAt: new Date().toISOString(),
      sourceUtility: item.sourceUtility,
      workspaceId: item.workspaceId,
      previewText: item.previewText?.slice(0, 200),
    };

    if (item.buffer) {
      this.inMemoryBuffers.set(id, item.buffer);
    }

    const items = this.getTrashItems();
    items.unshift(trashItem);

    try {
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to update trash registry in localStorage:', err);
    }

    window.dispatchEvent(new CustomEvent('toiloki-trash-updated'));
    return trashItem;
  }

  /**
   * Get all quarantined items in Toiloki Trash
   */
  static getTrashItems(): TrashItem[] {
    try {
      const data = localStorage.getItem(TRASH_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Calculate total bytes stored in Toiloki Trash
   */
  static getTrashTotalSize(): number {
    const items = this.getTrashItems();
    return items.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  }

  /**
   * Restore a quarantined file back to its original location or trigger save
   */
  static async restoreItem(id: string): Promise<{ success: boolean; restoredPath?: string; error?: string }> {
    const items = this.getTrashItems();
    const item = items.find((i) => i.id === id);
    if (!item) {
      return { success: false, error: 'Item not found in trash' };
    }

    const buffer = this.inMemoryBuffers.get(id);
    const toiloki = (window as any).toiloki;

    if (toiloki?.fs && buffer && item.originalPath) {
      try {
        const writeRes = await toiloki.fs.writeFileBuffer(item.originalPath, buffer);
        if (writeRes.success) {
          this.deleteItem(id);
          return { success: true, restoredPath: item.originalPath };
        }
      } catch (err) {
        console.error('Failed to restore to original path:', err);
      }
    }

    // Fallback: download via browser or prompt save
    if (buffer) {
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.deleteItem(id);
      return { success: true, restoredPath: item.fileName };
    }

    // If only text is available
    if (item.previewText) {
      const blob = new Blob([item.previewText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.deleteItem(id);
      return { success: true, restoredPath: item.fileName };
    }

    return { success: false, error: 'No data available to restore' };
  }

  /**
   * Permanently delete a single item from trash
   */
  static deleteItem(id: string): boolean {
    const items = this.getTrashItems();
    const filtered = items.filter((i) => i.id !== id);
    this.inMemoryBuffers.delete(id);

    if (filtered.length !== items.length) {
      try {
        localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('toiloki-trash-updated'));
        return true;
      } catch (err) {
        console.error('Failed to delete item from trash registry:', err);
      }
    }
    return false;
  }

  /**
   * Empty / purge all trash items permanently
   */
  static purgeTrash(): number {
    const items = this.getTrashItems();
    const count = items.length;
    this.inMemoryBuffers.clear();
    try {
      localStorage.removeItem(TRASH_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('toiloki-trash-updated'));
    } catch {}
    return count;
  }
}
