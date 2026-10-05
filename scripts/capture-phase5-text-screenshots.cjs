'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase5-text');
const TMP_DIR = path.join(ROOT, '.tmp');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');
const SAMPLE_TEXT_PATH = path.join(TMP_DIR, 'Engineering_Notes.txt');

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
  console.log('Preparing sample text with emojis for Phase 5B screenshots...');
  const sampleContent = `Toiloki Suite 2026 🚀
Contact: dev@toiloki.org or security@toiloki.org
Server host: 192.168.1.1 on 10/06/2026
Family emoji test: 👨‍👩‍👧‍👦
Combining character: e\u0301 (café au lait)
Special URL: https://toiloki.app/docs

Features:
- Pure local-first processing
- Zero telemetry or network leaks
- High performance on large files
`;
  fs.writeFileSync(SAMPLE_TEXT_PATH, sampleContent, 'utf8');

  console.log('Launching Electron to capture Phase 5B screenshots...');
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

  // 1. Navigate to Text Workspace
  console.log('Navigating to Text workspace...');
  const textNavBtn = win.locator('button[data-nav="text"]');
  if (await textNavBtn.isVisible()) {
    await textNavBtn.click();
    await sleep(600);
  }

  // ─── Screen 1: Text Workspace Hub Dark 1280x720 ───
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-text-workspace-dark-1280x720.png') });
  console.log('  ✓ Captured: 01-text-workspace-dark-1280x720.png');

  // ─── Screen 2: Case Converter / Text Editor ───
  console.log('Opening Text Case Converter / Editor...');
  const textCard = win.locator('.tool-card:has-text("Case"), .utility-card:has-text("Case")').first();
  if (await textCard.isVisible()) {
    await textCard.click();
    await sleep(600);
  } else {
    const firstCard = win.locator('.tool-card, .utility-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await sleep(600);
    }
  }

  // Drop sample text
  const dropInput = win.locator('.workbench-empty-dropzone-wrapper input[type="file"], input[type="file"]').first();
  if (await dropInput.isVisible()) {
    await dropInput.setInputFiles([SAMPLE_TEXT_PATH]);
    await sleep(1500);
  }

  // Switch to Split View mode
  const splitTab = win.locator('.view-mode-tab:has-text("Split")');
  if (await splitTab.isVisible()) {
    await splitTab.click();
    await sleep(400);
  }

  // Trigger UPPER case chip in split view
  const upperChip = win.locator('.split-case-bar .action-btn-chip:has-text("UPPER")').first();
  if (await upperChip.isVisible()) {
    await upperChip.click();
    await sleep(300);
  }

  // Text Split View Dark 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-text-split-view-dark-1280x720.png') });
  console.log('  ✓ Captured: 02-text-split-view-dark-1280x720.png');

  // Text Split View Dark 800x560
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-text-split-view-dark-800x560.png') });
  console.log('  ✓ Captured: 03-text-split-view-dark-800x560.png');

  // Switch to Light Mode
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);

  // Text Split View Light 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-text-split-view-light-1280x720.png') });
  console.log('  ✓ Captured: 04-text-split-view-light-1280x720.png');

  // Switch back to Dark Mode
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  // Switch to Analysis & Stats View
  const analysisTab = win.locator('.view-mode-tab:has-text("Analysis")');
  if (await analysisTab.isVisible()) {
    await analysisTab.click();
    await sleep(400);
    await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-text-analysis-stats-dark-1280x720.png') });
    console.log('  ✓ Captured: 05-text-analysis-stats-dark-1280x720.png');
  }

  await app.close();
  console.log('Phase 5B screenshots captured successfully.');
}

run().catch((err) => {
  console.error('Failed to capture text screenshots:', err);
  process.exit(1);
});
