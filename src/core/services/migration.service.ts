/**
 * One-time storage migration service for persisted user keys.
 * Migrates legacy schema (where featureId was the utility and utilityId was the group)
 * to the new hierarchy: Workspace > Group > Utility.
 */

export interface MigrationResult {
  migratedFavorites: number;
  migratedHistory: number;
  migratedLastUsed: number;
  migratedRecent: boolean;
}

const MIGRATION_FLAG_KEY = 'toiloki_storage_v2_migrated';

export class MigrationService {
  /**
   * Run one-time migration of localStorage keys
   */
  static runMigration(): MigrationResult {
    const result: MigrationResult = {
      migratedFavorites: 0,
      migratedHistory: 0,
      migratedLastUsed: 0,
      migratedRecent: false,
    };

    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return result;
      }

      // 1. Migrate Favorites (toiloki_favorites)
      const rawFavs = localStorage.getItem('toiloki_favorites');
      if (rawFavs) {
        try {
          const favs = JSON.parse(rawFavs);
          if (Array.isArray(favs)) {
            let changed = false;
            const updatedFavs = favs.map((item) => {
              if (item && 'featureId' in item) {
                changed = true;
                result.migratedFavorites++;
                const { featureId, utilityId, ...rest } = item;
                return {
                  ...rest,
                  groupId: utilityId || 'general',
                  utilityId: featureId,
                };
              }
              return item;
            });

            if (changed) {
              localStorage.setItem('toiloki_favorites', JSON.stringify(updatedFavs));
            }
          }
        } catch (e) {
          console.warn('[MigrationService] Failed to parse favorites:', e);
        }
      }

      // 2. Migrate History (toiloki_history_v2)
      const rawHistory = localStorage.getItem('toiloki_history_v2');
      if (rawHistory) {
        try {
          const hist = JSON.parse(rawHistory);
          if (Array.isArray(hist)) {
            let changed = false;
            const updatedHist = hist.map((item) => {
              if (item && 'featureId' in item) {
                changed = true;
                result.migratedHistory++;
                const { featureId, utilityId, ...rest } = item;
                return {
                  ...rest,
                  groupId: utilityId || 'general',
                  utilityId: featureId,
                };
              }
              return item;
            });

            if (changed) {
              localStorage.setItem('toiloki_history_v2', JSON.stringify(updatedHist));
            }
          }
        } catch (e) {
          console.warn('[MigrationService] Failed to parse history:', e);
        }
      }

      // 3. Migrate Last-Used Workspace Utility keys (toiloki_last_tool_* -> toiloki_last_utility_*)
      const workspaces = ['pdf', 'documents', 'images', 'data', 'text', 'developer', 'calculator', 'files'];
      for (const ws of workspaces) {
        const oldKey = `toiloki_last_tool_${ws}`;
        const newKey = `toiloki_last_utility_${ws}`;
        const oldVal = localStorage.getItem(oldKey);

        if (oldVal) {
          result.migratedLastUsed++;
          try {
            const parsed = JSON.parse(oldVal);
            if (parsed && typeof parsed === 'object') {
              const utilityId = parsed.featureId || parsed.utilityId || '';
              const groupId = (parsed.featureId ? parsed.utilityId : parsed.groupId) || 'general';
              localStorage.setItem(newKey, JSON.stringify({ groupId, utilityId }));
            } else {
              localStorage.setItem(newKey, oldVal);
            }
          } catch {
            localStorage.setItem(newKey, oldVal);
          }
          localStorage.removeItem(oldKey);
        }
      }

      // 4. Migrate Recent Utilities key (toiloki_recent_tools -> toiloki_recent_utilities)
      const oldRecent = localStorage.getItem('toiloki_recent_tools');
      if (oldRecent) {
        const existingNew = localStorage.getItem('toiloki_recent_utilities');
        if (!existingNew) {
          localStorage.setItem('toiloki_recent_utilities', oldRecent);
          result.migratedRecent = true;
        }
        localStorage.removeItem('toiloki_recent_tools');
      }

      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    } catch (err) {
      console.error('[MigrationService] Error during storage migration:', err);
    }

    return result;
  }
}
