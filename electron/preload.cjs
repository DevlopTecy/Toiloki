// @ts-check
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('toiloki', {
  // Window Control API
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    setProgress: (progress) => ipcRenderer.send('window-set-progress', progress),
    flashFrame: (flag) => ipcRenderer.send('window-flash-frame', flag),
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

  // Background Image (toiloki-bg:// custom protocol — served from appData/backgrounds/)
  background: {
    pickImage: () => ipcRenderer.invoke('bg-pick-image'),
    removeImage: (fileName) => ipcRenderer.invoke('bg-remove-image', fileName),
  },

  // Desktop Notifications
  notification: {
    send: (title, options) => ipcRenderer.send('desktop-notify', { title, body: options?.body, icon: options?.icon }),
  },

  // App Lifecycle & Event Hooks (File Associations, Global Shortcuts, System Tray)
  appBridge: {
    onOpenFile: (callback) => {
      const handler = (_event, filePath) => callback(filePath);
      ipcRenderer.on('open-file-with-toiloki', handler);
      return () => ipcRenderer.removeListener('open-file-with-toiloki', handler);
    },
    onTriggerCommandPalette: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('trigger-command-palette', handler);
      return () => ipcRenderer.removeListener('trigger-command-palette', handler);
    },
    onTriggerSmartPaste: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('trigger-smart-paste', handler);
      return () => ipcRenderer.removeListener('trigger-smart-paste', handler);
    },
    onNavigateWorkspace: (callback) => {
      const handler = (_event, workspaceId) => callback(workspaceId);
      ipcRenderer.on('navigate-workspace', handler);
      return () => ipcRenderer.removeListener('navigate-workspace', handler);
    },
  },
});
