// scripts/capture-phase1-gallery.cjs
'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');
const OUTPUT_DIR = path.join(ROOT, 'screenshots', 'phase1-uikit-v2');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function capture() {
  console.log('Launching Electron to capture Phase 1 UI Kit V2 screenshots...');

  const app = await electron.launch({
    args: [ELECTRON_MAIN],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SERVE_DIST: '1',
    },
    timeout: 45000,
  });

  const win = await app.firstWindow();

  win.on('pageerror', (err) => console.error(`  [PAGE ERROR] ${err.message}`));
  win.on('console', (msg) => {
    if (msg.type() === 'error') console.warn(`  [CONSOLE] ${msg.text()}`);
  });

  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // Initialize settings to dark mode with developer suite enabled
  await win.evaluate(() => {
    localStorage.setItem('toiloki_intro_completed', 'true');
    localStorage.setItem('toiloki_sidebar_collapsed', 'false');
    const settings = {
      theme: 'dark',
      activeThemeId: 'default-clean',
      showDeveloper: true,
      buttonCardStyle: 'plain',
      visibleWorkspaces: [
        'pdf', 'documents', 'images', 'data', 'text', 'developer',
        'calculator', 'files', 'security', 'media', 'network', 'design', 'system'
      ],
    };
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  await win.reload();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // Capture Main App Shell (1280x720 Dark)
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(500);
  await win.screenshot({ path: path.join(OUTPUT_DIR, '01-app-shell-1280x720-dark.png') });
  console.log('Captured: 01-app-shell-1280x720-dark.png');

  // Navigate to Settings
  await win.click('button[data-nav="settings"]');
  await sleep(600);

  // Navigate to Advanced tab in Settings
  await win.click('button[data-settings-nav="advanced"]');
  await sleep(600);

  // Click Component gallery button
  const galleryBtn = win.locator('button:has-text("Component gallery")').first();
  await galleryBtn.click();
  await sleep(800);

  // Capture Gallery 1280x720 Dark
  await win.screenshot({ path: path.join(OUTPUT_DIR, '02-gallery-1280x720-dark.png') });
  console.log('Captured: 02-gallery-1280x720-dark.png');

  // Toggle Theme in Gallery to Light
  const themeToggle = win.locator('button:has-text("Light Theme")').first();
  await themeToggle.click();
  await win.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await sleep(600);

  // Capture Gallery 1280x720 Light
  await win.screenshot({ path: path.join(OUTPUT_DIR, '03-gallery-1280x720-light.png') });
  console.log('Captured: 03-gallery-1280x720-light.png');

  // Resize to 800x560 Light
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(500);
  await win.screenshot({ path: path.join(OUTPUT_DIR, '04-gallery-800x560-light.png') });
  console.log('Captured: 04-gallery-800x560-light.png');

  // Toggle back to Dark Theme at 800x560
  const darkToggle = win.locator('button:has-text("Dark Theme")').first();
  await darkToggle.click();
  await win.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await sleep(600);

  // Capture Gallery 800x560 Dark
  await win.screenshot({ path: path.join(OUTPUT_DIR, '05-gallery-800x560-dark.png') });
  console.log('Captured: 05-gallery-800x560-dark.png');

  await app.close();
  console.log('All Phase 1 screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
