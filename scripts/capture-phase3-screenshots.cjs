'use strict';

const path = require('path');
const fs = require('fs');
const { _electron: electron } = require('playwright');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots', 'phase3');
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
  console.log('Generating sample PDFs for Phase 3 screenshots...');
  const fileA = path.join(TMP_DIR, 'Annual_Report_2026.pdf');
  const fileB = path.join(TMP_DIR, 'Executive_Summary.pdf');
  await createSamplePdf(fileA, 'Annual Report 2026', 3);
  await createSamplePdf(fileB, 'Executive Summary', 3);

  console.log('Launching Electron to capture Phase 3 screenshots...');
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
  await pdfNavBtn.click();
  await sleep(600);

  // 2. Select "Organize" dropdown -> "Merge PDF"
  const organizeMenuBtn = win.locator('.workbench-menu-btn:has-text("Organize")');
  if (await organizeMenuBtn.isVisible()) {
    await organizeMenuBtn.click();
    await sleep(400);
    const mergeItem = win.locator('.workbench-dropdown-item:has-text("Merge PDF")');
    if (await mergeItem.isVisible()) {
      await mergeItem.click();
      await sleep(400);
    }
  }

  // Set viewport to 1280x720
  await win.setViewportSize({ width: 1280, height: 720 });
  await sleep(400);

  // ─── Step 1: Load 1 file: verify dashed "Add another PDF to merge" card, primary hidden ───
  const dropzoneInput = win.locator('.workbench-empty-dropzone-wrapper input[type="file"]');
  await dropzoneInput.setInputFiles([fileA]);
  await sleep(1500);

  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-merge-pdf-1-file-add-card-dark-1280x720.png') });
  console.log('  ✓ Captured: 01-merge-pdf-1-file-add-card-dark-1280x720.png');

  // ─── Step 2: Add second file: verify 2 rows, live count pill, custom page ranges ───
  const trayInput = win.locator('.pdf-tray-canvas input[type="file"]');
  await trayInput.setInputFiles([fileB]);
  await sleep(1500);

  // Fill custom page ranges: Doc 1 -> "1, 3", Doc 2 -> "1-2"
  const rangeInputs = win.locator('.tray-range-input');
  if (await rangeInputs.count() >= 2) {
    await rangeInputs.nth(0).fill('1, 3');
    await rangeInputs.nth(0).dispatchEvent('change');
    await sleep(200);
    await rangeInputs.nth(1).fill('1-2');
    await rangeInputs.nth(1).dispatchEvent('change');
    await sleep(400);
  }

  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-merge-pdf-2-files-page-ranges-dark-1280x720.png') });
  console.log('  ✓ Captured: 02-merge-pdf-2-files-page-ranges-dark-1280x720.png');

  // ─── Step 3: Open "Choose pages" modal: verify real thumbnail previews & chips ───
  const choosePagesBtns = win.locator('.tray-choose-pages-btn');
  if (await choosePagesBtns.count() > 0) {
    await choosePagesBtns.nth(0).click();
    await sleep(1800); // wait for pdfThumbnailService rendering
    await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-merge-pdf-choose-pages-modal-dark-1280x720.png') });
    console.log('  ✓ Captured: 03-merge-pdf-choose-pages-modal-dark-1280x720.png');

    // Close modal
    const closeBtn = win.locator('.page-picker-close-btn');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await sleep(400);
    }
  }

  // ─── Step 4: Bottom ActionBar summary and controls ───
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-bottom-actionbar-summary-tooltip-dark-1280x720.png') });
  console.log('  ✓ Captured: 04-bottom-actionbar-summary-tooltip-dark-1280x720.png');

  // ─── Step 5: Light Theme View (1280x720) ───
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    const settings = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
    settings.theme = 'light';
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
  });
  await sleep(500);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-merge-pdf-light-1280x720.png') });
  console.log('  ✓ Captured: 05-merge-pdf-light-1280x720.png');

  // ─── Step 6: Responsive Viewport (Dark 800x560) ───
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const settings = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
    settings.theme = 'dark';
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
  });
  await win.setViewportSize({ width: 800, height: 560 });
  await sleep(500);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-merge-pdf-responsive-dark-800x560.png') });
  console.log('  ✓ Captured: 06-merge-pdf-responsive-dark-800x560.png');

  // ─── Step 7: Responsive Viewport (Light 800x560) ───
  await win.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    const settings = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
    settings.theme = 'light';
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
  });
  await sleep(400);
  await win.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-merge-pdf-responsive-light-800x560.png') });
  console.log('  ✓ Captured: 07-merge-pdf-responsive-light-800x560.png');

  console.log('All Phase 3 screenshots captured successfully in screenshots/phase3/!');
  await app.close();
}

run().catch((err) => {
  console.error('Error capturing Phase 3 screenshots:', err);
  process.exit(1);
});
