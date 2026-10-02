const assert = require('assert');

// Mock localStorage for test environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.window = { localStorage: new MockLocalStorage() };
global.localStorage = global.window.localStorage;

function runMigration() {
  const result = {
    migratedFavorites: 0,
    migratedHistory: 0,
    migratedLastUsed: 0,
    migratedRecent: false,
  };

  // 1. Favorites
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
    } catch (e) {}
  }

  // 2. History
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
    } catch (e) {}
  }

  // 3. Last used
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

  // 4. Recent
  const oldRecent = localStorage.getItem('toiloki_recent_tools');
  if (oldRecent) {
    const existingNew = localStorage.getItem('toiloki_recent_utilities');
    if (!existingNew) {
      localStorage.setItem('toiloki_recent_utilities', oldRecent);
      result.migratedRecent = true;
    }
    localStorage.removeItem('toiloki_recent_tools');
  }

  localStorage.setItem('toiloki_storage_v2_migrated', 'true');
  return result;
}

// ======================== TESTS ========================

console.log('Running Migration Test Suite...');

// Setup legacy existing profile
localStorage.setItem('toiloki_favorites', JSON.stringify([
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
  }
]));

localStorage.setItem('toiloki_history_v2', JSON.stringify([
  {
    id: 'rec-1',
    toolName: 'PDF Merger',
    workspaceId: 'pdf',
    utilityId: 'page-organizer',
    featureId: 'merge-pdf',
    input: 'test.pdf',
    output: 'out.pdf',
    timestamp: 'Today',
  }
]));

localStorage.setItem('toiloki_last_tool_pdf', JSON.stringify({
  utilityId: 'page-organizer',
  featureId: 'merge-pdf',
}));

localStorage.setItem('toiloki_last_tool_text', JSON.stringify({
  utilityId: 'text-cleaner',
  featureId: 'remove-spaces',
}));

localStorage.setItem('toiloki_recent_tools', JSON.stringify(['merge-pdf', 'compress-image']));

// 1. Run migration
const result = runMigration();
console.log('Migration Result 1:', result);

assert.strictEqual(result.migratedFavorites, 2, 'Should migrate 2 legacy favorites');
assert.strictEqual(result.migratedHistory, 1, 'Should migrate 1 legacy history entry');
assert.strictEqual(result.migratedLastUsed, 2, 'Should migrate 2 last used keys');
assert.strictEqual(result.migratedRecent, true, 'Should migrate recent utilities');

// 2. Validate migrated favorites structure
const migratedFavs = JSON.parse(localStorage.getItem('toiloki_favorites'));
assert.strictEqual(migratedFavs.length, 2);
assert.strictEqual(migratedFavs[0].utilityId, 'merge-pdf', 'featureId should become utilityId');
assert.strictEqual(migratedFavs[0].groupId, 'page-organizer', 'utilityId should become groupId');
assert.strictEqual('featureId' in migratedFavs[0], false, 'featureId property should be removed');

// 3. Validate migrated history structure
const migratedHist = JSON.parse(localStorage.getItem('toiloki_history_v2'));
assert.strictEqual(migratedHist.length, 1);
assert.strictEqual(migratedHist[0].utilityId, 'merge-pdf');
assert.strictEqual(migratedHist[0].groupId, 'page-organizer');
assert.strictEqual('featureId' in migratedHist[0], false);

// 4. Validate migrated last used keys
assert.strictEqual(localStorage.getItem('toiloki_last_tool_pdf'), null, 'Old last tool key should be removed');
const lastPdf = JSON.parse(localStorage.getItem('toiloki_last_utility_pdf'));
assert.strictEqual(lastPdf.groupId, 'page-organizer');
assert.strictEqual(lastPdf.utilityId, 'merge-pdf');

// 5. Validate migrated recent key
assert.strictEqual(localStorage.getItem('toiloki_recent_tools'), null, 'Old recent tools key should be removed');
const recentUtils = JSON.parse(localStorage.getItem('toiloki_recent_utilities'));
assert.deepStrictEqual(recentUtils, ['merge-pdf', 'compress-image']);

// 6. Test IDEMPOTENCY: running migration again shouldn't alter already migrated records
const result2 = runMigration();
console.log('Migration Result 2 (Idempotency):', result2);
assert.strictEqual(result2.migratedFavorites, 0, 'Should not re-migrate favorites');
assert.strictEqual(result2.migratedHistory, 0, 'Should not re-migrate history');

const reFavs = JSON.parse(localStorage.getItem('toiloki_favorites'));
assert.strictEqual(reFavs[0].utilityId, 'merge-pdf');
assert.strictEqual(reFavs[0].groupId, 'page-organizer');

console.log('✓ All storage migration tests passed successfully!');
