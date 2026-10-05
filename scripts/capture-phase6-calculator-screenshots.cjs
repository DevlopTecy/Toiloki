'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase6-calculator');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Launching Electron to capture Phase 6A (Calculator & Converters) screenshots...');
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

  // Setup localStorage for calculator workspace
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
    localStorage.setItem('toiloki_calc_history', JSON.stringify([
      '100 + 10% = 110',
      '0.1 + 0.2 = 0.3',
      '25 * 4 = 100'
    ]));
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  await win.reload();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // Helper to navigate to a calculator utility
  const openTool = async (utilId) => {
    await win.evaluate((id) => {
      window.location.hash = `#/calculator/${id}`;
    }, utilId);
    await sleep(800);
  };

  // 1. Basic Calculator 1280x720 Dark
  await win.setViewportSize({ width: 1280, height: 720 });
  await openTool('calc-basic');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'calc-basic-dark-1280.png') });
  console.log('Saved: calc-basic-dark-1280.png');

  // 2. Basic Calculator 1280x720 Light
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'calc-basic-light-1280.png') });
  console.log('Saved: calc-basic-light-1280.png');

  // Switch back to Dark
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  // 3. Scientific Calculator 1280x720 Dark
  await openTool('calc-trig-logs');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'calc-scientific-dark-1280.png') });
  console.log('Saved: calc-scientific-dark-1280.png');

  // 4. Unit Converter 1280x720 Dark
  await openTool('unit-converter-all');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'calc-unit-dark-1280.png') });
  console.log('Saved: calc-unit-dark-1280.png');

  // 5. Loan / EMI Calculator 1280x720 Dark
  await openTool('calc-loan-emi');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'calc-loan-dark-1280.png') });
  console.log('Saved: calc-loan-dark-1280.png');

  // 6. Amortization Schedule 1280x720 Dark
  await openTool('calc-amortization');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'calc-amortization-dark-1280.png') });
  console.log('Saved: calc-amortization-dark-1280.png');

  // 7. Compact 800x560 Dark
  await win.setViewportSize({ width: 800, height: 560 });
  await openTool('calc-basic');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'calc-compact-dark-800.png') });
  console.log('Saved: calc-compact-dark-800.png');

  // 8. Compact 800x560 Light
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'calc-compact-light-800.png') });
  console.log('Saved: calc-compact-light-800.png');

  await app.close();
  console.log('Phase 6A Calculator & Converters screenshot capture complete!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
