'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase6-security');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Launching Electron to capture Phase 6C (Security & Privacy) screenshots...');
  const app = await electron.launch({
    args: [ELECTRON_MAIN],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SERVE_DIST: '1',
    },
    timeout: 30000,
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

  const openTool = async (utilId) => {
    await win.evaluate((id) => {
      window.location.hash = `#/security/${id}`;
    }, utilId);
    await sleep(800);
  };

  // 1. Password Generator (Dark 1280x720)
  await win.setViewportSize({ width: 1280, height: 720 });
  await openTool('sec-password-generator');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-password-gen-dark-1280.png') });
  console.log('Saved: security-password-gen-dark-1280.png');

  // 2. Password Generator (Light 1280x720)
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-password-gen-light-1280.png') });
  console.log('Saved: security-password-gen-light-1280.png');

  // Switch back to dark theme
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  // 3. Compact Viewport (Dark 800x560)
  await win.setViewportSize({ width: 800, height: 560 });
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-compact-dark-800.png') });
  console.log('Saved: security-compact-dark-800.png');

  // 4. Compact Viewport (Light 800x560)
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-compact-light-800.png') });
  console.log('Saved: security-compact-light-800.png');

  // Switch back to dark theme and 1280x720
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(300);

  // 5. File Encrypt & Decrypt
  await openTool('sec-file-encrypt');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-file-encrypt-dark-1280.png') });
  console.log('Saved: security-file-encrypt-dark-1280.png');

  // 6. Secure Shred
  await openTool('sec-secure-shred');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-secure-shred-dark-1280.png') });
  console.log('Saved: security-secure-shred-dark-1280.png');

  // 7. Checksum Verifier
  await openTool('sec-checksum-verifier');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-checksum-verifier-dark-1280.png') });
  console.log('Saved: security-checksum-verifier-dark-1280.png');

  // 8. TOTP Generator
  await openTool('sec-totp-generator');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-totp-generator-dark-1280.png') });
  console.log('Saved: security-totp-generator-dark-1280.png');

  // 9. PEM / Certificate Decoder
  await openTool('sec-cert-decoder');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-cert-decoder-dark-1280.png') });
  console.log('Saved: security-cert-decoder-dark-1280.png');

  // 10. Text Redaction
  await openTool('sec-text-redaction');
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, 'security-text-redaction-dark-1280.png') });
  console.log('Saved: security-text-redaction-dark-1280.png');

  await app.close();
  console.log('Phase 6C screenshots successfully captured and saved to:', SCREENSHOTS_DIR);
}

run().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
