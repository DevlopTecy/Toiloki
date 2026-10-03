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
    height: 840,
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

  const distHtml = path.join(__dirname, '../dist/index.html');
  console.log('Loading app from dist for Phase 9 proof verification...');
  await win.loadFile(distHtml);
  await new Promise((r) => setTimeout(r, 1800));

  // 1. Initial State: Utility Tabs + TitleBar
  console.log('Capturing 1: Utility Tabs & TitleBar buttons...');
  await saveShot('phase9-tabs-and-titlebar.png', 800);

  // 2. Open Smart Paste Modal with sample JSON
  console.log('Capturing 2: Smart Paste modal with detected JSON...');
  await win.webContents.executeJavaScript(`(() => {
    const trigger = document.querySelector('button[title*="Smart Paste"]');
    if (trigger) trigger.click();
  })()`);
  await saveShot('phase9-smart-paste-modal.png', 800);

  // Close Smart Paste
  await win.webContents.executeJavaScript(`(() => {
    const closeBtn = document.querySelector('.smart-paste-close-btn');
    if (closeBtn) closeBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  // 3. Open Chains & Presets Modal
  console.log('Capturing 3: Chains & Presets modal...');
  await win.webContents.executeJavaScript(`(() => {
    const trigger = document.querySelector('button[title*="Chains"]');
    if (trigger) trigger.click();
  })()`);
  await saveShot('phase9-chains-modal.png', 800);

  // Close Chains Modal
  await win.webContents.executeJavaScript(`(() => {
    const closeBtn = document.querySelector('.smart-paste-close-btn');
    if (closeBtn) closeBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  // 4. Navigate to Toiloki Trash View
  console.log('Capturing 4: Toiloki Trash & Quarantine view...');
  await win.webContents.executeJavaScript(`(() => {
    const trashBtn = document.querySelector('button[data-nav="trash"]');
    if (trashBtn) trashBtn.click();
  })()`);
  await saveShot('phase9-trash-view.png', 800);

  // 5. Navigate to Settings -> Files & Storage
  console.log('Capturing 5: Output settings & File Associations in Settings...');
  await win.webContents.executeJavaScript(`(() => {
    const settingsBtn = document.querySelector('button[data-nav="settings"]');
    if (settingsBtn) settingsBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));
  await win.webContents.executeJavaScript(`(() => {
    const filesTab = Array.from(document.querySelectorAll('.settings-nav-item')).find(el => el.textContent.includes('Files'));
    if (filesTab) filesTab.click();
  })()`);
  await saveShot('phase9-settings-files.png', 800);

  // 6. Navigate to Settings -> Advanced (Portable Mode & Temp Cleanup Schedule)
  console.log('Capturing 6: Portable Mode & Maintenance in Settings...');
  await win.webContents.executeJavaScript(`(() => {
    const advTab = Array.from(document.querySelectorAll('.settings-nav-item')).find(el => el.textContent.includes('Advanced'));
    if (advTab) advTab.click();
  })()`);
  await saveShot('phase9-settings-advanced.png', 800);

  console.log('All Phase 9 proof screenshots captured successfully!');
  app.quit();
}

run().catch((err) => {
  console.error('Error running proof capture:', err);
  process.exit(1);
});
