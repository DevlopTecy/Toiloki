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

  const distHtml = path.join(__dirname, '../dist/index.html');

  // 1. Classic Layout
  console.log('Capturing Classic Layout...');
  await win.loadFile(distHtml);
  await new Promise((r) => setTimeout(r, 2000));
  await win.webContents.executeJavaScript(`(() => {
    const current = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
    current.layout = 'classic';
    localStorage.setItem('toiloki_settings', JSON.stringify(current));
    window.location.reload();
  })()`);
  await new Promise((r) => setTimeout(r, 2000));
  await saveShot('phase2-classic-layout.png');

  // 2. Workbench Layout - PDF Empty
  console.log('Capturing Workbench Layout PDF Empty...');
  await win.webContents.executeJavaScript(`(() => {
    const current = JSON.parse(localStorage.getItem('toiloki_settings') || '{}');
    current.layout = 'workbench';
    localStorage.setItem('toiloki_settings', JSON.stringify(current));
    window.location.reload();
  })()`);
  await new Promise((r) => setTimeout(r, 2000));
  
  // Navigate to PDF workspace
  await win.webContents.executeJavaScript(`(() => {
    const pdfBtn = document.querySelector('button[data-nav="pdf"]');
    if (pdfBtn) pdfBtn.click();
  })()`);
  await saveShot('phase2-workbench-pdf-empty.png', 1000);

  // 3. Workbench Layout - PDF with a file + Compress
  console.log('Capturing Workbench Layout PDF Compress...');
  // Click on "Compress PDF" if not already selected. The menu group is "Optimize".
  await win.webContents.executeJavaScript(`(() => {
    // We will select compress-pdf programmatically via the internal react state or mock a file drop
    // Actually, we can just dispatch an event to the dropzone or mock state, but simpler is just clicking "Compress PDF"
    const optimizeBtn = Array.from(document.querySelectorAll('.workbench-menu-btn')).find(b => b.textContent.includes('Optimize'));
    if (optimizeBtn) optimizeBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 500));
  
  await win.webContents.executeJavaScript(`(() => {
    const compressBtn = Array.from(document.querySelectorAll('.workbench-dropdown-item')).find(b => b.textContent.includes('Compress PDF'));
    if (compressBtn) compressBtn.click();
  })()`);
  
  // Mock dropping a file
  await win.webContents.executeJavaScript(`(() => {
    // Since we don't have a real file, we'll just inject one into the dropzone component's visual state 
    // Wait, since we are doing integration test screenshot, we need a way to mock files.
    // Let's create a fake File and dispatch a drop event.
    const file = new File(['mock content'], 'report.pdf', { type: 'application/pdf' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    const dropzone = document.querySelector('.file-dropzone') || document.querySelector('.workbench-empty-dropzone-wrapper > div');
    if (dropzone) {
      dropzone.dispatchEvent(new DragEvent('drop', { dataTransfer }));
    }
  })()`);
  
  await saveShot('phase2-workbench-pdf-compress.png', 1000);
  
  // Also take 1920x1080 screenshot
  console.log('Capturing 1920x1080...');
  win.setContentSize(1920, 1080);
  await saveShot('phase2-workbench-pdf-compress-1080p.png', 1000);

  console.log('All Phase 2 proof screenshots captured successfully!');
  app.quit();
}

run().catch((err) => {
  console.error('Error running proof capture:', err);
  process.exit(1);
});
