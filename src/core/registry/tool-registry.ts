import { LucideIcon } from 'lucide-react';
import { WORKSPACES } from './app-registry';
import { WorkspaceId } from '../types/workspace';

export interface RegisteredTool {
  toolId: string;
  name: string;
  description: string;
  workspaceId: WorkspaceId;
  workspaceName: string;
  utilityId: string;
  utilityName: string;
  badgeGradient: string;
  icon: LucideIcon;
  keywords: string[];
  engineId: string;
}

const RECENT_TOOLS_KEY = 'toiloki_recent_tools';
const FAVORITES_KEY = 'toiloki_favorites_ids';

export class ToolRegistry {
  private static cachedTools: RegisteredTool[] | null = null;

  /**
   * Get all registered tools in the application from the authoritative WORKSPACES blueprint
   */
  static getAllTools(): RegisteredTool[] {
    if (this.cachedTools) return this.cachedTools;

    const list: RegisteredTool[] = [];
    for (const ws of WORKSPACES) {
      for (const util of ws.utilities) {
        for (const feat of util.features) {
          list.push({
            toolId: feat.id,
            name: feat.name,
            description: feat.description,
            workspaceId: ws.id,
            workspaceName: ws.name,
            utilityId: util.id,
            utilityName: util.name,
            badgeGradient: util.badgeGradient,
            icon: util.icon,
            keywords: feat.keywords || [],
            engineId: feat.engineId,
          });
        }
      }
    }
    this.cachedTools = list;
    return list;
  }

  /**
   * Lookup a tool by its unique feature ID
   */
  static getToolById(toolId: string): RegisteredTool | undefined {
    return this.getAllTools().find((t) => t.toolId === toolId);
  }

  /**
   * Search tools by name, description, category, or keywords
   */
  static search(query: string): RegisteredTool[] {
    const all = this.getAllTools();
    if (!query.trim()) return all.slice(0, 10);

    const q = query.toLowerCase().trim();
    return all.filter((tool) => {
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.workspaceName.toLowerCase().includes(q) ||
        tool.utilityName.toLowerCase().includes(q) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(q))
      );
    });
  }

  /**
   * Record that a user accessed or used a tool
   */
  static recordToolUsage(toolId: string): void {
    try {
      const tool = this.getToolById(toolId);
      if (!tool) return;

      const current = this.getRecentToolIds();
      const updated = [toolId, ...current.filter((id) => id !== toolId)].slice(0, 10);
      localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to record recent tool usage:', err);
    }
  }

  /**
   * Get raw list of recent tool IDs
   */
  static getRecentToolIds(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_TOOLS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to get recent tool IDs:', err);
    }
    // Default seed tools
    return ['merge-pdf', 'compress-image', 'remove-spaces', 'batch-rename-files'];
  }

  /**
   * Get recent tools as full RegisteredTool objects
   */
  static getRecentTools(limit = 4): RegisteredTool[] {
    const ids = this.getRecentToolIds();
    const result: RegisteredTool[] = [];

    for (const id of ids) {
      const tool = this.getToolById(id);
      if (tool) {
        result.push(tool);
      }
      if (result.length >= limit) break;
    }

    return result;
  }

  /**
   * Get favorite tool IDs
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
   * Check if tool is favorited
   */
  static isFavorite(toolId: string): boolean {
    return this.getFavoriteIds().includes(toolId);
  }

  /**
   * Toggle favorite state of a tool
   */
  static toggleFavorite(toolId: string): boolean {
    const current = this.getFavoriteIds();
    const exists = current.includes(toolId);
    let updated: string[];

    if (exists) {
      updated = current.filter((id) => id !== toolId);
    } else {
      updated = [toolId, ...current];
    }

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update favorites:', err);
    }

    return !exists;
  }

  /**
   * Get full RegisteredTool objects for all favorited tools
   */
  static getFavoriteTools(): RegisteredTool[] {
    const ids = this.getFavoriteIds();
    return ids.map((id) => this.getToolById(id)).filter((t): t is RegisteredTool => !!t);
  }
}
