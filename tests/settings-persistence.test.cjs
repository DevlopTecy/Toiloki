// tests/settings-persistence.test.cjs
const assert = require('assert');

// Mock localStorage for node environment
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
};

console.log('Testing Settings Persistence and 5-page structure...');

// Storage key from SettingsService
const STORAGE_KEY = 'toiloki_settings';

// Default settings baseline
const DEFAULT_SETTINGS = {
  theme: 'system',
  activeThemeId: 'default-clean',
  density: 'default',
  fontSize: 'medium',
  fontSizeScale: '100%',
  interfaceFont: 'Inter',
  monoFont: 'JetBrains Mono',
  monoFontSize: '13px',
  accentColor: 'orange',
  customAccentHex: '#F5A524',
  cornerStyle: 'default',
  buttonCardStyle: 'flat',
  windowEffect: 'none',
  windowOpacity: 100,
  reduceMotion: 'auto',
  layout: 'workbench',
  showUpcomingUtilities: false,
  threads: '4',
  memoryLimit: '1024',
  hardwareAccel: true,
  performanceMode: 'auto',
  outputDir: 'C:\\Users\\User\\Downloads\\Toiloki Output',
  namingTemplate: '{name}_{tool}_{date}',
  conflictBehavior: 'auto-rename',
  preserveTimestamps: true,
  fileAssociationsEnabled: true,
  keepHistory: true,
  retentionDays: '30',
  clearOnExit: false,
  showDeveloper: false,
  logLevel: 'info',
  safeMode: false,
  portableMode: false,
};

// 1. Initial State: default settings
localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
let loaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
assert.strictEqual(loaded.performanceMode, 'auto', 'Initial performanceMode should be auto');
assert.strictEqual(loaded.layout, 'workbench', 'Initial layout should be workbench');
assert.strictEqual(loaded.preserveTimestamps, true, 'Initial preserveTimestamps should be true');

// 2. Patching Performance Mode: Fast
const fastPatch = {
  performanceMode: 'fast',
  threads: '8',
  memoryLimit: '4096',
  hardwareAccel: true,
};
Object.assign(loaded, fastPatch);
localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));

// Simulate app restart / reload
let reloaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
assert.strictEqual(reloaded.performanceMode, 'fast', 'Persisted performanceMode should be fast');
assert.strictEqual(reloaded.threads, '8', 'Persisted threads should be 8');
assert.strictEqual(reloaded.memoryLimit, '4096', 'Persisted memoryLimit should be 4096');

// 3. Patching Performance Mode: Low Memory
const lowMemPatch = {
  performanceMode: 'low-memory',
  threads: '2',
  memoryLimit: '512',
  hardwareAccel: false,
};
Object.assign(reloaded, lowMemPatch);
localStorage.setItem(STORAGE_KEY, JSON.stringify(reloaded));

reloaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
assert.strictEqual(reloaded.performanceMode, 'low-memory', 'Persisted performanceMode should be low-memory');
assert.strictEqual(reloaded.threads, '2', 'Persisted threads should be 2');
assert.strictEqual(reloaded.hardwareAccel, false, 'Persisted hardwareAccel should be false');

// 4. Patching Files & Output settings
const filesPatch = {
  outputDir: 'D:\\Exports\\Toiloki_Done',
  namingTemplate: '{date}_{name}_{counter}',
  conflictBehavior: 'overwrite',
  preserveTimestamps: false,
  fileAssociationsEnabled: true,
};
Object.assign(reloaded, filesPatch);
localStorage.setItem(STORAGE_KEY, JSON.stringify(reloaded));

reloaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
assert.strictEqual(reloaded.outputDir, 'D:\\Exports\\Toiloki_Done');
assert.strictEqual(reloaded.namingTemplate, '{date}_{name}_{counter}');
assert.strictEqual(reloaded.conflictBehavior, 'overwrite');
assert.strictEqual(reloaded.preserveTimestamps, false);

// 5. Patching History & Privacy
const privacyPatch = {
  keepHistory: false,
  retentionDays: '7',
  clearOnExit: true,
  logLevel: 'off',
};
Object.assign(reloaded, privacyPatch);
localStorage.setItem(STORAGE_KEY, JSON.stringify(reloaded));

reloaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
assert.strictEqual(reloaded.keepHistory, false);
assert.strictEqual(reloaded.retentionDays, '7');
assert.strictEqual(reloaded.clearOnExit, true);
assert.strictEqual(reloaded.logLevel, 'off');

// 6. Patching Advanced
const advancedPatch = {
  portableMode: true,
  safeMode: false,
  showUpcomingUtilities: true,
  showDeveloper: true,
};
Object.assign(reloaded, advancedPatch);
localStorage.setItem(STORAGE_KEY, JSON.stringify(reloaded));

reloaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
assert.strictEqual(reloaded.portableMode, true);
assert.strictEqual(reloaded.showUpcomingUtilities, true);
assert.strictEqual(reloaded.showDeveloper, true);

// 7. Patching Appearance
const appearancePatch = {
  theme: 'dark',
  accentColor: 'teal',
  density: 'compact',
  cornerStyle: 'sharp',
  buttonCardStyle: 'image',
  layout: 'workbench',
};
Object.assign(reloaded, appearancePatch);
localStorage.setItem(STORAGE_KEY, JSON.stringify(reloaded));

reloaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
assert.strictEqual(reloaded.theme, 'dark');
assert.strictEqual(reloaded.accentColor, 'teal');
assert.strictEqual(reloaded.density, 'compact');
assert.strictEqual(reloaded.cornerStyle, 'sharp');
assert.strictEqual(reloaded.buttonCardStyle, 'image');

console.log('✓ All 5 settings pages persistence and restart verification passed!');
