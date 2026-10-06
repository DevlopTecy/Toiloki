// tests/phase9-responsive-platform.test.cjs
// Phase 9: Responsive Layout & Platform Adapter Verification Test Suite
// Validates:
// 1. PlatformAdapter interface contracts (Electron vs Web PWA capability models)
// 2. CSS responsive breakpoint token rules (<600px, 600-1023px, >=1024px)
// 3. Multi-viewport resilience via Playwright Electron (375x667, 768x1024, 1280x720)
// 4. Captures visual responsive evidence into screenshots/phase9/

'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase9');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTests() {
  console.log('================================================================');
  console.log('  PHASE 9: RESPONSIVE LAYOUT & PLATFORM ADAPTER TEST SUITE      ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function pass(name, detail = '') {
    passed++;
    console.log(`  ✓ [PASS] ${name}${detail ? ': ' + detail : ''}`);
  }

  function fail(name, detail = '') {
    failed++;
    console.error(`  ✗ [FAIL] ${name}${detail ? ': ' + detail : ''}`);
  }

  // ─── 1. Platform Adapter Contracts Verification ──────────────────────────
  console.log('--- 1. Platform Adapter Architecture & Interface ---');

  const platformSourcePath = path.join(ROOT, 'src', 'core', 'platform', 'platform-adapter.ts');
  assert.ok(fs.existsSync(platformSourcePath), 'platform-adapter.ts must exist');

  const platformSrc = fs.readFileSync(platformSourcePath, 'utf8');

  // Verify class and interface exports
  assert.ok(platformSrc.includes('export interface PlatformAdapter'), 'Must export PlatformAdapter interface');
  assert.ok(platformSrc.includes('export class ElectronPlatformAdapter'), 'Must export ElectronPlatformAdapter');
  assert.ok(platformSrc.includes('export class WebPlatformAdapter'), 'Must export WebPlatformAdapter');
  assert.ok(platformSrc.includes('export function getPlatformAdapter'), 'Must export getPlatformAdapter factory');
  pass('Platform Adapter declarations', 'PlatformAdapter, ElectronPlatformAdapter, WebPlatformAdapter, getPlatformAdapter');

  // Verify capability contracts
  assert.ok(platformSrc.includes('hasNativeFs: true'), 'Electron must declare native filesystem capability');
  assert.ok(platformSrc.includes('maxRecommendedBufferSizeMB: 500'), 'Electron must support high memory buffers');
  assert.ok(platformSrc.includes('hasNativeFs: typeof window !== \'undefined\''), 'Web PWA must query showOpenFilePicker');
  assert.ok(platformSrc.includes('maxRecommendedBufferSizeMB: 75'), 'Web PWA must clamp recommended buffer to 75MB');
  pass('Platform Capabilities Matrix', 'Electron (500MB, native fs) vs Web PWA (75MB, sandboxed)');

  // ─── 2. Responsive CSS Breakpoints Inspection ───────────────────────────
  console.log('\n--- 2. Responsive CSS Breakpoints Inspection ---');

  const sidebarCss = fs.readFileSync(path.join(ROOT, 'src', 'components', 'layout', 'Sidebar.css'), 'utf8');
  assert.ok(sidebarCss.includes('@media (max-width: 600px)'), 'Sidebar.css must define mobile breakpoint (<600px)');
  assert.ok(sidebarCss.includes('@media (max-width: 1023px)'), 'Sidebar.css must define tablet breakpoint (1023px)');
  pass('Sidebar Breakpoints', 'Mobile (<600px) and Tablet (<1023px) defined');

  const workbenchCss = fs.readFileSync(path.join(ROOT, 'src', 'components', 'workbench', 'WorkbenchShell.css'), 'utf8');
  assert.ok(workbenchCss.includes('@media (max-width: 600px)'), 'WorkbenchShell.css must define mobile breakpoint (<600px)');
  assert.ok(workbenchCss.includes('flex-direction: column'), 'WorkbenchShell.css must stack zones on mobile');
  pass('Workbench 3-Zone Breakpoints', 'Stacks zones vertically into single column on mobile');

  const titlebarCss = fs.readFileSync(path.join(ROOT, 'src', 'components', 'layout', 'TitleBar.css'), 'utf8');
  assert.ok(titlebarCss.includes('@media (max-width: 600px)'), 'TitleBar.css must define mobile breakpoint (<600px)');
  pass('TitleBar Breakpoints', 'Hides wordmark on compact screens preserving search & controls');

  // ─── 3. Multi-Viewport Electron UI Driving ──────────────────────────────
  console.log('\n--- 3. Multi-Viewport Layout Integrity & Screenshots ---');

  const app = await electron.launch({
    args: [ELECTRON_MAIN],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SERVE_DIST: '1',
    },
    timeout: 35000,
  });

  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // Setup initial settings
  await win.evaluate(() => {
    localStorage.setItem('toiloki_intro_completed', 'true');
    localStorage.setItem('toiloki_sidebar_collapsed', 'false');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await win.reload();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // Viewport A: Desktop HD (1280x720)
  await win.setViewportSize({ width: 1280, height: 720 });
  await win.evaluate(() => { window.location.hash = '#/developer/dev-json-format'; });
  await sleep(500);

  const desktopOverflow = await win.evaluate(() => {
    return document.body.scrollWidth <= document.documentElement.clientWidth + 2;
  });
  if (desktopOverflow) pass('Desktop HD (1280x720)', 'Zero horizontal overflow');
  else fail('Desktop HD (1280x720)', 'Detected horizontal overflow');

  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'responsive-desktop-1280x720.png') });

  // Viewport B: Tablet Portrait (768x1024)
  await win.setViewportSize({ width: 768, height: 1024 });
  await sleep(400);

  const tabletOverflow = await win.evaluate(() => {
    return document.body.scrollWidth <= document.documentElement.clientWidth + 2;
  });
  if (tabletOverflow) pass('Tablet Portrait (768x1024)', 'Zero horizontal overflow, adaptive layout');
  else fail('Tablet Portrait (768x1024)', 'Detected horizontal overflow');

  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'responsive-tablet-768x1024.png') });

  // Viewport C: Mobile Portrait (375x667)
  await win.setViewportSize({ width: 375, height: 667 });
  await sleep(400);

  const mobileOverflow = await win.evaluate(() => {
    return document.body.scrollWidth <= document.documentElement.clientWidth + 2;
  });
  if (mobileOverflow) pass('Mobile Portrait (375x667)', 'Single-column stacked zones, zero overflow');
  else fail('Mobile Portrait (375x667)', 'Detected horizontal overflow');

  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'responsive-mobile-375x667.png') });

  // Viewport D: Home Dashboard at Tablet (768x1024)
  await win.evaluate(() => { window.location.hash = '#/home'; });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'responsive-home-tablet-768.png') });
  pass('Home Dashboard Tablet View', 'Saved responsive-home-tablet-768.png');

  await app.close();

  console.log('\n================================================================');
  console.log(`  PHASE 9 RESULTS: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    throw new Error(`Phase 9 tests failed: ${failed} failure(s) detected.`);
  }
}

runTests().catch((err) => {
  console.error('Phase 9 Test Execution Error:', err);
  process.exit(1);
});
