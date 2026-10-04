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

  const saveShot = async (filename, delay = 1200) => {
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
    await new Promise((r) => setTimeout(r, 1800));

    // Ensure layout is set to workbench
    await win.webContents.executeJavaScript(`(() => {
      const s = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
      if (s.layout !== 'workbench') {
        s.layout = 'workbench';
        localStorage.setItem('toiloki_settings', JSON.stringify(s));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  // Helper to switch mode in MediaCanvas
  const setMediaMode = async (mode) => {
    await win.webContents.executeJavaScript(`(() => {
      const btn = document.getElementById('media-mode-${mode}-btn');
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  // Helper to switch mode in FilesCanvas
  const setFilesMode = async (mode) => {
    await win.webContents.executeJavaScript(`(() => {
      const btn = document.getElementById('files-mode-${mode}-btn');
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  console.log('=== STARTING PHASE 7 PROOF CAPTURE: AUDIO/VIDEO & FILES/ARCHIVES WORKBENCH ===');

  // 1. MEDIA WORKBENCH: Trim & Timeline Mode (1280x720 Dark)
  await loadRoute('nav=media&theme=dark', 1280, 720);
  await setMediaMode('trim');
  await saveShot('phase7-media-trim-1280x720-dark.png', 1000);

  // 2. MEDIA WORKBENCH: Trim & Timeline Mode (1920x1080 Dark)
  await win.setSize(1920, 1080);
  await saveShot('phase7-media-trim-1920x1080-dark.png', 1000);

  // 3. MEDIA WORKBENCH: Trim & Timeline Mode (1280x720 Light)
  await loadRoute('nav=media&theme=light', 1280, 720);
  await setMediaMode('trim');
  await saveShot('phase7-media-trim-1280x720-light.png', 1000);

  // 4. MEDIA WORKBENCH: Trim & Timeline Mode (1920x1080 Light)
  await win.setSize(1920, 1080);
  await saveShot('phase7-media-trim-1920x1080-light.png', 1000);

  // 5. MEDIA WORKBENCH: Format & Tuning Mode (Dark)
  await loadRoute('nav=media&theme=dark', 1280, 720);
  await setMediaMode('panel');
  await saveShot('phase7-media-tuning-dark.png', 1000);

  // 6. MEDIA WORKBENCH: Technical Specs Inspector Mode (Dark)
  await loadRoute('nav=media&theme=dark', 1280, 720);
  await setMediaMode('info');
  await saveShot('phase7-media-specs-dark.png', 1000);

  // 7. FILES WORKBENCH: File Table & Batch Rename Mode (1280x720 Dark)
  await loadRoute('nav=files&theme=dark', 1280, 720);
  await setFilesMode('table');
  await saveShot('phase7-files-table-1280x720-dark.png', 1000);

  // 8. FILES WORKBENCH: File Table & Batch Rename Mode (1920x1080 Dark)
  await win.setSize(1920, 1080);
  await saveShot('phase7-files-table-1920x1080-dark.png', 1000);

  // 9. FILES WORKBENCH: File Table & Batch Rename Mode (1280x720 Light)
  await loadRoute('nav=files&theme=light', 1280, 720);
  await setFilesMode('table');
  await saveShot('phase7-files-table-1280x720-light.png', 1000);

  // 10. FILES WORKBENCH: File Table & Batch Rename Mode (1920x1080 Light)
  await win.setSize(1920, 1080);
  await saveShot('phase7-files-table-1920x1080-light.png', 1000);

  // 11. FILES WORKBENCH: Archive Explorer Mode (Dark)
  await loadRoute('nav=files&theme=dark', 1280, 720);
  await setFilesMode('inspect');
  await saveShot('phase7-files-archive-dark.png', 1000);

  // 12. FILES WORKBENCH: Checksums & Hashes Inspector Mode (Dark)
  await loadRoute('nav=files&theme=dark', 1280, 720);
  await setFilesMode('analyzer');
  await saveShot('phase7-files-analyzer-dark.png', 1000);

  console.log('=== ALL PHASE 7 PROOFS CAPTURED SUCCESSFULLY ===');
  app.quit();
}

run().catch((err) => {
  console.error('Failed to capture Phase 7 proof:', err);
  app.quit();
  process.exit(1);
});
