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

  console.log('=== STARTING PHASE 8 PROOF CAPTURE: STANDALONE WORKSPACES & INTEGRATION ===');

  // 1. CALCULATOR WORKBENCH: Basic Calculator (1280x720 Dark)
  await loadRoute('nav=calculator&group=calc-general&utility=calc-basic&theme=dark', 1280, 720);
  await saveShot('phase8-calculator-basic-1280x720-dark.png', 1000);

  // 2. CALCULATOR WORKBENCH: Basic Calculator (1920x1080 Dark)
  await win.setSize(1920, 1080);
  await saveShot('phase8-calculator-basic-1920x1080-dark.png', 1000);

  // 3. CALCULATOR WORKBENCH: Basic Calculator (1280x720 Light)
  await loadRoute('nav=calculator&group=calc-general&utility=calc-basic&theme=light', 1280, 720);
  await saveShot('phase8-calculator-basic-1280x720-light.png', 1000);

  // 4. CALCULATOR WORKBENCH: Basic Calculator (1920x1080 Light)
  await win.setSize(1920, 1080);
  await saveShot('phase8-calculator-basic-1920x1080-light.png', 1000);

  // 5. DEVELOPER WORKBENCH: Code Formatter / JSON (Dark)
  await loadRoute('nav=developer&group=dev-formatter&utility=format-json-code&theme=dark', 1280, 720);
  await saveShot('phase8-developer-json-dark.png', 1000);

  // 6. SECURITY WORKBENCH: Password Generator (Dark)
  await loadRoute('nav=security&group=sec-credentials&utility=sec-password-generator&theme=dark', 1280, 720);
  await saveShot('phase8-security-password-dark.png', 1000);

  // 7. NETWORK WORKBENCH: URL Builder & Composer (Dark)
  await loadRoute('nav=network&group=net-url-web&utility=net-url-builder&theme=dark', 1280, 720);
  await saveShot('phase8-network-url-dark.png', 1000);

  // 8. DESIGN WORKBENCH: Color Converter (Dark)
  await loadRoute('nav=design&group=design-color&utility=design-color-converter&theme=dark', 1280, 720);
  await saveShot('phase8-design-color-dark.png', 1000);

  // 9. SYSTEM WORKBENCH: Disk Usage Tree & Diagnostics (Dark)
  await loadRoute('nav=system&group=sys-storage&utility=sys-disk-usage-tree&theme=dark', 1280, 720);
  await saveShot('phase8-system-diagnostics-dark.png', 1000);

  console.log('=== PHASE 8 PROOFS CAPTURED SUCCESSFULLY ===');
  app.quit();
}

run().catch((err) => {
  console.error('Error capturing proofs:', err);
  app.exit(1);
});
