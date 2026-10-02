// @ts-check
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

/** @type {BrowserWindow | null} */
let mainWindow = null;

// Unique session ID for temp directory isolation
const sessionId = `session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
const sessionTempDir = path.join(os.tmpdir(), 'Toiloki-Temp', sessionId);

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Cleanup expired temp folders from previous crashed sessions (> 24 hours)
function pruneOldTempDirectories() {
  try {
    const baseTemp = path.join(os.tmpdir(), 'Toiloki-Temp');
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

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Toiloki',
    width: 1280,
    height: 840,
    minWidth: 1040,
    minHeight: 680,
    frame: false,
    backgroundColor: '#0B0F17',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
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
    const baseTemp = path.join(os.tmpdir(), 'Toiloki-Temp');
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

// App Lifecycle
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.toiloki.app');
  }
  ensureDirectoryExists(sessionTempDir);
  pruneOldTempDirectories();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  cleanSessionTemp();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
