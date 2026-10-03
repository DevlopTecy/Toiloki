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
    width: 1320,
    height: 860,
    show: false,
    frame: false,
    webPreferences: {
      offscreen: true,
    },
  });

  const saveShot = async (filename, delay = 1000) => {
    await new Promise((r) => setTimeout(r, delay));
    const image = await win.webContents.capturePage();
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, image.toPNG());
    console.log('Saved:', filename);
  };

  console.log('Loading app for Phase 4 verification...');
  await win.loadURL('http://localhost:4173/?nav=home&theme=dark');
  await new Promise((r) => setTimeout(r, 2200));

  // 1. Home Screen with Sidebar (Core 8 + More 5)
  console.log('Capturing 1: Home Dashboard with Core & More sidebar sections...');
  await saveShot('phase4-home-core-and-more.png', 1200);

  // 2. Collapse More Section in Sidebar
  console.log('Capturing 2: Collapsing More section in sidebar...');
  await win.webContents.executeJavaScript(`(() => {
    const toggles = document.querySelectorAll('.sidebar-section-toggle');
    // The second toggle is MORE
    if (toggles.length > 1) {
      toggles[1].click();
    }
  })()`);
  await saveShot('phase4-sidebar-collapsible.png', 1000);

  // Re-expand More Section
  await win.webContents.executeJavaScript(`(() => {
    const toggles = document.querySelectorAll('.sidebar-section-toggle');
    if (toggles.length > 1) {
      toggles[1].click();
    }
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  // 3. Settings > Appearance > Visible Workspaces toggles
  console.log('Capturing 3: Settings > Appearance visible workspaces toggles...');
  await win.loadURL('http://localhost:4173/?nav=settings&theme=dark');
  await new Promise((r) => setTimeout(r, 1200));
  // Scroll down to visible workspaces
  await win.webContents.executeJavaScript(`(() => {
    const content = document.querySelector('.settings-content-canvas');
    if (content) content.scrollTop = content.scrollHeight;
  })()`);
  await saveShot('phase4-settings-appearance-workspaces.png', 1000);

  // 4. Settings > Advanced > Show upcoming utilities toggle
  console.log('Capturing 4: Settings > Advanced upcoming utilities toggle...');
  // Click Advanced tab in settings nav
  await win.webContents.executeJavaScript(`(() => {
    const advTab = Array.from(document.querySelectorAll('.settings-nav-item')).find(el => el.textContent.includes('Advanced'));
    if (advTab) advTab.click();
  })()`);
  await saveShot('phase4-settings-advanced-upcoming.png', 1000);

  // 5. PDF Workspace with upcoming utilities HIDDEN (default: showUpcomingUtilities = false)
  console.log('Capturing 5: PDF Workspace with soon utilities hidden...');
  await win.loadURL('http://localhost:4173/?nav=pdf&theme=dark');
  await saveShot('phase4-pdf-soon-hidden.png', 1200);

  // 6. Turn on "Show upcoming utilities" and view PDF with newly registered 'soon' tools
  console.log('Capturing 6: Turn on Show upcoming utilities and view PDF workspace...');
  await win.webContents.executeJavaScript(`(() => {
    const raw = localStorage.getItem('toiloki_settings') || '{}';
    const settings = JSON.parse(raw);
    settings.showUpcomingUtilities = true;
    localStorage.setItem('toiloki_settings', JSON.stringify(settings));
    window.location.reload();
  })()`);
  await new Promise((r) => setTimeout(r, 2000));
  await saveShot('phase4-pdf-soon-visible.png', 1200);

  // 7. Click an upcoming tool: "Remove Blank Pages" (opens SoonState)
  console.log('Capturing 7: SoonState clean Not available yet screen...');
  await win.loadURL('http://localhost:4173/?nav=pdf&group=page-organizer&utility=pdf-remove-blank-pages&theme=dark');
  await saveShot('phase4-soon-state.png', 1200);

  // 8. Security & Privacy Workspace (New workspace with 12 tools)
  console.log('Capturing 8: Security & Privacy workspace...');
  await win.loadURL('http://localhost:4173/?nav=security&theme=dark');
  await saveShot('phase4-security-workspace.png', 1200);

  console.log('All Phase 4 proof screenshots captured successfully!');
  app.quit();
}

run().catch((err) => {
  console.error('Error during capture:', err);
  app.quit();
});
