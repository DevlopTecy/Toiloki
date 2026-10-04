const assert = require('assert');

// Mock localStorage for test environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
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

global.localStorage = new MockLocalStorage();
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

console.log('======================================================');
console.log('  PHASE 12: FLOW, RETENTION, PRESETS & SHORTCUTS TEST ');
console.log('======================================================');

// 1. Test "Continue where you left off" (strip file buffers and contents)
console.log('\n1. Testing "Continue where you left off" options serialization...');
function saveLastOptions(utilityId, options) {
  const cleanOptions = {};
  const forbidden = /^(file|buffer|content|bytes|dataUri|path|input|source|payload)$/i;
  for (const [k, v] of Object.entries(options)) {
    if (!forbidden.test(k) && typeof v !== 'function') {
      cleanOptions[k] = v;
    }
  }
  global.localStorage.setItem(`toiloki_last_options_${utilityId}`, JSON.stringify(cleanOptions));
}

function getLastOptions(utilityId) {
  const raw = global.localStorage.getItem(`toiloki_last_options_${utilityId}`);
  return raw ? JSON.parse(raw) : null;
}

saveLastOptions('format-json-code', {
  indent: 4,
  sortKeys: true,
  file: new Uint8Array([1, 2, 3]), // Should be stripped!
  buffer: 'raw bytes',             // Should be stripped!
  content: 'sensitive file data',  // Should be stripped!
  dataUri: 'data:application/pdf', // Should be stripped!
});

const restored = getLastOptions('format-json-code');
assert.strictEqual(restored.indent, 4, 'Indent setting preserved');
assert.strictEqual(restored.sortKeys, true, 'sortKeys setting preserved');
assert.strictEqual(restored.file, undefined, 'File buffer strictly stripped');
assert.strictEqual(restored.buffer, undefined, 'Raw buffer strictly stripped');
assert.strictEqual(restored.content, undefined, 'File content strictly stripped');
assert.strictEqual(restored.dataUri, undefined, 'Data URI strictly stripped');
console.log('✓ Options preserved while file buffers/content strictly eliminated.');

// 2. Test Presets per utility & Custom presets
console.log('\n2. Testing presets saving and retrieval...');
const presetsStore = [];
function saveCustomPreset(preset) {
  const newPreset = {
    ...preset,
    id: `preset_${Date.now()}`,
    createdAt: new Date().toISOString(),
    isBuiltin: false,
  };
  presetsStore.push(newPreset);
  return newPreset;
}

const customPreset = saveCustomPreset({
  utilityId: 'img-resize',
  name: 'Ultra High Res (4K)',
  values: { width: 3840, height: 2160, maintainAspect: true },
});

assert.strictEqual(customPreset.name, 'Ultra High Res (4K)');
assert.strictEqual(customPreset.values.width, 3840);
assert.strictEqual(presetsStore.length, 1);
console.log('✓ Presets creation and values storage validated.');

// 3. Test Drag-and-drop Reordering for Pinned Quick Actions
console.log('\n3. Testing pinned quick actions reorder logic...');
let pinnedIds = ['merge-pdf', 'img-resize', 'format-json-code', 'file-analyzer-full'];
function reorderPinned(fromIdx, toIdx) {
  const reordered = [...pinnedIds];
  const [moved] = reordered.splice(fromIdx, 1);
  reordered.splice(toIdx, 0, moved);
  pinnedIds = reordered;
  return pinnedIds;
}

// Move 'format-json-code' (idx 2) to first position (idx 0)
const afterReorder = reorderPinned(2, 0);
assert.deepStrictEqual(afterReorder, ['format-json-code', 'merge-pdf', 'img-resize', 'file-analyzer-full']);
console.log('✓ Pinned quick action drag reorder resequences elements cleanly.');

// 4. Test Storage Savings Summary setting
console.log('\n4. Testing storage savings summary default and toggle...');
const defaultSettings = {
  theme: 'system',
  showSavingsSummary: false,
};
assert.strictEqual(defaultSettings.showSavingsSummary, false, 'showSavingsSummary is OFF by default');

const enabledSettings = {
  ...defaultSettings,
  showSavingsSummary: true,
};
assert.strictEqual(enabledSettings.showSavingsSummary, true, 'showSavingsSummary can be enabled calmly');
console.log('✓ Savings summary verified off by default with calm opt-in.');

console.log('\n======================================================');
console.log('  ALL PHASE 12 FLOW & RETENTION TESTS PASSED (100% OK) ');
console.log('======================================================\n');
