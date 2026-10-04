const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

app.disableHardwareAcceleration();

async function run() {
  await app.whenReady();

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

  // Helper to drop an image file
  const mockDropImage = async (name = 'photo-sample.png') => {
    await win.webContents.executeJavaScript(`(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#181818';
      ctx.fillRect(0, 0, 1200, 800);
      ctx.fillStyle = '#D4B06A';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('Toiloki Image Test Asset', 80, 140);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '20px sans-serif';
      ctx.fillText('Offline High Performance Transformation', 80, 190);
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      for (let x = 0; x < 1200; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 800); ctx.stroke();
      }
      for (let y = 0; y < 800; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
      }
      canvas.toBlob((blob) => {
        const file = new File([blob], '${name}', { type: 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);
        const input = document.querySelector('.file-dropzone-wrapper input[type="file"]') || document.querySelector('input[type="file"]');
        if (input) {
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 'image/png');
    })()`);
    await new Promise((r) => setTimeout(r, 2000));
  };

  // Helper to drop a document file
  const mockDropDocument = async (name = 'quarterly-report.docx') => {
    await win.webContents.executeJavaScript(`(() => {
      const sampleText = \`# Executive Summary\\n\\nToiloki provides a comprehensive local-first suite of utilities designed for high reliability and privacy.\\n\\n## Workspace Highlights\\n- **Deterministic execution**: All computations occur locally in-process with zero network dependency.\\n- **High-performance rendering**: Modern OpenXML (.docx) and Markdown parsing.\\n- **Multi-format support**: Convert seamlessly between PDF, DOCX, TXT, HTML and RTF.\\n\\n## Technical Metrics\\n- Latency: < 15ms\\n- Memory footprint: Minimal\\n- Security: Zero telemetry or external transmission\\n\`;
      const enc = new TextEncoder().encode(sampleText);
      const file = new File([enc], '${name}', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.querySelector('.file-dropzone-wrapper input[type="file"]') || document.querySelector('input[type="file"]');
      if (input) {
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 2000));
  };

  console.log('=== STARTING REFINED PHASE 5 PROOF CAPTURE ===');

  // 1. Images Workspace: Empty drop state
  await loadRoute('nav=images&theme=dark', 1280, 720);
  await saveShot('phase5-images-empty-1280x720-dark.png', 800);

  // 2. Images Workspace: Loaded image with crop overlay & batch thumbnail strip (1280x720 Dark)
  await loadRoute('nav=images&theme=dark&group=img-transformer&utility=img-crop', 1280, 720);
  await mockDropImage('photo-sample.png');
  await saveShot('phase5-images-workbench-1280x720-dark.png', 1200);

  // 3. Images Workspace: 1920x1080 Dark
  await win.setSize(1920, 1080);
  await saveShot('phase5-images-workbench-1920x1080-dark.png', 1200);

  // 4. Images Workspace: 1280x720 Light
  await loadRoute('nav=images&theme=light&group=img-transformer&utility=img-crop', 1280, 720);
  await mockDropImage('photo-sample.png');
  await saveShot('phase5-images-workbench-1280x720-light.png', 1200);

  // 5. Images Workspace: 1920x1080 Light
  await win.setSize(1920, 1080);
  await saveShot('phase5-images-workbench-1920x1080-light.png', 1200);

  // 6. Images Workspace: ONE Convert Panel with Format Tiles
  await loadRoute('nav=images&theme=dark&group=img-converter&utility=convert-webp', 1280, 720);
  await mockDropImage('portfolio-graphic.png');
  await saveShot('phase5-images-converter-tiles-dark.png', 1200);

  // 7. Documents Workspace: 1280x720 Dark
  await loadRoute('nav=documents&theme=dark&group=doc-converter&utility=docx-to-pdf', 1280, 720);
  await mockDropDocument('quarterly-report.docx');
  await saveShot('phase5-documents-workbench-1280x720-dark.png', 1200);

  // 8. Documents Workspace: 1920x1080 Dark
  await win.setSize(1920, 1080);
  await saveShot('phase5-documents-workbench-1920x1080-dark.png', 1200);

  // 9. Documents Workspace: 1280x720 Light
  await loadRoute('nav=documents&theme=light&group=doc-converter&utility=docx-to-pdf', 1280, 720);
  await mockDropDocument('quarterly-report.docx');
  await saveShot('phase5-documents-workbench-1280x720-light.png', 1200);

  console.log('=== PHASE 5 ELECTRON PROOF CAPTURE COMPLETE ===');
  app.quit();
}

run().catch((err) => {
  console.error('Proof capture failed:', err);
  app.quit();
});
