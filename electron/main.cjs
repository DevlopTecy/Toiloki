const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  Notification,
  protocol,
  session,
} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {Tray | null} */
let tray = null;

// ─── 1. PORTABLE MODE DETECTION ───
// If ./portable_data exists adjacent to exe or dev root, isolate all storage there
const appDir = app.isPackaged ? path.dirname(process.execPath) : path.join(__dirname, '..');
const portableDataDir = path.join(appDir, 'portable_data');

if (fs.existsSync(portableDataDir) || process.argv.includes('--portable')) {
  try {
    ensureDirectoryExists(portableDataDir);
    const portableUserData = path.join(portableDataDir, 'user_data');
    const portableTemp = path.join(portableDataDir, 'temp');
    ensureDirectoryExists(portableUserData);
    ensureDirectoryExists(portableTemp);
    app.setPath('userData', portableUserData);
    app.setPath('temp', portableTemp);
  } catch (err) {
    console.error('Failed to configure portable storage:', err);
  }
}

// Unique session ID for temp directory isolation
const sessionId = `session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
const sessionTempDir = path.join(app.getPath('temp'), 'Toiloki-Temp', sessionId);

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Cleanup expired temp folders from previous crashed sessions (> 24 hours)
function pruneOldTempDirectories() {
  try {
    const baseTemp = path.join(app.getPath('temp'), 'Toiloki-Temp');
    if (!fs.existsSync(baseTemp)) return;
    const entries = fs.readdirSync(baseTemp, { withFileTypes: true });
    const now = Date.now();
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== sessionId) {
        const fullPath = path.join(baseTemp, entry.name);
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
    }
  } catch (err) {
    console.error('Failed to prune old temp directories:', err);
  }
}

function cleanSessionTemp() {
  try {
    if (fs.existsSync(sessionTempDir)) {
      fs.rmSync(sessionTempDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error('Failed to clean session temp directory:', err);
  }
}

// ─── 2. "OPEN WITH TOILOKI" FILE ARGUMENT EXTRACTOR ───
function extractFilePathFromArgs(args) {
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--') || arg.startsWith('-')) continue;
    try {
      if (fs.existsSync(arg) && fs.statSync(arg).isFile()) {
        return path.resolve(arg);
      }
    } catch {}
  }
  return null;
}

// ─── 3. SINGLE INSTANCE LOCK ───
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();

      const targetFile = extractFilePathFromArgs(commandLine);
      if (targetFile) {
        mainWindow.webContents.send('open-file-with-toiloki', targetFile);
      }
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Toiloki',
    width: 1280,
    height: 840,
    minWidth: 1040,
    minHeight: 680,
    frame: false,
    backgroundColor: '#0B0F17',
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Block new window creation and remote popups
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`[Offline Security] Blocked window.open to: ${url}`);
    return { action: 'deny' };
  });

  // Block external/remote navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (isDev && (url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:') || url.startsWith('http://[::1]:'))) {
      return;
    }
    event.preventDefault();
    console.warn(`[Offline Security] Blocked external navigation to: ${url}`);
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5174';
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && !process.env.SERVE_DIST) {
    mainWindow.loadURL(devUrl).catch(() => {
      setTimeout(() => {
        if (mainWindow) mainWindow.loadURL(devUrl);
      }, 1500);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();

      // Check if file was opened via CLI on cold boot
      const initialFile = extractFilePathFromArgs(process.argv);
      if (initialFile) {
        setTimeout(() => {
          mainWindow?.webContents.send('open-file-with-toiloki', initialFile);
        }, 800);
      }
    }
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximize-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximize-changed', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── 4. SYSTEM TRAY INITIALIZATION ───
function createTray() {
  try {
    const iconPath = path.join(__dirname, '../public/icon.png');
    let trayIcon;
    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } else {
      trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('Toiloki – Local Suite');

    const sendNav = (workspaceId) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('navigate-workspace', workspaceId);
      }
    };

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Toiloki',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Quick Smart Paste (Ctrl+Shift+V)',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('trigger-smart-paste');
          }
        },
      },
      {
        label: 'Open Search (Ctrl+K)',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('trigger-command-palette');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Workspaces',
        submenu: [
          { label: 'PDF', click: () => sendNav('pdf') },
          { label: 'Documents', click: () => sendNav('documents') },
          { label: 'Images', click: () => sendNav('images') },
          { label: 'Data', click: () => sendNav('data') },
          { label: 'Text', click: () => sendNav('text') },
          { label: 'Developer', click: () => sendNav('developer') },
          { label: 'Calculator', click: () => sendNav('calculator') },
          { label: 'Files & Archives', click: () => sendNav('files') },
          { label: 'Security & Privacy', click: () => sendNav('security') },
          { label: 'Audio & Video', click: () => sendNav('media') },
          { label: 'Network & Web', click: () => sendNav('network') },
          { label: 'Color & Design', click: () => sendNav('design') },
          { label: 'System & Maintenance', click: () => sendNav('system') },
        ],
      },
      { type: 'separator' },
      {
        label: 'Quit Toiloki',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (err) {
    console.error('Failed to create system tray:', err);
  }
}

// ─── 5. GLOBAL SHORTCUTS ───
function registerGlobalShortcuts() {
  try {
    // Global Ctrl+Alt+K for Omnisearch summon
    globalShortcut.register('CommandOrControl+Alt+K', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('trigger-command-palette');
      }
    });

    // Global Ctrl+Alt+V for Smart Paste summon
    globalShortcut.register('CommandOrControl+Alt+V', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('trigger-smart-paste');
      }
    });
  } catch (err) {
    console.error('Failed to register global shortcuts:', err);
  }
}

// Window control IPC handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// ─── TASKBAR PROGRESS & FLASH FRAME ───
ipcMain.on('window-set-progress', (_event, progress) => {
  if (mainWindow) {
    mainWindow.setProgressBar(typeof progress === 'number' ? progress : -1);
  }
});

ipcMain.on('window-flash-frame', (_event, flag) => {
  if (mainWindow) {
    mainWindow.flashFrame(!!flag);
  }
});

// ─── DESKTOP NOTIFICATIONS ───
ipcMain.on('desktop-notify', (_event, { title, body, icon }) => {
  if (Notification.isSupported()) {
    const iconPath = icon ? path.resolve(icon) : path.join(__dirname, '../public/icon.png');
    new Notification({
      title: title || 'Toiloki',
      body: body || '',
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
    }).show();
  }
});

// Native file dialogs
ipcMain.handle('dialog-open-file', async (_event, options = {}) => {
  if (!mainWindow) return { canceled: true, filePaths: [] };
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Select Files',
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: options.properties || ['openFile', 'multiSelections'],
    });
    return result;
  } catch (err) {
    return { canceled: true, error: String(err) };
  }
});

ipcMain.handle('dialog-save-file', async (_event, options = {}) => {
  if (!mainWindow) return { canceled: true, filePath: undefined };
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options.title || 'Save File',
      defaultPath: options.defaultPath,
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return result;
  } catch (err) {
    return { canceled: true, error: String(err) };
  }
});

// File I/O
ipcMain.handle('fs-read-file-buffer', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist' };
    }
    const buffer = fs.readFileSync(filePath);
    return { success: true, data: new Uint8Array(buffer) };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('fs-read-file-text', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist' };
    }
    const text = fs.readFileSync(filePath, 'utf-8');
    return { success: true, text };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('fs-write-file-buffer', async (_event, filePath, bufferData) => {
  try {
    ensureDirectoryExists(path.dirname(filePath));
    const buffer = Buffer.from(bufferData);
    fs.writeFileSync(filePath, buffer);
    return { success: true, bytesWritten: buffer.length };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('fs-write-file-text', async (_event, filePath, text) => {
  try {
    ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, text, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('fs-get-stats', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return { exists: false };
    const stat = fs.statSync(filePath);
    return {
      exists: true,
      size: stat.size,
      birthtime: stat.birthtime.toISOString(),
      mtime: stat.mtime.toISOString(),
      isDirectory: stat.isDirectory(),
      name: path.basename(filePath),
      ext: path.extname(filePath),
    };
  } catch (err) {
    return { exists: false, error: String(err) };
  }
});

ipcMain.handle('fs-create-temp-file', async (_event, bufferData, extension = 'tmp') => {
  try {
    ensureDirectoryExists(sessionTempDir);
    const fileName = `toiloki_${Date.now()}_${crypto.randomBytes(3).toString('hex')}.${extension.replace(/^\./, '')}`;
    const filePath = path.join(sessionTempDir, fileName);
    const buffer = Buffer.from(bufferData);
    fs.writeFileSync(filePath, buffer);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('fs-delete-temp-file', async (_event, filePath) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid path' };
    }
    const resolved = path.resolve(filePath);
    const baseTemp = path.join(app.getPath('temp'), 'Toiloki-Temp');
    if (!resolved.startsWith(baseTemp)) {
      return { success: false, error: 'Access denied: Path is outside Toiloki temp directory' };
    }
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('shell-show-in-folder', async (_event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return { success: true };
    }
    return { success: false, error: 'File does not exist' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('shell-open-path', async (_event, filePath) => {
  try {
    const error = await shell.openPath(filePath);
    return { success: !error, error };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

// ─── BACKGROUND IMAGE PROTOCOL & IPC ───
// Register a custom toiloki-bg:// protocol to safely serve wallpaper images
// This sidesteps file:// CSP issues in Electron packaged apps
app.on('ready', () => {
  const bgDir = path.join(app.getPath('userData'), 'backgrounds');
  if (!fs.existsSync(bgDir)) fs.mkdirSync(bgDir, { recursive: true });

  protocol.registerFileProtocol('toiloki-bg', (request, callback) => {
    try {
      const urlPath = decodeURIComponent(new URL(request.url).pathname);
      const fileName = path.basename(urlPath); // sanitize: no traversal
      const filePath = path.join(bgDir, fileName);
      if (!filePath.startsWith(bgDir)) {
        callback({ error: -10 }); // ACCESS_DENIED
        return;
      }
      callback({ path: filePath });
    } catch (err) {
      callback({ error: -2 }); // FAILED
    }
  });
});

// Pick background image from native dialog, copy to appData/backgrounds, return toiloki-bg:// URL
ipcMain.handle('bg-pick-image', async () => {
  if (!mainWindow) return { canceled: true };
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Background Image',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };

    const srcPath = result.filePaths[0];
    const srcBuf = fs.readFileSync(srcPath);
    const hash = crypto.createHash('sha256').update(srcBuf).digest('hex').slice(0, 16);
    const ext = path.extname(srcPath).toLowerCase() || '.jpg';
    const fileName = `bg_${hash}${ext}`;
    const bgDir = path.join(app.getPath('userData'), 'backgrounds');
    if (!fs.existsSync(bgDir)) fs.mkdirSync(bgDir, { recursive: true });
    const destPath = path.join(bgDir, fileName);
    if (!fs.existsSync(destPath)) fs.copyFileSync(srcPath, destPath);

    return { canceled: false, fileName, url: `toiloki-bg://${fileName}` };
  } catch (err) {
    return { canceled: true, error: String(err) };
  }
});

// Remove a background image from appData/backgrounds
ipcMain.handle('bg-remove-image', async (_event, fileName) => {
  try {
    if (!fileName || typeof fileName !== 'string') return { success: false };
    const bgDir = path.join(app.getPath('userData'), 'backgrounds');
    const filePath = path.join(bgDir, path.basename(fileName));
    if (!filePath.startsWith(bgDir)) return { success: false, error: 'Access denied' };
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

// App Lifecycle
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.toiloki.app');
  }
  ensureDirectoryExists(sessionTempDir);
  pruneOldTempDirectories();

  // Cancel every HTTP/HTTPS request in session except dev server
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    const url = details.url;
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (isDev && (url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:') || url.startsWith('http://[::1]:'))) {
        callback({ cancel: false });
        return;
      }
      console.warn(`[Offline Security] Blocked remote network request: ${url}`);
      callback({ cancel: true });
      return;
    }
    callback({ cancel: false });
  });

  createWindow();
  createTray();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  cleanSessionTemp();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
