'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase2');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Launching Electron to capture Phase 2 screenshots...');
  const app = await electron.launch({
    args: [ELECTRON_MAIN],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SERVE_DIST: '1',
    },
    timeout: 20000,
  });

  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // Pre-seed clean localStorage settings with active session for resume row
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

    // Seed mock active session and resume row
    const sessions = {
      'tab-pdf:pdf': {
        tabId: 'tab-pdf',
        workspaceId: 'pdf',
        groupId: 'pdf-merger',
        utilityId: 'merge-pdf',
        files: [
          { name: 'Financial_Quarterly_Q3.pdf', size: 1450200, type: 'application/pdf' },
          { name: 'Summary_Deck_2026.pdf', size: 980400, type: 'application/pdf' },
        ],
        versionStack: [
          { id: 'v0', name: 'Original', timestamp: Date.now() - 60000 },
        ],
        versionIndex: 0,
        options: {},
        updatedAt: Date.now() - 30000,
      },
    };
    localStorage.setItem('toiloki_active_sessions', JSON.stringify(sessions));

    const resumeList = [
      {
        id: 'tab-pdf:pdf',
        tabId: 'tab-pdf',
        workspaceId: 'pdf',
        groupId: 'pdf-merger',
        utilityId: 'merge-pdf',
        title: 'Financial_Quarterly_Q3.pdf',
        summary: '2 files in PDF',
        fileCount: 2,
        timestamp: Date.now() - 30000,
      },
    ];
    localStorage.setItem('toiloki_resume_sessions', JSON.stringify(resumeList));
  });

  await win.reload();
  await win.waitForLoadState('domcontentloaded');
  await sleep(1500);

  // ─── 1. Home Quick Actions (56px tiles, auto-fill grid) (Dark 1280x720) ───
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-home-quick-actions-56px-dark-1280x720.png') });
  console.log('  ✓ Captured: 01-home-quick-actions-56px-dark-1280x720.png');

  // ─── 2. Home Resume Session Row (Dark 1280x720) ───
  await win.evaluate(() => {
    const el = document.querySelector('.unsaved-resume-row');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-home-resume-session-row-dark-1280x720.png') });
  console.log('  ✓ Captured: 02-home-resume-session-row-dark-1280x720.png');

  // ─── 3. Switch to PDF Workspace, Add File, Verify Tab Dot (Dark 1280x720) ───
  const pdfNavBtn = win.locator('button[data-nav="pdf"]');
  await pdfNavBtn.click();
  await sleep(600);

  // Trigger file simulation or session event in PDF
  await win.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('toiloki-session-updated', {
        detail: { tabId: 'tab-pdf', workspaceId: 'pdf', hasFiles: true, fileCount: 2 },
      })
    );
  });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-tab-dot-unsaved-work-dark-1280x720.png') });
  console.log('  ✓ Captured: 03-tab-dot-unsaved-work-dark-1280x720.png');

  // ─── 4. Switch to Light Theme & 3:1 Border Strong Controls (1280x720) ───
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    const settings = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
    settings.theme = 'light';
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
  });
  await sleep(400);

  // Return to Home in Light Theme
  const homeNavBtn = win.locator('button[data-nav="home"]');
  await homeNavBtn.click();
  await sleep(500);

  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-home-3to1-borders-light-1280x720.png') });
  console.log('  ✓ Captured: 04-home-3to1-borders-light-1280x720.png');

  // ─── 5. Responsive Viewport (Dark 800x560) ───
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const settings = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
    settings.theme = 'dark';
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
  });
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(500);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-responsive-home-dark-800x560.png') });
  console.log('  ✓ Captured: 05-responsive-home-dark-800x560.png');

  // ─── 6. Responsive Viewport (Light 800x560) ───
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    const settings = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
    settings.theme = 'light';
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
  });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-responsive-home-light-800x560.png') });
  console.log('  ✓ Captured: 06-responsive-home-light-800x560.png');

  console.log('All Phase 2 screenshots captured successfully in screenshots/phase2/!');
  await app.close();
}

run().catch((err) => {
  console.error('Error capturing Phase 2 screenshots:', err);
  process.exit(1);
});
