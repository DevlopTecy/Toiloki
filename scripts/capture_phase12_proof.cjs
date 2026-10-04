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

  const saveShot = async (filename, delay = 800) => {
    await new Promise((r) => setTimeout(r, delay));
    const image = await win.webContents.capturePage();
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, image.toPNG());
    console.log('Saved proof screenshot:', filename);
  };

  const distHtml = path.join(__dirname, '../dist/index.html').replace(/\\/g, '/');
  const darkUrl = `file:///${distHtml}?theme=dark`;
  const lightUrl = `file:///${distHtml}?theme=light`;

  console.log('=== CAPTURING PHASE 12 FLOW & RETENTION PROOFS ===');

  // Helper: Enable savings summary in localStorage
  const enableSavingsSummary = async () => {
    await win.webContents.executeJavaScript(`(() => {
      try {
        const raw = localStorage.getItem('toiloki_settings');
        const s = raw ? JSON.parse(raw) : {};
        s.showSavingsSummary = true;
        localStorage.setItem('toiloki_settings', JSON.stringify(s));
        localStorage.setItem('toiloki_intro_completed', 'true');
        window.dispatchEvent(new CustomEvent('toiloki_settings_changed', { detail: s }));
      } catch (e) {}
    })()`);
    await new Promise((r) => setTimeout(r, 400));
  };

  // Helper: Open Shortcuts Modal
  const openShortcutsModal = async () => {
    await win.webContents.executeJavaScript(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  // Helper: Navigate to Utility with Presets (compress-pdf)
  const openUtilityWithPresets = async () => {
    await win.webContents.executeJavaScript(`(() => {
      try {
        const raw = localStorage.getItem('toiloki_settings');
        const s = raw ? JSON.parse(raw) : {};
        s.layout = 'default';
        localStorage.setItem('toiloki_settings', JSON.stringify(s));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('toiloki-navigate-utility', {
        detail: { workspaceId: 'pdf', groupId: 'pdf-optimizer', utilityId: 'compress-pdf' }
      }));
    })()`);
    await new Promise((r) => setTimeout(r, 900));
  };

  // Helper: Navigate to Favorites view
  const openFavoritesView = async () => {
    await win.webContents.executeJavaScript(`(() => {
      const favBtn = document.querySelector('button[data-nav="favorites"]');
      if (favBtn) favBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  // Helper: Trigger Intro Modal
  const showIntroModal = async () => {
    await win.webContents.executeJavaScript(`(() => {
      localStorage.removeItem('toiloki_intro_completed');
      location.reload();
    })()`);
    await new Promise((r) => setTimeout(r, 1600));
  };

  // ─── 1. DARK MODE (1280x720) ───
  win.setSize(1280, 720);
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await enableSavingsSummary();
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));

  // 1A. Home with Storage Savings card & drag quick actions
  await saveShot('phase12-home-savings-card-dark-1280.png', 800);

  // 1B. Shortcuts modal
  await openShortcutsModal();
  await saveShot('phase12-shortcuts-modal-dark-1280.png', 700);

  // Close modal via Escape
  await win.webContents.executeJavaScript(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  // 1C. Presets chips & "Save as preset"
  await openUtilityWithPresets();
  await saveShot('phase12-presets-chips-dark-1280.png', 800);

  // 1D. Favorites view with drag-reorder handles
  await openFavoritesView();
  await saveShot('phase12-favorites-drag-dark-1280.png', 700);

  // 1E. Intro Modal tour
  await showIntroModal();
  await saveShot('phase12-intro-tour-dark-1280.png', 800);

  // ─── 2. LIGHT MODE (1280x720) ───
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await enableSavingsSummary();
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));

  // 2A. Home with Storage Savings card (Light)
  await saveShot('phase12-home-savings-card-light-1280.png', 800);

  // 2B. Shortcuts modal (Light)
  await openShortcutsModal();
  await saveShot('phase12-shortcuts-modal-light-1280.png', 700);

  await win.webContents.executeJavaScript(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  // 2C. Presets chips (Light)
  await openUtilityWithPresets();
  await saveShot('phase12-presets-chips-light-1280.png', 800);

  // 2D. Favorites view (Light)
  await openFavoritesView();
  await saveShot('phase12-favorites-drag-light-1280.png', 700);

  // 2E. Intro Modal tour (Light)
  await showIntroModal();
  await saveShot('phase12-intro-tour-light-1280.png', 800);

  // ─── 3. FULL HD 1920x1080 ───
  console.log('=== CAPTURING PHASE 12 FULL HD PROOFS (1920x1080) ===');
  win.setSize(1920, 1080);
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await enableSavingsSummary();
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));

  await saveShot('phase12-home-fhd-dark-1920.png', 800);

  await openShortcutsModal();
  await saveShot('phase12-shortcuts-fhd-dark-1920.png', 700);

  await win.webContents.executeJavaScript(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  await openUtilityWithPresets();
  await saveShot('phase12-presets-fhd-dark-1920.png', 800);

  console.log('=== PHASE 12 PROOF CAPTURES COMPLETED SUCCESSFULLY ===');
  app.quit();
}

run().catch((err) => {
  console.error('Phase 12 proof capture failed:', err);
  app.quit();
});
