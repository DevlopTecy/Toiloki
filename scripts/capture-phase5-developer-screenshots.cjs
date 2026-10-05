'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase5-developer');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Launching Electron to capture Phase 5C (Developer Workspace) screenshots...');
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

  // Setup localStorage for developer workspace
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

  // Helper to navigate to a developer utility
  const openTool = async (utilId) => {
    await win.evaluate((id) => {
      window.location.hash = `#/developer/${id}`;
    }, utilId);
    await sleep(800);
  };

  // 1. JSON Formatter 1280x720 Dark
  await win.setViewportSize({ width: 1280, height: 720 });
  await openTool('dev-formatter');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dev-formatter-dark-1280.png') });
  console.log('Saved: dev-formatter-dark-1280.png');

  // 2. JSON Formatter 1280x720 Light
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dev-formatter-light-1280.png') });
  console.log('Saved: dev-formatter-light-1280.png');

  // Switch back to Dark
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  // 3. JWT Inspector 1280x720 Dark
  await openTool('dev-jwt');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dev-jwt-dark-1280.png') });
  console.log('Saved: dev-jwt-dark-1280.png');

  // 4. Cron Explainer 1280x720 Dark
  await openTool('dev-cron-explainer');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dev-cron-dark-1280.png') });
  console.log('Saved: dev-cron-dark-1280.png');

  // 5. chmod Calculator 1280x720 Dark
  await openTool('dev-chmod-calculator');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dev-chmod-dark-1280.png') });
  console.log('Saved: dev-chmod-dark-1280.png');

  // 6. .env Diff 1280x720 Dark
  await openTool('dev-env-diff');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dev-envdiff-dark-1280.png') });
  console.log('Saved: dev-envdiff-dark-1280.png');

  // 7. Compact 800x560 Dark
  await win.setViewportSize({ width: 800, height: 560 });
  await openTool('dev-formatter');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dev-compact-dark-800.png') });
  console.log('Saved: dev-compact-dark-800.png');

  // 8. Compact 800x560 Light
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dev-compact-light-800.png') });
  console.log('Saved: dev-compact-light-800.png');

  await app.close();
  console.log('Phase 5C Developer Workspace screenshot capture complete!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
