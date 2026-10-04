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
    await new Promise((r) => setTimeout(r, 600));
  };

  // Helper to switch view modes in DataCanvas
  const setDataViewMode = async (mode) => {
    await win.webContents.executeJavaScript(`(() => {
      const tabs = Array.from(document.querySelectorAll('.view-mode-tab'));
      const target = tabs.find(t => t.textContent.toLowerCase().includes('${mode}'));
      if (target) target.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  // Helper to switch view modes in TextCanvas
  const setTextViewMode = async (mode) => {
    await win.webContents.executeJavaScript(`(() => {
      const tabs = Array.from(document.querySelectorAll('.view-mode-tab'));
      const target = tabs.find(t => t.textContent.toLowerCase().includes('${mode}'));
      if (target) target.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  console.log('=== STARTING PHASE 6 PROOF CAPTURE: DATA & TEXT WORKBENCH ===');

  // 1. DATA WORKBENCH: Grid Mode (1280x720 Dark)
  await loadRoute('nav=data&theme=dark', 1280, 720);
  await setDataViewMode('grid');
  await saveShot('phase6-data-grid-1280x720-dark.png', 1000);

  // 2. DATA WORKBENCH: Grid Mode (1920x1080 Dark)
  await win.setSize(1920, 1080);
  await saveShot('phase6-data-grid-1920x1080-dark.png', 1000);

  // 3. DATA WORKBENCH: Grid Mode (1280x720 Light)
  await loadRoute('nav=data&theme=light', 1280, 720);
  await setDataViewMode('grid');
  await saveShot('phase6-data-grid-1280x720-light.png', 1000);

  // 4. DATA WORKBENCH: Grid Mode (1920x1080 Light)
  await win.setSize(1920, 1080);
  await saveShot('phase6-data-grid-1920x1080-light.png', 1000);

  // 5. DATA WORKBENCH: Tree Mode (Dark)
  await loadRoute('nav=data&theme=dark', 1280, 720);
  await setDataViewMode('tree');
  await saveShot('phase6-data-tree-dark.png', 1000);

  // 6. DATA WORKBENCH: Schema & Stats Inspector Mode (Dark)
  await setDataViewMode('schema');
  await saveShot('phase6-data-schema-dark.png', 1000);

  // 7. TEXT WORKBENCH: Editor Mode (1280x720 Dark)
  await loadRoute('nav=text&theme=dark', 1280, 720);
  await setTextViewMode('editor');
  await saveShot('phase6-text-editor-1280x720-dark.png', 1000);

  // 8. TEXT WORKBENCH: Editor Mode (1920x1080 Dark)
  await win.setSize(1920, 1080);
  await saveShot('phase6-text-editor-1920x1080-dark.png', 1000);

  // 9. TEXT WORKBENCH: Editor Mode (1280x720 Light)
  await loadRoute('nav=text&theme=light', 1280, 720);
  await setTextViewMode('editor');
  await saveShot('phase6-text-editor-1280x720-light.png', 1000);

  // 10. TEXT WORKBENCH: Editor Mode (1920x1080 Light)
  await win.setSize(1920, 1080);
  await saveShot('phase6-text-editor-1920x1080-light.png', 1000);

  // 11. TEXT WORKBENCH: Diff Compare Mode (Dark)
  await loadRoute('nav=text&theme=dark', 1280, 720);
  // Modify text slightly to trigger diff visualization
  await win.webContents.executeJavaScript(`(() => {
    const ta = document.querySelector('.editor-textarea');
    if (ta) {
      ta.value = ta.value + '\\n\\n[NEW] Added localized offline processing guarantee.\\n[MODIFIED] Enterprise encryption protocol active.';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await setTextViewMode('diff');
  await saveShot('phase6-text-diff-dark.png', 1000);

  // 12. TEXT WORKBENCH: Analysis & Entities Mode (Dark)
  await setTextViewMode('analysis');
  await saveShot('phase6-text-analysis-dark.png', 1000);

  console.log('=== PHASE 6 ELECTRON PROOF CAPTURE COMPLETE ===');
  app.quit();
}

run().catch((err) => {
  console.error('Proof capture failed:', err);
  app.quit();
});
