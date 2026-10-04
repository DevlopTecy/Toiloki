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

  const openSettings = async () => {
    await win.webContents.executeJavaScript(`(() => {
      const btn = document.querySelector('button[data-nav="settings"]');
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  const selectSettingsPage = async (pageId) => {
    await win.webContents.executeJavaScript(`(() => {
      const btn = document.querySelector('button[data-settings-nav="${pageId}"]');
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 500));
  };

  const pages = [
    { id: 'appearance', name: 'appearance' },
    { id: 'files', name: 'files' },
    { id: 'performance', name: 'performance' },
    { id: 'privacy', name: 'privacy' },
    { id: 'advanced', name: 'advanced' },
  ];

  console.log('=== CAPTURING PHASE 11 SETTINGS PROOFS (1280x720 DARK & LIGHT) ===');
  win.setSize(1280, 720);

  // 1. Dark Mode 1280x720 for all 5 pages
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await openSettings();

  for (const p of pages) {
    await selectSettingsPage(p.id);
    await saveShot(`phase11-settings-${p.name}-dark-1280.png`, 600);
  }

  // 2. Light Mode 1280x720 for all 5 pages
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await openSettings();

  for (const p of pages) {
    await selectSettingsPage(p.id);
    await saveShot(`phase11-settings-${p.name}-light-1280.png`, 600);
  }

  console.log('=== CAPTURING PHASE 11 SETTINGS PROOFS (1920x1080 DARK & LIGHT) ===');
  win.setSize(1920, 1080);

  // 3. Dark Mode 1920x1080
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await openSettings();

  for (const p of pages) {
    await selectSettingsPage(p.id);
    await saveShot(`phase11-settings-${p.name}-dark-1920.png`, 600);
  }

  // 4. Light Mode 1920x1080
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await openSettings();

  for (const p of pages) {
    await selectSettingsPage(p.id);
    await saveShot(`phase11-settings-${p.name}-light-1920.png`, 600);
  }

  console.log('=== ALL PHASE 11 SETTINGS PROOFS CAPTURED SUCCESSFULLY ===');
  app.quit();
}

run().catch((err) => {
  console.error('Capture error:', err);
  app.quit();
  process.exit(1);
});
