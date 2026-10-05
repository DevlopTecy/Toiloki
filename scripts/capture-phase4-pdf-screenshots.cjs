'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase4-pdf');
const TMP_DIR = path.join(ROOT, '.tmp');
const ELECTRON_MAIN = path.join(ROOT, 'electron', 'main.cjs');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createSamplePdf(filePath, title, numPages) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= numPages; i++) {
    const page = doc.addPage([595.28, 841.89]); // A4
    // Header bar
    page.drawRectangle({
      x: 40,
      y: 770,
      width: 515.28,
      height: 35,
      color: rgb(0.12, 0.12, 0.14),
    });
    page.drawText(`${title} — Page ${i}`, {
      x: 55,
      y: 782,
      size: 14,
      font: font,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Content body lines
    page.drawText(`Toiloki Suite Document Artifact`, {
      x: 55,
      y: 720,
      size: 18,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(`Offline verified local PDF processing test fixture.`, {
      x: 55,
      y: 690,
      size: 12,
      font: bodyFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Decorative page box
    page.drawRectangle({
      x: 55,
      y: 200,
      width: 485,
      height: 450,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
      color: rgb(0.98, 0.98, 0.98),
    });

    page.drawText(`Page content ${i} of ${numPages}`, {
      x: 200,
      y: 420,
      size: 24,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Footer
    page.drawText(`Sheet ${i} / ${numPages} · Toiloki Engine`, {
      x: 55,
      y: 50,
      size: 10,
      font: bodyFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await doc.save();
  fs.writeFileSync(filePath, pdfBytes);
}

async function run() {
  console.log('Generating sample PDFs for Phase 4A screenshots...');
  const samplePdf = path.join(TMP_DIR, 'Quarterly_Report_2026.pdf');
  await createSamplePdf(samplePdf, 'Quarterly Report 2026', 4);

  console.log('Launching Electron to capture Phase 4A screenshots...');
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

  // Setup clean localStorage (dark theme, clear old session state)
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

  // 1. Navigate to PDF Workspace
  const pdfNavBtn = win.locator('button[data-nav="pdf"]');
  if (await pdfNavBtn.isVisible()) {
    await pdfNavBtn.click();
    await sleep(600);
  }

  // ─── Screen 1: Split PDF (Markers & Planned Outputs Preview) ───
  console.log('Capturing Split PDF screens...');
  const organizeMenu = win.locator('.workbench-menu-btn:has-text("Organize")');
  if (await organizeMenu.isVisible()) {
    await organizeMenu.click();
    await sleep(300);
    const splitItem = win.locator('.workbench-dropdown-item:has-text("Split PDF")');
    if (await splitItem.isVisible()) {
      await splitItem.click();
      await sleep(400);
    }
  }

  // Drop sample file
  const dropInput = win.locator('.workbench-empty-dropzone-wrapper input[type="file"]');
  if (await dropInput.isVisible()) {
    await dropInput.setInputFiles([samplePdf]);
    await sleep(1500);
  }

  // Dark 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-split-pdf-preview-dark-1280x720.png') });
  console.log('  ✓ Captured: 01-split-pdf-preview-dark-1280x720.png');

  // Dark 800x560
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-split-pdf-preview-dark-800x560.png') });
  console.log('  ✓ Captured: 02-split-pdf-preview-dark-800x560.png');

  // Switch to Light Mode
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);

  // Light 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-split-pdf-preview-light-1280x720.png') });
  console.log('  ✓ Captured: 03-split-pdf-preview-light-1280x720.png');

  // Light 800x560
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-split-pdf-preview-light-800x560.png') });
  console.log('  ✓ Captured: 04-split-pdf-preview-light-800x560.png');

  // Switch back to Dark Mode
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  // ─── Screen 2: Compress PDF (3 Preset Tiles & Numeric Feedback) ───
  console.log('Capturing Compress PDF screens...');
  const optimizeMenu = win.locator('.workbench-menu-btn:has-text("Optimize")');
  if (await optimizeMenu.isVisible()) {
    await optimizeMenu.click();
    await sleep(300);
    const compressItem = win.locator('.workbench-dropdown-item:has-text("Compress PDF")');
    if (await compressItem.isVisible()) {
      await compressItem.click();
      await sleep(500);
    }
  }

  // Dark 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-compress-pdf-presets-dark-1280x720.png') });
  console.log('  ✓ Captured: 05-compress-pdf-presets-dark-1280x720.png');

  // Dark 800x560
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-compress-pdf-presets-dark-800x560.png') });
  console.log('  ✓ Captured: 06-compress-pdf-presets-dark-800x560.png');

  // Light 1280x720
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await sleep(300);
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-compress-pdf-presets-light-1280x720.png') });
  console.log('  ✓ Captured: 07-compress-pdf-presets-light-1280x720.png');

  // ─── Screen 3: Crop Pages (Scope: All vs Selected) ───
  console.log('Capturing Crop Pages screens...');
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await sleep(300);

  if (await organizeMenu.isVisible()) {
    await organizeMenu.click();
    await sleep(300);
    const cropItem = win.locator('.workbench-dropdown-item:has-text("Crop")');
    if (await cropItem.isVisible()) {
      await cropItem.click();
      await sleep(500);
    }
  }

  // Dark 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-crop-pages-scope-dark-1280x720.png') });
  console.log('  ✓ Captured: 08-crop-pages-scope-dark-1280x720.png');

  // Dark 800x560
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(300);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-crop-pages-scope-dark-800x560.png') });
  console.log('  ✓ Captured: 09-crop-pages-scope-dark-800x560.png');

  console.log('Closing Electron...');
  await app.close();
  console.log('Phase 4A screenshot capture complete!');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
