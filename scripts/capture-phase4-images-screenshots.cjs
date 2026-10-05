'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase4-images');
const TMP_DIR = path.join(ROOT, '.tmp');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');
const SAMPLE_IMAGE_SRC = path.join(ROOT, 'public', 'icon-256.png');
const SAMPLE_IMAGE_DEST = path.join(TMP_DIR, 'Product_Hero.png');

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
  console.log('Preparing sample image for Phase 4B screenshots...');
  fs.copyFileSync(SAMPLE_IMAGE_SRC, SAMPLE_IMAGE_DEST);

  console.log('Launching Electron to capture Phase 4B screenshots...');
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

  // 1. Navigate to Images Workspace
  console.log('Navigating to Images workspace...');
  const imagesNavBtn = win.locator('button[data-nav="images"]');
  if (await imagesNavBtn.isVisible()) {
    await imagesNavBtn.click();
    await sleep(600);
  }

  // ─── Screen 1: Images Workspace Hub Dark 1280x720 ───
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-images-workspace-dark-1280x720.png') });
  console.log('  ✓ Captured: 01-images-workspace-dark-1280x720.png');

  // ─── Screen 2: Image Optimizer Workbench ───
  console.log('Opening Image Optimizer...');
  const optimizerCard = win.locator('.tool-card:has-text("Image Optimizer"), .utility-card:has-text("Image Optimizer")').first();
  if (await optimizerCard.isVisible()) {
    await optimizerCard.click();
    await sleep(600);
  } else {
    // Try opening via menu or click first utility card
    const firstCard = win.locator('.tool-card, .utility-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await sleep(600);
    }
  }

  // Drop sample image
  const dropInput = win.locator('.workbench-empty-dropzone-wrapper input[type="file"], input[type="file"]').first();
  if (await dropInput.isVisible()) {
    await dropInput.setInputFiles([SAMPLE_IMAGE_DEST]);
    await sleep(1500);
  }

  // Optimizer Dark 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-image-optimizer-dark-1280x720.png') });
  console.log('  ✓ Captured: 02-image-optimizer-dark-1280x720.png');

  // Optimizer Dark 800x560
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-image-optimizer-dark-800x560.png') });
  console.log('  ✓ Captured: 03-image-optimizer-dark-800x560.png');

  // Switch to Light Mode
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);

  // Optimizer Light 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-image-optimizer-light-1280x720.png') });
  console.log('  ✓ Captured: 04-image-optimizer-light-1280x720.png');

  // Optimizer Light 800x560
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-image-optimizer-light-800x560.png') });
  console.log('  ✓ Captured: 05-image-optimizer-light-800x560.png');

  await app.close();
  console.log('All Phase 4B screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
