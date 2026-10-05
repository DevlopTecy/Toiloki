'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase4-documents');
const TMP_DIR = path.join(ROOT, '.tmp');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');
const SAMPLE_MD_PATH = path.join(TMP_DIR, 'Engineering_Review.md');

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
  console.log('Preparing sample markdown document for Phase 4C screenshots...');
  const sampleMdContent = `# Quarterly Engineering Review 2026

## Overview
Toiloki is an offline-first desktop utility suite engineered for maximum privacy and deterministic reliability.

- Fast startup under 800ms with low memory footprint
- Zero telemetry, network calls, or cloud dependencies
- Pure local processing across all 13 core workspaces

## Key Capabilities
We completed the **Documents Workspace** with live markdown preview, two-way synchronized scrolling, multi-modifier find and replace, and dual-pane diff comparison.

\`\`\`ts
const diff = DocumentEngine.computeDiff(docA, docB, { ignoreWhitespace: true });
console.log(\`Additions: \${diff.data.additions}, Deletions: \${diff.data.deletions}\`);
\`\`\`

### Roadmap Milestones
1. PDF and Images Workspaces complete
2. Documents Workspace complete with OpenXML support
3. Data and Developer Tools next
`;
  fs.writeFileSync(SAMPLE_MD_PATH, sampleMdContent, 'utf8');

  console.log('Launching Electron to capture Phase 4C screenshots...');
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

  // 1. Navigate to Documents Workspace
  console.log('Navigating to Documents workspace...');
  const docNavBtn = win.locator('button[data-nav="documents"]');
  if (await docNavBtn.isVisible()) {
    await docNavBtn.click();
    await sleep(600);
  }

  // ─── Screen 1: Documents Workspace Hub Dark 1280x720 ───
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-documents-workspace-dark-1280x720.png') });
  console.log('  ✓ Captured: 01-documents-workspace-dark-1280x720.png');

  // ─── Screen 2: Markdown Editor Split View ───
  console.log('Opening Markdown Editor...');
  const mdCard = win.locator('.tool-card:has-text("Markdown Editor"), .utility-card:has-text("Markdown Editor")').first();
  if (await mdCard.isVisible()) {
    await mdCard.click();
    await sleep(600);
  } else {
    const firstCard = win.locator('.tool-card, .utility-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await sleep(600);
    }
  }

  // Drop sample markdown document
  const dropInput = win.locator('.workbench-empty-dropzone-wrapper input[type="file"], input[type="file"]').first();
  if (await dropInput.isVisible()) {
    await dropInput.setInputFiles([SAMPLE_MD_PATH]);
    await sleep(1500);
  }

  // Markdown Editor Dark 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-markdown-editor-split-dark-1280x720.png') });
  console.log('  ✓ Captured: 02-markdown-editor-split-dark-1280x720.png');

  // Markdown Editor Dark 800x560
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-markdown-editor-split-dark-800x560.png') });
  console.log('  ✓ Captured: 03-markdown-editor-split-dark-800x560.png');

  // Switch to Light Mode
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);

  // Markdown Editor Light 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-markdown-editor-split-light-1280x720.png') });
  console.log('  ✓ Captured: 04-markdown-editor-split-light-1280x720.png');

  // Switch back to Dark Mode
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  // ─── Screen 5: Document Diff Utility ───
  console.log('Opening Document Diff utility...');
  const compareMenu = win.locator('.workbench-menu-btn:has-text("Compare")');
  if (await compareMenu.isVisible()) {
    await compareMenu.click();
    await sleep(300);
    const diffItem = win.locator('.workbench-dropdown-item:has-text("Document Diff")');
    if (await diffItem.isVisible()) {
      await diffItem.click();
      await sleep(500);
    }
  }

  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-document-diff-dark-1280x720.png') });
  console.log('  ✓ Captured: 05-document-diff-dark-1280x720.png');

  await app.close();
  console.log('All Phase 4C screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
