'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase5-data');
const TMP_DIR = path.join(ROOT, '.tmp');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');
const SAMPLE_CSV_PATH = path.join(TMP_DIR, 'Financial_Metrics.csv');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Preparing sample CSV for Phase 5A screenshots...');
  const sampleCsvContent = `Account ID,Region,Quarter,Revenue,Active Users,Growth Rate
00142,North America,Q1 2026,145200.50,1850,12.4%
00143,Europe,Q1 2026,98400.00,1240,8.2%
00144,Asia Pacific,Q1 2026,215000.75,3420,24.6%
00145,Latin America,Q1 2026,45800.20,620,15.1%
00146,Middle East,Q1 2026,67200.00,890,11.0%
`;
  fs.writeFileSync(SAMPLE_CSV_PATH, sampleCsvContent, 'utf8');

  console.log('Launching Electron to capture Phase 5A screenshots...');
  const app = await electron.launch({
    args: [ELECTRON_MAIN],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SERVE_DIST: '1',
    },
    timeout: 25000,
  });

  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // Clean localStorage
  await win.evaluate(() => {
    localStorage.setItem('toiloki_intro_completed', 'true');
    localStorage.setItem('toiloki_sidebar_collapsed', 'false');
    const settings = {
      theme: 'dark',
      buttonCardStyle: 'plain',
      visibleWorkspaces: [
        'pdf', 'documents', 'images', 'data', 'text', 'developer',
        'calculator', 'files', 'security', 'media', 'network', 'design', 'system'
      ],
    };
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
    localStorage.removeItem('toiloki_active_sessions');
    localStorage.removeItem('toiloki_resume_sessions');
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  await win.reload();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // 1. Navigate to Data Workspace
  console.log('Navigating to Data workspace...');
  const dataNavBtn = win.locator('button[data-nav="data"]');
  if (await dataNavBtn.isVisible()) {
    await dataNavBtn.click();
    await sleep(600);
  }

  // ─── Screen 1: Data Workspace Hub Dark 1280x720 ───
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-data-workspace-dark-1280x720.png') });
  console.log('  ✓ Captured: 01-data-workspace-dark-1280x720.png');

  // ─── Screen 2: CSV Viewer / Data Grid ───
  console.log('Opening CSV Viewer / Converter...');
  const csvCard = win.locator('.tool-card:has-text("CSV"), .utility-card:has-text("CSV")').first();
  if (await csvCard.isVisible()) {
    await csvCard.click();
    await sleep(600);
  } else {
    const firstCard = win.locator('.tool-card, .utility-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await sleep(600);
    }
  }

  // Drop sample CSV
  const dropInput = win.locator('.workbench-empty-dropzone-wrapper input[type="file"], input[type="file"]').first();
  if (await dropInput.isVisible()) {
    await dropInput.setInputFiles([SAMPLE_CSV_PATH]);
    await sleep(1500);
  }

  // Open Columns Menu if available
  const columnsBtn = win.locator('.btn-columns-menu').first();
  if (await columnsBtn.isVisible()) {
    await columnsBtn.click();
    await sleep(400);
  }

  // Data Grid Dark 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-data-grid-columns-dark-1280x720.png') });
  console.log('  ✓ Captured: 02-data-grid-columns-dark-1280x720.png');

  // Close Columns dropdown by clicking body or re-clicking
  if (await columnsBtn.isVisible()) {
    await columnsBtn.click();
    await sleep(300);
  }

  // Data Grid Dark 800x560
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-data-grid-dark-800x560.png') });
  console.log('  ✓ Captured: 03-data-grid-dark-800x560.png');

  // Switch to Light Mode
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);

  // Data Grid Light 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-data-grid-light-1280x720.png') });
  console.log('  ✓ Captured: 04-data-grid-light-1280x720.png');

  // Switch back to Dark Mode
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  await app.close();
  console.log('Phase 5A screenshots captured successfully.');
}

run().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
