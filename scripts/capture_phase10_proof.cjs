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

  const navigateTo = async (navId) => {
    await win.webContents.executeJavaScript(`(() => {
      const btn = document.querySelector('button[data-nav="${navId}"]');
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  const selectUtility = async (toolKeyword) => {
    await win.webContents.executeJavaScript(`(() => {
      const cards = Array.from(document.querySelectorAll('.tool-card, .utility-list-item, button'));
      const target = cards.find(c => c.textContent.toLowerCase().includes("${toolKeyword.toLowerCase()}"));
      if (target) target.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  console.log('--- CAPTURING 1280x720 PROOFS (DARK & LIGHT) ---');
  win.setSize(1280, 720);

  // 1. HOME (Dark 1280x720)
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('home');
  await saveShot('phase10-home-dark-1280.png', 800);

  // 1b. HOME (Light 1280x720)
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('home');
  await saveShot('phase10-home-light-1280.png', 800);

  // Return to Dark Mode for remaining tools
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));

  // 2. PDF (Dark 1280x720)
  await navigateTo('pdf');
  await saveShot('phase10-pdf-dark-1280.png', 800);

  // 2b. PDF (Light 1280x720)
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('pdf');
  await saveShot('phase10-pdf-light-1280.png', 800);

  // 3. TEXT CASE CONVERSION (Dark 1280x720)
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('text');
  await selectUtility('case');
  await saveShot('phase10-text-case-dark-1280.png', 800);

  // 3b. TEXT CASE CONVERSION (Light 1280x720)
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('text');
  await selectUtility('case');
  await saveShot('phase10-text-case-light-1280.png', 800);

  // 4. CALCULATOR (Dark 1280x720)
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('calculator');
  await saveShot('phase10-calculator-dark-1280.png', 800);

  // 4b. CALCULATOR (Light 1280x720)
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('calculator');
  await saveShot('phase10-calculator-light-1280.png', 800);

  // 5. DEVELOPER JSON (Dark 1280x720)
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('developer');
  await selectUtility('json');
  await saveShot('phase10-developer-json-dark-1280.png', 800);

  // 5b. DEVELOPER JSON (Light 1280x720)
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('developer');
  await selectUtility('json');
  await saveShot('phase10-developer-json-light-1280.png', 800);

  // 6. IMAGES RESIZE (Dark 1280x720)
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('images');
  await selectUtility('resize');
  await saveShot('phase10-images-resize-dark-1280.png', 800);

  // 6b. IMAGES RESIZE (Light 1280x720)
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('images');
  await selectUtility('resize');
  await saveShot('phase10-images-resize-light-1280.png', 800);

  // 7. SETTINGS APPEARANCE (Dark 1280x720)
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('settings');
  await saveShot('phase10-settings-appearance-dark-1280.png', 800);

  // 7b. SETTINGS APPEARANCE (Light 1280x720)
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('settings');
  await saveShot('phase10-settings-appearance-light-1280.png', 800);

  // 8. RECENT HISTORY (Dark 1280x720)
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('history');
  await saveShot('phase10-history-dark-1280.png', 800);

  // 8b. RECENT HISTORY (Light 1280x720)
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('history');
  await saveShot('phase10-history-light-1280.png', 800);

  console.log('--- CAPTURING 1920x1080 PROOFS (DARK & LIGHT) ---');
  win.setSize(1920, 1080);

  // Home 1920x1080 Dark
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('home');
  await saveShot('phase10-home-dark-1920.png', 800);

  // Home 1920x1080 Light
  await win.loadURL(lightUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('home');
  await saveShot('phase10-home-light-1920.png', 800);

  // PDF 1920x1080 Dark
  await win.loadURL(darkUrl);
  await new Promise((r) => setTimeout(r, 1800));
  await navigateTo('pdf');
  await saveShot('phase10-pdf-dark-1920.png', 800);

  // Settings Appearance 1920x1080 Dark
  await navigateTo('settings');
  await saveShot('phase10-settings-appearance-dark-1920.png', 800);

  console.log('All Phase 10 proof screenshots captured successfully!');
  app.quit();
}

run().catch((err) => {
  console.error('Error running Phase 10 proof capture:', err);
  process.exit(1);
});
