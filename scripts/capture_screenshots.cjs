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
    height: 800,
    show: false,
    frame: false,
    webPreferences: {
      offscreen: true,
    },
  });

  win.webContents.on('console-message', (e, level, message) => {
    console.log('[RENDERER]:', message);
  });

  const saveShot = async (filename) => {
    await new Promise((r) => setTimeout(r, 600));
    const image = await win.webContents.capturePage();
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, image.toPNG());
    console.log('Saved:', filename);
  };

  const navigateTo = async (navId) => {
    await win.webContents.executeJavaScript(`(() => {
      try {
        const btn = document.querySelector('[data-nav="${navId}"]');
        if (btn) btn.click();
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  const openSearch = async () => {
    await win.webContents.executeJavaScript(`(() => {
      try {
        const btn = document.querySelector('.titlebar-search-trigger');
        if (btn) btn.click();
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  const closeSearch = async () => {
    await win.webContents.executeJavaScript(`(() => {
      try {
        const overlay = document.querySelector('.palette-overlay');
        if (overlay) overlay.click();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    })()`);
    await new Promise((r) => setTimeout(r, 400));
  };

  const setSize = async (w, h) => {
    win.setContentSize(w, h);
    await new Promise((r) => setTimeout(r, 500));
  };

  console.log('--- Starting Screenshot Suite ---');

  // =================== 1. DARK THEME ===================
  await win.loadURL('http://localhost:4173/?theme=dark');
  await new Promise((r) => setTimeout(r, 1500));

  // 1280x800
  await setSize(1280, 800);
  await navigateTo('home');
  await saveShot('home-dark-1280.png');

  await navigateTo('pdf');
  await saveShot('workspace-dark-1280.png');

  await openSearch();
  await saveShot('ctrlk-dark-1280.png');
  await closeSearch();

  // 1920x1080
  await setSize(1920, 1080);
  await navigateTo('home');
  await saveShot('home-dark-1920.png');

  await navigateTo('pdf');
  await saveShot('workspace-dark-1920.png');

  await openSearch();
  await saveShot('ctrlk-dark-1920.png');
  await closeSearch();

  // =================== 2. LIGHT THEME ===================
  await win.loadURL('http://localhost:4173/?theme=light');
  await new Promise((r) => setTimeout(r, 1500));

  // 1280x800
  await setSize(1280, 800);
  await navigateTo('home');
  await saveShot('home-light-1280.png');

  await navigateTo('pdf');
  await saveShot('workspace-light-1280.png');

  await openSearch();
  await saveShot('ctrlk-light-1280.png');
  await closeSearch();

  // 1920x1080
  await setSize(1920, 1080);
  await navigateTo('home');
  await saveShot('home-light-1920.png');

  await navigateTo('pdf');
  await saveShot('workspace-light-1920.png');

  await openSearch();
  await saveShot('ctrlk-light-1920.png');
  await closeSearch();

  console.log('--- All 12 screenshots captured successfully! ---');
  win.destroy();
  app.quit();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
