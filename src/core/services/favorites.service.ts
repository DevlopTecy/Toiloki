import { WorkspaceId } from '../types/workspace';

export interface FavoriteItem {
  workspaceId: WorkspaceId;
  groupId: string;
  utilityId: string;
  name: string;
  description: string;
  workspaceName: string;
}

const STORAGE_KEY = 'toiloki_favorites';

export class FavoritesService {
  /**
   * Get all pinned favorite utilities
   */
  static getFavorites(): FavoriteItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load favorites from localStorage:', err);
    }
    return [
      {
        workspaceId: 'pdf',
        groupId: 'page-organizer',
        utilityId: 'merge-pdf',
        name: 'Merge PDF',
        description: 'Combine multiple PDF files into one.',
        workspaceName: 'PDF',
      },
      {
        workspaceId: 'images',
        groupId: 'image-optimizer',
        utilityId: 'compress-image',
        name: 'Compress Image',
        description: 'Reduce image file size with quality slider.',
        workspaceName: 'Images',
      },
      {
        workspaceId: 'text',
        groupId: 'text-cleaner',
        utilityId: 'remove-spaces',
        name: 'Remove Extra Spaces',
        description: 'Collapse consecutive spaces and trim whitespace.',
        workspaceName: 'Text',
      },
      {
        workspaceId: 'files',
        groupId: 'files-operations',
        utilityId: 'batch-rename-files',
        name: 'Batch Rename',
        description: 'Rename files with prefix, suffix, and numbering.',
        workspaceName: 'Files & Archives',
      },
    ];
  }

  /**
   * Check if a utility is currently favorited
   */
  static isFavorite(utilityId: string): boolean {
    const list = this.getFavorites();
    return list.some((item) => item.utilityId === utilityId);
  }

  /**
   * Toggle favorite status of an item. Returns true if now favorited, false if removed.
   */
  static toggleFavorite(item: FavoriteItem): boolean {
    const current = this.getFavorites();
    const exists = current.some((f) => f.utilityId === item.utilityId);
    let updated: FavoriteItem[];

    if (exists) {
      updated = current.filter((f) => f.utilityId !== item.utilityId);
    } else {
      updated = [item, ...current];
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save favorites:', err);
    }

    return !exists;
  }

  /**
   * Remove a single favorite by utilityId
   */
  static removeFavorite(utilityId: string): void {
    const updated = this.getFavorites().filter((f) => f.utilityId !== utilityId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update favorites:', err);
    }
  }

  /**
   * Clear all favorites
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear favorites:', err);
    }
  }
}
