// scripts/capture-phase2-screens.cjs
const { _electron: electron } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');
const OUT_DIR = path.join(ROOT, 'screenshots', 'phase2-v2');

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

  // 1280x720 Dark
  await win.setViewportSize({ width: 1280, height: 720 });
  await win.evaluate(() => { window.location.hash = '#/text/case-conversion'; });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '01-text-empty-dark-1280x720.png') });

  await win.evaluate(() => { window.location.hash = '#/data/data-csv-viewer'; });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '02-data-empty-dark-1280x720.png') });

  await win.evaluate(() => { window.location.hash = '#/security/sec-password-gen'; });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '03-security-slider-dark-1280x720.png') });

  // 800x560 Dark
  await win.setViewportSize({ width: 800, height: 560 });
  await win.evaluate(() => { window.location.hash = '#/text/case-conversion'; });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: path.join(OUT_DIR, '04-text-empty-dark-800x560.png') });

  // 1280x720 Light
  await win.setViewportSize({ width: 1280, height: 720 });
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    window.location.hash = '#/text/case-conversion';
  });
  await win.waitForTimeout(800);
  await win.screenshot({ path: path.join(OUT_DIR, '05-text-empty-light-1280x720.png') });

  // 800x560 Light
  await win.setViewportSize({ width: 800, height: 560 });
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    window.location.hash = '#/security/sec-password-gen';
  });
  await win.waitForTimeout(800);
  await win.screenshot({ path: path.join(OUT_DIR, '06-security-light-800x560.png') });

  await app.close();
  console.log('Phase 2 screenshots captured successfully in screenshots/phase2-v2/');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
