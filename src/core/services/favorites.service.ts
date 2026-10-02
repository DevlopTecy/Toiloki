import { WorkspaceId } from '../types/workspace';

export interface FavoriteItem {
  workspaceId: WorkspaceId;
  utilityId: string;
  featureId: string;
  name: string;
  description: string;
  workspaceName: string;
}

const STORAGE_KEY = 'toiloki_favorites';

export class FavoritesService {
  /**
   * Get all pinned favorite tools
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
        utilityId: 'page-organizer',
        featureId: 'merge-pdf',
        name: 'Merge PDF',
        description: 'Combine multiple PDF files into one.',
        workspaceName: 'PDF',
      },
      {
        workspaceId: 'images',
        utilityId: 'image-optimizer',
        featureId: 'compress-image',
        name: 'Compress Image',
        description: 'Reduce image file size with quality slider.',
        workspaceName: 'Images',
      },
      {
        workspaceId: 'text',
        utilityId: 'text-cleaner',
        featureId: 'remove-spaces',
        name: 'Remove Extra Spaces',
        description: 'Collapse consecutive spaces and trim whitespace.',
        workspaceName: 'Text',
      },
      {
        workspaceId: 'files',
        utilityId: 'files-operations',
        featureId: 'batch-rename-files',
        name: 'Batch Rename',
        description: 'Rename files with prefix, suffix, and numbering.',
        workspaceName: 'Files & Archives',
      },
    ];
  }

  /**
   * Check if a feature is currently favorited
   */
  static isFavorite(featureId: string): boolean {
    const list = this.getFavorites();
    return list.some((item) => item.featureId === featureId);
  }

  /**
   * Toggle favorite status of an item. Returns true if now favorited, false if removed.
   */
  static toggleFavorite(item: FavoriteItem): boolean {
    const current = this.getFavorites();
    const exists = current.some((f) => f.featureId === item.featureId);
    let updated: FavoriteItem[];

    if (exists) {
      updated = current.filter((f) => f.featureId !== item.featureId);
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
   * Remove a single favorite by featureId
   */
  static removeFavorite(featureId: string): void {
    const updated = this.getFavorites().filter((f) => f.featureId !== featureId);
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
