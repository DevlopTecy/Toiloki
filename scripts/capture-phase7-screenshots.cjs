'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase7');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Launching Electron to capture Phase 7 (Media, Network, Design, System) screenshots...');
  const app = await electron.launch({
    args: [ELECTRON_MAIN],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SERVE_DIST: '1',
    },
    timeout: 35000,
  });

  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // Configure settings and initial dark theme
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

  const openTool = async (workspaceId, utilId) => {
    await win.evaluate(([ws, id]) => {
      window.location.hash = `#/${ws}/${id}`;
    }, [workspaceId, utilId]);
    await sleep(800);
  };

  // 1. Media: Audio Trimmer (Dark 1280x720)
  await win.setViewportSize({ width: 1280, height: 720 });
  await openTool('media', 'audio-trimmer');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'media-audio-trimmer-dark-1280.png') });
  console.log('Saved: media-audio-trimmer-dark-1280.png');

  // 2. Media: Audio Volume Fade (Dark 1280x720)
  await openTool('media', 'audio-volume-fade');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'media-volume-fade-dark-1280.png') });
  console.log('Saved: media-volume-fade-dark-1280.png');

  // 3. Network: cURL Builder (Dark 1280x720)
  await openTool('network', 'net-curl-builder');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'network-curl-builder-dark-1280.png') });
  console.log('Saved: network-curl-builder-dark-1280.png');

  // 4. Network: cURL Builder (Light 1280x720)
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'network-curl-builder-light-1280.png') });
  console.log('Saved: network-curl-builder-light-1280.png');

  // Switch back to dark
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  // 5. Network: Subnet / CIDR (Dark 1280x720)
  await openTool('network', 'net-subnet-cidr');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'network-subnet-cidr-dark-1280.png') });
  console.log('Saved: network-subnet-cidr-dark-1280.png');

  // 6. Design: Color Converter (Dark 1280x720)
  await openTool('design', 'design-color-converter');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'design-color-converter-dark-1280.png') });
  console.log('Saved: design-color-converter-dark-1280.png');

  // 7. Design: Palette Generator (Dark 1280x720)
  await openTool('design', 'design-palette-generator');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'design-palette-gen-dark-1280.png') });
  console.log('Saved: design-palette-gen-dark-1280.png');

  // 8. Design: Contrast Checker (Light 1280x720)
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);
  await openTool('design', 'design-contrast-checker');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'design-contrast-checker-light-1280.png') });
  console.log('Saved: design-contrast-checker-light-1280.png');

  // Switch back to dark
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  // 9. System: System Info Report (Dark 1280x720)
  await openTool('system', 'sys-system-info-report');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'system-info-report-dark-1280.png') });
  console.log('Saved: system-info-report-dark-1280.png');

  // 10. System: Environment Variables Viewer (Dark 1280x720)
  await openTool('system', 'sys-env-vars-viewer');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'system-env-vars-dark-1280.png') });
  console.log('Saved: system-env-vars-dark-1280.png');

  // 11. Compact Viewport (Dark 800x560)
  await win.setViewportSize({ width: 800, height: 560 });
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'system-compact-dark-800.png') });
  console.log('Saved: system-compact-dark-800.png');

  await app.close();
  console.log('Phase 7 screenshots successfully captured and saved to:', SCREENSHOTS_DIR);
}

run().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
