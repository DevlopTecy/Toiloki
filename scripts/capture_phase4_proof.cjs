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
      page.drawText(`Confidential internal review draft for testing Toiloki Suite.`, { x: 50, y: 730, size: 12 });
    }
    const bytes = await doc.save();
    return Buffer.from(bytes).toString('base64');
  };

  const sampleB64 = await makePdfB64(4, 'Quarterly Financial Report');

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

  const distHtml = path.join(__dirname, '../dist/index.html').replace(/\\/g, '/');

  // Helper to load route
  const loadRoute = async (params = '', width = 1280, height = 720) => {
    win.setSize(width, height);
    const targetUrl = `file:///${distHtml}?${params}`;
    await win.loadURL(targetUrl);
    await new Promise((r) => setTimeout(r, 1600));

    // Ensure layout is set to workbench
    await win.webContents.executeJavaScript(`(() => {
      const s = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
      if (s.layout !== 'workbench') {
        s.layout = 'workbench';
        localStorage.setItem('toiloki_settings', JSON.stringify(s));
      }
    })()`);
  };

  // Helper to drop a single valid PDF
  const mockDropFile = async (name = 'quarterly-report.pdf', b64 = sampleB64) => {
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
    await new Promise((r) => setTimeout(r, 1800));
  };

  // Helper to drop a DOCX file
  const mockDropDocx = async (name = 'quarterly-summary.docx') => {
    await win.webContents.executeJavaScript(`(() => {
      const dummy = new Uint8Array([80, 75, 3, 4, 20, 0, 0, 0, 0, 0]);
      const file = new File([dummy], '${name}', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.querySelector('.file-dropzone-wrapper input[type="file"]') || document.querySelector('input[type="file"]');
      if (input) {
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 1400));
  };

  console.log('Loading app for Phase 4 proof verification...');

  // Proof 1: Top 7 Utility Buttons in Dark Mode (matching user's screenshot!)
  console.log('Capturing Proof 1: Top 7 utility buttons in Dark Mode (1280x720)...');
  await loadRoute('nav=pdf&theme=dark', 1280, 720);
  await saveShot('phase4-pdf-seven-menus-dark-1280x720.png', 1000);

  // Proof 2: Top 7 Utility Buttons in Light Mode
  console.log('Capturing Proof 2: Top 7 utility buttons in Light Mode (1280x720)...');
  await loadRoute('nav=pdf&theme=light', 1280, 720);
  await saveShot('phase4-pdf-seven-menus-light-1280x720.png', 1000);

  // Proof 3 & 4: Annotate Canvas in Edit > Watermark (Dark mode 1280x720 & 1920x1080)
  console.log('Capturing Proof 3 & 4: Annotate Canvas (Edit > Watermark) in Dark Mode...');
  await loadRoute('nav=pdf&group=pdf-editor&utility=watermark&theme=dark', 1280, 720);
  await mockDropFile('quarterly-report.pdf');
  await saveShot('phase4-pdf-annotate-dark-1280x720.png', 1200);

  win.setSize(1920, 1080);
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('phase4-pdf-annotate-dark-1920x1080.png', 1000);

  // Proof 5 & 6: Annotate Canvas (Edit > Watermark) in Light Mode (1280x720 & 1920x1080)
  console.log('Capturing Proof 5 & 6: Annotate Canvas in Light Mode...');
  await loadRoute('nav=pdf&group=pdf-editor&utility=watermark&theme=light', 1280, 720);
  await mockDropFile('quarterly-report.pdf');
  await saveShot('phase4-pdf-annotate-light-1280x720.png', 1200);

  win.setSize(1920, 1080);
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('phase4-pdf-annotate-light-1920x1080.png', 1000);

  // Proof 7: Convert Menu: DOCX → PDF with clean options panel
  console.log('Capturing Proof 7: Convert > DOCX to PDF (1280x720)...');
  await loadRoute('nav=pdf&group=pdf-converter&utility=docx-to-pdf&theme=dark', 1280, 720);
  await mockDropDocx('quarterly-summary.docx');
  await saveShot('phase4-pdf-convert-docx-dark-1280x720.png', 1000);

  // Proof 8: Optimize Menu: Compress PDF
  console.log('Capturing Proof 8: Optimize > Compress PDF (1280x720)...');
  await loadRoute('nav=pdf&group=pdf-optimize&utility=compress-pdf&theme=dark', 1280, 720);
  await mockDropFile('large-presentation.pdf');
  await saveShot('phase4-pdf-optimize-dark-1280x720.png', 1000);

  // Proof 9: Extract Menu: Extract Text Rich Inspector
  console.log('Capturing Proof 9: Extract > Extract Text (1280x720)...');
  await loadRoute('nav=pdf&group=pdf-extract&utility=extract-text&theme=dark', 1280, 720);
  await mockDropFile('sample-contract.pdf');
  await saveShot('phase4-pdf-extract-text-dark-1280x720.png', 1200);

  // Proof 10: Secure Menu: Password Protect / Encrypt PDF
  console.log('Capturing Proof 10: Secure > Password Protect (1280x720)...');
  await loadRoute('nav=pdf&group=pdf-security&utility=password-protect&theme=dark', 1280, 720);
  await mockDropFile('confidential-payroll.pdf');
  await saveShot('phase4-pdf-secure-encrypt-dark-1280x720.png', 1000);

  console.log('All Phase 4 proof screenshots captured successfully!');
  app.quit();
}

run().catch((err) => {
  console.error('Error during proof capture:', err);
  app.quit();
});
