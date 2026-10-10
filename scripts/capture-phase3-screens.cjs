// scripts/capture-phase3-screens.cjs
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');
const OUT_DIR = path.join(ROOT, 'screenshots', 'phase3-v2');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  const app = await electron.launch({
    args: [ELECTRON_MAIN],
    env: { ...process.env, SERVE_DIST: '1' },
  });

  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await win.waitForTimeout(1500);

  // 1. 1280x720 Dark - Archetype A: Security Password Generator
  await win.setViewportSize({ width: 1280, height: 720 });
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    window.location.hash = '#/security/sec-password-generator';
  });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '01-sec-archetype-a-dark-1280x720.png') });

  // 2. 1280x720 Dark - Archetype B: Network URL Builder
  await win.evaluate(() => { window.location.hash = '#/network/net-url-builder'; });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '02-network-archetype-b-dark-1280x720.png') });

  // 3. 1280x720 Dark - Archetype E: Developer JSON Formatter
  await win.evaluate(() => { window.location.hash = '#/developer/format-json-code'; });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '03-developer-archetype-e-dark-1280x720.png') });

  // 4. 1280x720 Dark - Archetype B: Calculator Date Difference
  await win.evaluate(() => { window.location.hash = '#/calculator/calc-date-diff'; });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '04-calculator-archetype-b-dark-1280x720.png') });

  // 5. 800x560 Dark - Compact View
  await win.setViewportSize({ width: 800, height: 560 });
  await win.evaluate(() => { window.location.hash = '#/developer/format-json-code'; });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '05-developer-compact-dark-800x560.png') });

  // 6. 1280x720 Light - Archetype A: Security Password Generator
  await win.setViewportSize({ width: 1280, height: 720 });
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    window.location.hash = '#/security/sec-password-generator';
  });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '06-sec-archetype-a-light-1280x720.png') });

  // 7. 800x560 Light - Compact View
  await win.setViewportSize({ width: 800, height: 560 });
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    window.location.hash = '#/calculator/calc-date-diff';
  });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '07-calculator-compact-light-800x560.png') });

  await app.close();
  console.log('Phase 3 screenshots captured successfully in screenshots/phase3-v2/');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
