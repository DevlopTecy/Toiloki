// @ts-check
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('toiloki', {
  // Window Control API
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    onMaximizeChanged: (callback) => {
      const handler = (_event, isMaximized) => callback(isMaximized);
      ipcRenderer.on('window-maximize-changed', handler);
      return () => ipcRenderer.removeListener('window-maximize-changed', handler);
    },
  },

  // Native Dialogs
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog-open-file', options),
    saveFile: (options) => ipcRenderer.invoke('dialog-save-file', options),
  },

  // File System
  fs: {
    readFileBuffer: (filePath) => ipcRenderer.invoke('fs-read-file-buffer', filePath),
    readFileText: (filePath) => ipcRenderer.invoke('fs-read-file-text', filePath),
    writeFileBuffer: (filePath, bufferData) => ipcRenderer.invoke('fs-write-file-buffer', filePath, bufferData),
    writeFileText: (filePath, text) => ipcRenderer.invoke('fs-write-file-text', filePath, text),
    getStats: (filePath) => ipcRenderer.invoke('fs-get-stats', filePath),
    createTempFile: (bufferData, extension) => ipcRenderer.invoke('fs-create-temp-file', bufferData, extension),
    deleteTempFile: (filePath) => ipcRenderer.invoke('fs-delete-temp-file', filePath),
  },

  // Shell Actions
  shell: {
    showInFolder: (filePath) => ipcRenderer.invoke('shell-show-in-folder', filePath),
    openPath: (filePath) => ipcRenderer.invoke('shell-open-path', filePath),
  },
});
