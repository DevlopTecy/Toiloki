'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase1');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Launching Electron to capture Phase 1 screenshots...');
  const app = await electron.launch({
    args: [ELECTRON_MAIN],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SERVE_DIST: '1',
    },
    timeout: 15000,
  });

  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // Pre-seed clean localStorage settings
  await win.evaluate(() => {
    localStorage.setItem('toiloki_intro_completed', 'true');
    localStorage.setItem('toiloki_sidebar_collapsed', 'false');
    const settings = {
      theme: 'dark',
      visibleWorkspaces: [
        'pdf', 'documents', 'images', 'data', 'text', 'developer',
        'calculator', 'files', 'security', 'media', 'network', 'design', 'system'
      ],
    };
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(500);

  // ─── 1. Title bar & Main View (1280x720 Dark) ───
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-titlebar-1280x720-dark.png') });
  console.log('  ✓ Captured: 01-titlebar-1280x720-dark.png');

  // ─── 2. Search Panel Empty (Recent & Popular) ───
  const searchInput = win.locator('.ecommerce-search-input');
  await searchInput.click();
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-search-panel-empty-dark.png') });
  console.log('  ✓ Captured: 02-search-panel-empty-dark.png');

  // ─── 3. Search Panel with Query ("pdf") ───
  await searchInput.fill('pdf');
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-search-panel-query-dark.png') });
  console.log('  ✓ Captured: 03-search-panel-query-dark.png');

  // Clear search and press Escape
  await win.keyboard.press('Escape');
  await sleep(300);

  // ─── 4. New Tab Page (Click '+' button) ───
  const newTabBtn = win.locator('.toiloki-new-tab-btn');
  await newTabBtn.click();
  await sleep(500);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-new-tab-page-1280x720-dark.png') });
  console.log('  ✓ Captured: 04-new-tab-page-1280x720-dark.png');

  // ─── 5. Multiple Open Tabs (Open PDF workspace & Images workspace) ───
  // Click on PDF in sidebar
  const pdfSidebarBtn = win.locator('[data-nav="pdf"]');
  await pdfSidebarBtn.click();
  await sleep(400);

  // Middle-click or Ctrl+click Images to open in a new tab
  await win.evaluate(() => {
    window.dispatchEvent(new CustomEvent('toiloki-navigate-utility', {
      detail: { workspaceId: 'images', groupId: 'img-dimensions', utilityId: 'img-resize' }
    }));
  });
  await sleep(500);

  // Mark one tab with hasWork/hasFiles to display the dot indicator
  await win.evaluate(() => {
    // Dispatch custom event or modify tab attribute
    const tabEl = document.querySelectorAll('.toiloki-tab-item')[1];
    if (tabEl) {
      const dot = document.createElement('span');
      dot.className = 'toiloki-tab-dot';
      tabEl.insertBefore(dot, tabEl.querySelector('.toiloki-tab-title'));
    }
  });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-three-tabs-1280x720-dark.png') });
  console.log('  ✓ Captured: 05-three-tabs-1280x720-dark.png');

  // ─── 6. Close Tab & 10s Undo Toast ───
  // Close the current active tab
  await win.keyboard.press('Control+w');
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-tab-closed-undo-toast-dark.png') });
  console.log('  ✓ Captured: 06-tab-closed-undo-toast-dark.png');

  // ─── 7. Compact / Minimum Desktop View (800x560 Dark) ───
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-window-800x560-dark.png') });
  console.log('  ✓ Captured: 07-window-800x560-dark.png');

  // ─── 8. Switch to Light Mode ───
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    const raw = localStorage.getItem('toiloki_settings');
    const s = raw ? JSON.parse(raw) : {};
    s.theme = 'light';
    localStorage.setItem('toiloki_settings', JSON.stringify(s));
  });
  await sleep(400);

  // 1280x720 Light
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-titlebar-1280x720-light.png') });
  console.log('  ✓ Captured: 08-titlebar-1280x720-light.png');

  // Search Panel Light with query
  await win.locator('.ecommerce-search-input').click();
  await win.locator('.ecommerce-search-input').fill('merge');
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-search-panel-query-light.png') });
  console.log('  ✓ Captured: 09-search-panel-query-light.png');

  await win.keyboard.press('Escape');
  await sleep(300);

  // 800x560 Light
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-window-800x560-light.png') });
  console.log('  ✓ Captured: 10-window-800x560-light.png');

  await app.close();
  console.log('All Phase 1 screenshots captured successfully in screenshots/phase1/!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
