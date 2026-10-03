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

  const saveShot = async (filename) => {
    await new Promise((r) => setTimeout(r, 800));
    const image = await win.webContents.capturePage();
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, image.toPNG());
    console.log('Saved:', filename);
  };

  const clickNav = async (navId) => {
    await win.webContents.executeJavaScript(`(() => {
      const btn = document.querySelector('[data-nav="${navId}"]');
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  const clickTool = async (toolId) => {
    await win.webContents.executeJavaScript(`(() => {
      const btn = document.querySelector('[data-tool-id="${toolId}"]');
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  console.log('Loading app...');
  await win.loadURL('http://localhost:4173/?theme=dark');
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Home Screen
  console.log('Capturing Home screen...');
  await clickNav('home');
  await saveShot('phase2-home.png');

  // 2. Documents Workspace: Single-tool group rendered flat (Document Diff)
  console.log('Capturing Documents Workspace (Single-tool group flat render)...');
  await clickNav('documents');
  await clickTool('doc-diff');
  await saveShot('phase2-flat-group.png');

  // 3. PDF Workspace: 'Soon' utility (Replace Pages)
  console.log('Capturing PDF Workspace Soon utility (Clean empty state)...');
  await clickNav('pdf');
  await clickTool('replace-pages');
  await saveShot('phase2-soon-state.png');

  // 4. PDF Workspace: 'Beta' utility (Compress PDF)
  console.log('Capturing PDF Workspace Beta utility (Compress PDF)...');
  await clickTool('compress-pdf');
  await saveShot('phase2-beta-state.png');

  // 5. Text Workspace: Secondary opening of Base64 (Developer tool in Text workspace)
  console.log('Capturing Text Workspace Secondary Opening (Base64 with Also in Text chip)...');
  await clickNav('text');
  await clickTool('dev-base64');
  await saveShot('phase2-secondary-opening.png');

  // 6. Ctrl+K Search: Search 'base64'
  console.log('Capturing Ctrl+K Search (Unique listing + Aliases indexed)...');
  await win.webContents.executeJavaScript(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 400));
  await win.webContents.executeJavaScript(`(() => {
    const input = document.querySelector('.palette-input');
    if (input) {
      input.value = 'base64';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await new Promise((r) => setTimeout(r, 600));
  await saveShot('phase2-ctrlk-search.png');

  console.log('--- Phase 2 Proof Capture Completed ---');
  win.destroy();
  app.quit();
}

run().catch((err) => {
  console.error('Error during proof capture:', err);
  process.exit(1);
});
