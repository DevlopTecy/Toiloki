'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase6-files');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Launching Electron to capture Phase 6B (Files & Archives) screenshots...');
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

  // Setup localStorage for files workspace
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
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  await win.reload();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  const openTool = async (utilId) => {
    await win.evaluate((id) => {
      window.location.hash = `#/files/${id}`;
    }, utilId);
    await sleep(800);
  };

  // 1. Batch Rename 1280x720 Dark
  await win.setViewportSize({ width: 1280, height: 720 });
  await openTool('batch-rename-files');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'files-rename-dark-1280.png') });
  console.log('Saved: files-rename-dark-1280.png');

  // 2. Batch Rename 1280x720 Light
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'files-rename-light-1280.png') });
  console.log('Saved: files-rename-light-1280.png');

  // Switch back to Dark
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  // 3. File Type & Metadata Analyzer 1280x720 Dark
  await openTool('file-type-detection');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'files-analyzer-dark-1280.png') });
  console.log('Saved: files-analyzer-dark-1280.png');

  // 4. Duplicate Finder 1280x720 Dark
  await openTool('duplicate-finder-hash');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'files-duplicates-dark-1280.png') });
  console.log('Saved: files-duplicates-dark-1280.png');

  // 5. File Hash Comparison 1280x720 Dark
  await openTool('file-compare-hashes');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'files-compare-dark-1280.png') });
  console.log('Saved: files-compare-dark-1280.png');

  // 6. Create Archive 1280x720 Dark
  await openTool('create-zip-archive');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'files-archive-create-dark-1280.png') });
  console.log('Saved: files-archive-create-dark-1280.png');

  // 7. Extract Archive 1280x720 Dark
  await openTool('extract-zip-archive');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'files-archive-extract-dark-1280.png') });
  console.log('Saved: files-archive-extract-dark-1280.png');

  // 8. Compact 800x560 Dark
  await win.setViewportSize({ width: 800, height: 560 });
  await openTool('batch-rename-files');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'files-compact-dark-800.png') });
  console.log('Saved: files-compact-dark-800.png');

  // 9. Compact 800x560 Light
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'files-compact-light-800.png') });
  console.log('Saved: files-compact-light-800.png');

  await app.close();
  console.log('Phase 6B Files & Archives screenshot capture complete!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
