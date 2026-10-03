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
    height: 820,
    show: false,
    frame: false,
    webPreferences: {
      offscreen: true,
    },
  });

  const saveShot = async (filename, delay = 800) => {
    await new Promise((r) => setTimeout(r, delay));
    const image = await win.webContents.capturePage();
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, image.toPNG());
    console.log('Saved:', filename);
  };

  const setInputValue = async (selector, value) => {
    await win.webContents.executeJavaScript(`(() => {
      const input = document.querySelector('${selector}');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, '${value}');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  console.log('Loading app for Phase 3 verification...');
  await win.loadURL('http://localhost:4173/?nav=pdf&group=page-organizer&utility=merge-pdf&theme=dark');
  await new Promise((r) => setTimeout(r, 2200));

  // 1. Merge PDF with Grouped Features in Options Panel
  console.log('Capturing 1: Merge PDF grouped features controls panel...');
  await saveShot('phase3-grouped-controls.png', 1000);

  // 2. What this can do Modal
  console.log('Capturing 2: Opening "What this can do" modal...');
  await win.webContents.executeJavaScript(`(() => {
    const infoBtn = document.querySelector('.header-info-btn');
    if (infoBtn) infoBtn.click();
  })()`);
  await saveShot('phase3-what-this-can-do-modal.png', 800);

  // Close modal
  await win.webContents.executeJavaScript(`(() => {
    const closeBtn = document.querySelector('.what-modal-close');
    if (closeBtn) closeBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  // 3. Deep link with ?feature=id pulse highlight
  console.log('Capturing 3: Deep linking to ?feature=page-range-per-file...');
  await win.loadURL('http://localhost:4173/?feature=page-range-per-file&theme=dark');
  await saveShot('phase3-deep-link-pulse.png', 1200);

  // 4. Ctrl+K Search for feature ("Reorder by drag")
  console.log('Capturing 4: Ctrl+K search indexing features ("Reorder by drag — Merge PDF")...');
  await win.webContents.executeJavaScript(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 400));
  await setInputValue('.palette-input', 'reorder');
  await saveShot('phase3-ctrlk-feature-search.png', 800);

  // 5. Ctrl+K Search for soon feature ("Bookmarks per file")
  console.log('Capturing 5: Ctrl+K search indexing Soon feature ("Bookmarks per file — Merge PDF")...');
  await setInputValue('.palette-input', 'bookmarks');
  await saveShot('phase3-ctrlk-soon-feature-search.png', 800);

  // Close palette
  await win.webContents.executeJavaScript(`(() => {
    const closeBtn = document.querySelector('.palette-close-btn');
    if (closeBtn) closeBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 300));

  // 6. JSON Formatter seed tool
  console.log('Capturing 6: JSON Formatter features...');
  await win.loadURL('http://localhost:4173/?nav=developer&group=dev-formatters&utility=json-prettify&theme=dark');
  await saveShot('phase3-json-formatter-features.png', 1200);

  // 7. Batch Rename seed tool
  console.log('Capturing 7: Batch Rename features...');
  await win.loadURL('http://localhost:4173/?nav=files&group=files-batch&utility=batch-rename&theme=dark');
  await saveShot('phase3-batch-rename-features.png', 1200);

  console.log('--- Phase 3 Proof Capture Completed Successfully ---');
  win.destroy();
  app.quit();
}

run().catch((err) => {
  console.error('Error during proof capture:', err);
  process.exit(1);
});
