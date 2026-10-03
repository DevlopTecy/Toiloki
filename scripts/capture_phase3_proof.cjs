const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const outDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

app.disableHardwareAcceleration();

async function run() {
  await app.whenReady();

  // Create valid PDF buffers
  const makePdfB64 = async (pageCount = 4, title = 'Sample Document') => {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= pageCount; i++) {
      const page = doc.addPage([595.28, 841.89]);
      page.drawText(`${title} - Page ${i}`, { x: 50, y: 800, size: 18 });
      page.drawText(`Local-first high performance processing.`, { x: 50, y: 760, size: 12 });
    }
    const bytes = await doc.save();
    return Buffer.from(bytes).toString('base64');
  };

  const sampleB64 = await makePdfB64(4, 'Quarterly Report');
  const file1B64 = await makePdfB64(3, 'Section 1');
  const file2B64 = await makePdfB64(2, 'Section 2');
  const file3B64 = await makePdfB64(4, 'Appendix');

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    frame: false,
    webPreferences: {
      offscreen: true,
      preload: path.join(__dirname, '../electron/preload.cjs'),
      contextIsolation: true,
    },
  });

  const saveShot = async (filename, delay = 1000) => {
    await new Promise((r) => setTimeout(r, delay));
    const image = await win.webContents.capturePage();
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, image.toPNG());
    console.log('Saved proof screenshot:', filename);
  };

  const distHtml = path.join(__dirname, '../dist/index.html');

  // Helper to set theme and resolution with clean reload
  const setEnvironment = async (theme = 'dark', width = 1280, height = 720) => {
    win.setSize(width, height);
    await win.webContents.executeJavaScript(`(() => {
      const s = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
      s.theme = '${theme}';
      s.activeThemeId = 'default-clean';
      s.colorMode = '${theme}';
      s.layout = 'workbench';
      localStorage.setItem('toiloki_settings', JSON.stringify(s));
    })()`);
    await win.webContents.reload();
    await new Promise((r) => setTimeout(r, 1200));
  };

  // Helper to drop a single valid PDF
  const mockDropFile = async (name = 'annual-report.pdf', b64 = sampleB64) => {
    await win.webContents.executeJavaScript(`(() => {
      const b64 = "${b64}";
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], '${name}', { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.querySelector('.file-dropzone-wrapper input[type="file"]') || document.querySelector('input[type="file"]');
      if (input) {
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 1600));
  };

  // Helper to drop multiple valid PDFs
  const mockDropMultiple = async () => {
    await win.webContents.executeJavaScript(`(() => {
      const addFile = (dt, b64, name) => {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        dt.items.add(new File([bytes], name, { type: 'application/pdf' }));
      };
      const dt = new DataTransfer();
      addFile(dt, "${file1B64}", 'report-section-1.pdf');
      addFile(dt, "${file2B64}", 'report-section-2.pdf');
      addFile(dt, "${file3B64}", 'appendix.pdf');

      const input = document.querySelector('.file-dropzone-wrapper input[type="file"]') || document.querySelector('input[type="file"]');
      if (input) {
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 1600));
  };

  console.log('Loading dist/index.html...');
  await win.loadFile(distHtml);
  await new Promise((r) => setTimeout(r, 2000));

  // Initialize Dark Theme
  await setEnvironment('dark', 1280, 720);

  // ==========================================
  // 1. PDF Pages Mode (Dark & Light, 1280x720 & 1920x1080)
  // ==========================================
  console.log('Capturing PDF Pages mode...');
  await win.webContents.executeJavaScript(`(() => {
    const btn = document.querySelector('button[data-nav="pdf"]');
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  // Select "Delete Pages" under Page Organizer (mode: pages)
  await win.webContents.executeJavaScript(`(() => {
    const btns = Array.from(document.querySelectorAll('.workbench-menu-btn'));
    const org = btns.find(b => b.textContent.includes('Page Organizer'));
    if (org) org.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));
  await win.webContents.executeJavaScript(`(() => {
    const items = Array.from(document.querySelectorAll('.workbench-dropdown-item'));
    const del = items.find(i => i.textContent.includes('Delete Pages'));
    if (del) del.click();
  })()`);
  await new Promise((r) => setTimeout(r, 500));

  // Drop a file
  await mockDropFile('Quarterly-Report.pdf');

  // Select page 2 to show floating toolbar
  await win.webContents.executeJavaScript(`(() => {
    const cards = document.querySelectorAll('.pdf-page-card');
    if (cards.length > 1) cards[1].click();
  })()`);
  await saveShot('phase3-pdf-pages-dark-1280x720.png');

  // Dark 1920x1080
  win.setSize(1920, 1080);
  await new Promise((r) => setTimeout(r, 600));
  await saveShot('phase3-pdf-pages-dark-1920x1080.png');

  // Light 1280x720
  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const btn = document.querySelector('button[data-nav="pdf"]');
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));
  await mockDropFile('Quarterly-Report.pdf');
  await win.webContents.executeJavaScript(`(() => {
    const cards = document.querySelectorAll('.pdf-page-card');
    if (cards.length > 1) cards[1].click();
  })()`);
  await saveShot('phase3-pdf-pages-light-1280x720.png');

  // Light 1920x1080
  win.setSize(1920, 1080);
  await new Promise((r) => setTimeout(r, 600));
  await saveShot('phase3-pdf-pages-light-1920x1080.png');

  // ==========================================
  // 2. Chaining Proof: Delete Pages -> Result -> Compress PDF
  // ==========================================
  console.log('Capturing Chaining Proof...');
  await setEnvironment('dark', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const btn = document.querySelector('button[data-nav="pdf"]');
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));
  await mockDropFile('Quarterly-Report.pdf');

  // Select page 2
  await win.webContents.executeJavaScript(`(() => {
    const cards = document.querySelectorAll('.pdf-page-card');
    if (cards.length > 1) cards[1].click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  // Click Delete button on floating toolbar
  await win.webContents.executeJavaScript(`(() => {
    const delBtn = document.querySelector('.floating-tool-btn.danger');
    if (delBtn) delBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1200));

  // Switch to Compress PDF without re-dropping file
  await win.webContents.executeJavaScript(`(() => {
    const btns = Array.from(document.querySelectorAll('.workbench-menu-btn'));
    const optBtn = btns.find(b => b.textContent.includes('Page Organizer') || b.textContent.includes('Optimize'));
    if (optBtn) optBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  await win.webContents.executeJavaScript(`(() => {
    const items = Array.from(document.querySelectorAll('.workbench-dropdown-item'));
    const compress = items.find(i => i.textContent.includes('Compress PDF'));
    if (compress) compress.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  // Click Compress PDF in bottom bar to run compression
  await win.webContents.executeJavaScript(`(() => {
    const runBtn = document.querySelector('.workbench-btn.primary');
    if (runBtn) runBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1200));
  await saveShot('phase3-chaining-delete-to-compress-dark-1280x720.png');

  // ==========================================
  // 3. PDF Tray Mode (Merge PDF)
  // ==========================================
  console.log('Capturing PDF Tray mode (Merge PDF)...');
  await win.webContents.executeJavaScript(`(() => {
    const startOver = document.querySelector('.start-over-btn');
    if (startOver) startOver.click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  // Navigate to Merge PDF
  await win.webContents.executeJavaScript(`(() => {
    const btns = Array.from(document.querySelectorAll('.workbench-menu-btn'));
    const org = btns.find(b => b.textContent.includes('Page Organizer'));
    if (org) org.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  await win.webContents.executeJavaScript(`(() => {
    const items = Array.from(document.querySelectorAll('.workbench-dropdown-item'));
    const merge = items.find(i => i.textContent.includes('Merge PDF'));
    if (merge) merge.click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  // Drop multiple files into tray
  await mockDropMultiple();
  await saveShot('phase3-pdf-tray-dark-1280x720.png');

  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const btn = document.querySelector('button[data-nav="pdf"]');
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));
  await mockDropMultiple();
  await saveShot('phase3-pdf-tray-light-1280x720.png');

  // ==========================================
  // 4. PDF Markers Mode (Split PDF)
  // ==========================================
  console.log('Capturing PDF Markers mode (Split PDF)...');
  await setEnvironment('dark', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const btn = document.querySelector('button[data-nav="pdf"]');
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  await win.webContents.executeJavaScript(`(() => {
    const btns = Array.from(document.querySelectorAll('.workbench-menu-btn'));
    const org = btns.find(b => b.textContent.includes('Page Organizer'));
    if (org) org.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  await win.webContents.executeJavaScript(`(() => {
    const items = Array.from(document.querySelectorAll('.workbench-dropdown-item'));
    const split = items.find(i => i.textContent.includes('Split PDF'));
    if (split) split.click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  await mockDropFile('Multi-chapter-book.pdf');

  // Toggle cut markers
  await win.webContents.executeJavaScript(`(() => {
    const slots = document.querySelectorAll('.marker-cut-slot');
    if (slots.length > 0) slots[0].click();
    if (slots.length > 2) slots[2].click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));
  await saveShot('phase3-pdf-markers-dark-1280x720.png');

  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const btn = document.querySelector('button[data-nav="pdf"]');
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));
  await mockDropFile('Multi-chapter-book.pdf');
  await win.webContents.executeJavaScript(`(() => {
    const slots = document.querySelectorAll('.marker-cut-slot');
    if (slots.length > 0) slots[0].click();
    if (slots.length > 2) slots[2].click();
  })()`);
  await saveShot('phase3-pdf-markers-light-1280x720.png');

  // ==========================================
  // 5. Default Required Screens (Dark & Light)
  // ==========================================
  console.log('Capturing Default Required Screens...');

  // Home
  await setEnvironment('dark', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const homeBtn = document.querySelector('button[data-nav="home"]');
    if (homeBtn) homeBtn.click();
  })()`);
  await saveShot('default-home-dark-1280x720.png');

  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const homeBtn = document.querySelector('button[data-nav="home"]');
    if (homeBtn) homeBtn.click();
  })()`);
  await saveShot('default-home-light-1280x720.png');

  // Text > Case Conversion
  await setEnvironment('dark', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const textNav = document.querySelector('button[data-nav="text"]');
    if (textNav) textNav.click();
  })()`);
  await saveShot('default-text-case-dark-1280x720.png');

  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const textNav = document.querySelector('button[data-nav="text"]');
    if (textNav) textNav.click();
  })()`);
  await saveShot('default-text-case-light-1280x720.png');

  // Calculator > Basic Calculator
  await setEnvironment('dark', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const calcNav = document.querySelector('button[data-nav="calculator"]');
    if (calcNav) calcNav.click();
  })()`);
  await saveShot('default-calculator-dark-1280x720.png');

  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const calcNav = document.querySelector('button[data-nav="calculator"]');
    if (calcNav) calcNav.click();
  })()`);
  await saveShot('default-calculator-light-1280x720.png');

  // Developer > JSON Formatter
  await setEnvironment('dark', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const devNav = document.querySelector('button[data-nav="developer"]');
    if (devNav) devNav.click();
  })()`);
  await saveShot('default-developer-json-dark-1280x720.png');

  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const devNav = document.querySelector('button[data-nav="developer"]');
    if (devNav) devNav.click();
  })()`);
  await saveShot('default-developer-json-light-1280x720.png');

  // Images > Resize & Scale
  await setEnvironment('dark', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const imgNav = document.querySelector('button[data-nav="images"]');
    if (imgNav) imgNav.click();
  })()`);
  await saveShot('default-images-resize-dark-1280x720.png');

  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const imgNav = document.querySelector('button[data-nav="images"]');
    if (imgNav) imgNav.click();
  })()`);
  await saveShot('default-images-resize-light-1280x720.png');

  // Settings > Appearance
  await setEnvironment('dark', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const setNav = document.querySelector('button[data-nav="settings"]');
    if (setNav) setNav.click();
  })()`);
  await saveShot('default-settings-appearance-dark-1280x720.png');

  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const setNav = document.querySelector('button[data-nav="settings"]');
    if (setNav) setNav.click();
  })()`);
  await saveShot('default-settings-appearance-light-1280x720.png');

  // Recent History
  await setEnvironment('dark', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const histNav = document.querySelector('button[data-nav="history"]');
    if (histNav) histNav.click();
  })()`);
  await saveShot('default-history-dark-1280x720.png');

  await setEnvironment('light', 1280, 720);
  await win.webContents.executeJavaScript(`(() => {
    const histNav = document.querySelector('button[data-nav="history"]');
    if (histNav) histNav.click();
  })()`);
  await saveShot('default-history-light-1280x720.png');

  console.log('=== All Phase 3 Proof Screenshots Captured Successfully ===');
  win.destroy();
  app.quit();
}

run().catch((err) => {
  console.error('Error during proof capture:', err);
  process.exit(1);
});
