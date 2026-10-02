import { LucideIcon } from 'lucide-react';
import { WORKSPACES } from './app-registry';
import { WorkspaceId, UtilityStatus } from '../types/workspace';

export interface RegisteredUtility {
  utilityId: string;
  name: string;
  description: string;
  workspaceId: WorkspaceId;
  workspaceName: string;
  groupId: string;
  groupName: string;
  badgeGradient: string;
  icon: LucideIcon;
  keywords: string[];
  engineId: string;
  status: UtilityStatus;
}

const RECENT_UTILITIES_KEY = 'toiloki_recent_utilities';
const FAVORITES_KEY = 'toiloki_favorites_ids';

export class UtilityRegistry {
  private static cachedUtilities: RegisteredUtility[] | null = null;

  /**
   * Get all registered utilities in the application from the authoritative WORKSPACES blueprint.
   */
  static getAllUtilities(): RegisteredUtility[] {
    if (this.cachedUtilities) return this.cachedUtilities;

    const list: RegisteredUtility[] = [];
    for (const ws of WORKSPACES) {
      for (const group of ws.groups) {
        for (const util of group.utilities) {
          list.push({
            utilityId: util.id,
            name: util.name,
            description: util.description,
            workspaceId: ws.id,
            workspaceName: ws.name,
            groupId: group.id,
            groupName: group.name,
            badgeGradient: group.badgeGradient,
            icon: util.icon || group.icon,
            keywords: util.keywords || [],
            engineId: util.engineId,
            status: util.status || 'ready',
          });
        }
      }
    }
    this.cachedUtilities = list;
    return list;
  }

  /**
   * Lookup a utility by its unique utility ID
   */
  static getUtilityById(utilityId: string): RegisteredUtility | undefined {
    return this.getAllUtilities().find((u) => u.utilityId === utilityId);
  }

  /**
   * Search utilities by name, description, workspace, group, or keywords
   */
  static search(query: string): RegisteredUtility[] {
    const all = this.getAllUtilities();
    if (!query.trim()) return all;

    const q = query.toLowerCase().trim();
    return all.filter((util) => {
      return (
        util.name.toLowerCase().includes(q) ||
        util.description.toLowerCase().includes(q) ||
        util.workspaceName.toLowerCase().includes(q) ||
        util.groupName.toLowerCase().includes(q) ||
        util.keywords.some((kw) => kw.toLowerCase().includes(q))
      );
    });
  }

  /**
   * Status breakdown for all utilities in the suite
   */
  static getStatusBreakdown() {
    const all = this.getAllUtilities();
    const ready = all.filter((u) => u.status === 'ready').length;
    const beta = all.filter((u) => u.status === 'beta').length;
    const soon = all.filter((u) => u.status === 'soon').length;
    return { ready, beta, soon, total: all.length };
  }

  /**
   * Record that a user accessed or used a utility
   */
  static recordUtilityUsage(utilityId: string): void {
    try {
      const util = this.getUtilityById(utilityId);
      if (!util) return;

      const current = this.getRecentUtilityIds();
      const updated = [utilityId, ...current.filter((id) => id !== utilityId)].slice(0, 10);
      localStorage.setItem(RECENT_UTILITIES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to record recent utility usage:', err);
    }
  }

  /**
   * Get recently used utility IDs
   */
  static getRecentUtilityIds(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_UTILITIES_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to get recent utility IDs:', err);
    }
    return ['merge-pdf', 'compress-image', 'csv-to-json'];
  }

  /**
   * Get recent utilities as full RegisteredUtility objects
   */
  static getRecentUtilities(limit = 4): RegisteredUtility[] {
    const ids = this.getRecentUtilityIds();
    const result: RegisteredUtility[] = [];

    for (const id of ids) {
      const util = this.getUtilityById(id);
      if (util) {
        result.push(util);
      }
      if (result.length >= limit) break;
    }

    return result;
  }

  /**
   * Get favorite utility IDs
   */
  static getFavoriteIds(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to get favorite IDs:', err);
    }
    return ['merge-pdf', 'compress-image', 'remove-spaces', 'batch-rename-files'];
  }

  /**
   * Check if utility is favorited
   */
  static isFavorite(utilityId: string): boolean {
    return this.getFavoriteIds().includes(utilityId);
  }

  /**
   * Toggle favorite status
   */
  static toggleFavorite(utilityId: string): boolean {
    const current = this.getFavoriteIds();
    const exists = current.includes(utilityId);
    let updated: string[];

    if (exists) {
      updated = current.filter((id) => id !== utilityId);
    } else {
      updated = [utilityId, ...current];
    }

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update favorites:', err);
    }

    return !exists;
  }

  /**
   * Get full RegisteredUtility objects for all favorited utilities
   */
  static getFavoriteUtilities(): RegisteredUtility[] {
    const ids = this.getFavoriteIds();
    return ids.map((id) => this.getUtilityById(id)).filter((u): u is RegisteredUtility => !!u);
  }
}

// Synonyms for convenience
export const ToolRegistry = UtilityRegistry;
export type RegisteredTool = RegisteredUtility;
