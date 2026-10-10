// src/core/platform/platform-adapter.ts
// Platform Adapter Abstraction Layer for Toiloki
// Provides a unified capability-driven contract across Electron (desktop),
// Web PWA (tablet/Chromebook), and Mobile/Capacitor environments.

import { initTauriBridge, isTauriEnvironment } from './tauri-bridge';

export type PlatformType = 'electron' | 'tauri' | 'web-pwa' | 'capacitor' | 'browser';

export interface PlatformCapabilities {
  platform: PlatformType;
  hasNativeFs: boolean;
  hasWindowControls: boolean;
  hasTray: boolean;
  hasSystemDiagnostics: boolean;
  hasClipboard: boolean;
  isOfflineGuaranteed: boolean;
  maxRecommendedBufferSizeMB: number;
}

export interface PlatformFile {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  buffer: Uint8Array;
}

export interface PlatformSaveResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface PlatformAdapter {
  getPlatformName(): PlatformType;
  getCapabilities(): PlatformCapabilities;

  // File picking and saving
  pickFiles(options?: { accept?: string[]; multiple?: boolean }): Promise<PlatformFile[]>;
  saveFile(data: Uint8Array | string, defaultName: string, mime?: string): Promise<PlatformSaveResult>;

  // Clipboard access
  readClipboardText(): Promise<string>;
  writeClipboardText(text: string): Promise<void>;

  // Window Controls
  minimizeWindow(): void;
  maximizeWindow(): void;
  closeWindow(): void;

  // Notification
  showNotification(title: string, body: string): void;
}

/**
 * Native Electron Desktop Implementation
 */
export class ElectronPlatformAdapter implements PlatformAdapter {
  private get toiloki(): any {
    return typeof window !== 'undefined' ? (window as any).toiloki : null;
  }

  getPlatformName(): PlatformType {
    return 'electron';
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: 'electron',
      hasNativeFs: true,
      hasWindowControls: true,
      hasTray: true,
      hasSystemDiagnostics: true,
      hasClipboard: true,
      isOfflineGuaranteed: true,
      maxRecommendedBufferSizeMB: 500,
    };
  }

  async pickFiles(options?: { accept?: string[]; multiple?: boolean }): Promise<PlatformFile[]> {
    if (!this.toiloki?.fs?.openFileDialog) {
      throw new Error('Electron filesystem bridge is not available');
    }

    const filters = options?.accept?.map((ext) => ({
      name: ext.toUpperCase().replace('.', ''),
      extensions: [ext.replace('.', '')],
    })) || [{ name: 'All Files', extensions: ['*'] }];

    const res = await this.toiloki.fs.openFileDialog({
      properties: options?.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters,
    });

    if (res.canceled || !res.filePaths || res.filePaths.length === 0) {
      return [];
    }

    const files: PlatformFile[] = [];
    for (const filePath of res.filePaths) {
      const readRes = await this.toiloki.fs.readFileBuffer(filePath);
      if (readRes.success && readRes.data) {
        const name = filePath.split(/[\\/]/).pop() || 'file';
        files.push({
          name,
          size: readRes.data.byteLength,
          type: '',
          buffer: new Uint8Array(readRes.data),
        });
      }
    }

    return files;
  }

  async saveFile(data: Uint8Array | string, defaultName: string, _mime?: string): Promise<PlatformSaveResult> {
    if (!this.toiloki?.fs?.saveFileDialog) {
      return { success: false, error: 'Electron filesystem bridge unavailable' };
    }

    const ext = defaultName.split('.').pop() || '*';
    const res = await this.toiloki.fs.saveFileDialog({
      defaultPath: defaultName,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });

    if (res.canceled || !res.filePath) {
      return { success: false };
    }

    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const writeRes = await this.toiloki.fs.writeFileBuffer(res.filePath, buffer);
    return {
      success: Boolean(writeRes.success),
      path: res.filePath,
      error: writeRes.error,
    };
  }

  async readClipboardText(): Promise<string> {
    if (this.toiloki?.clipboard?.readText) {
      const res = await this.toiloki.clipboard.readText();
      return res.text || '';
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      return navigator.clipboard.readText().catch(() => '');
    }
    return '';
  }

  async writeClipboardText(text: string): Promise<void> {
    if (this.toiloki?.clipboard?.writeText) {
      await this.toiloki.clipboard.writeText(text);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  }

  minimizeWindow(): void {
    this.toiloki?.appBridge?.minimize();
  }

  maximizeWindow(): void {
    this.toiloki?.appBridge?.maximize();
  }

  closeWindow(): void {
    this.toiloki?.appBridge?.close();
  }

  showNotification(title: string, body: string): void {
    if (this.toiloki?.appBridge?.notify) {
      this.toiloki.appBridge.notify(title, body);
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }
}

/**
 * Web PWA / Browser Platform Implementation (Tablet & PWA Feasibility)
 */
export class WebPlatformAdapter implements PlatformAdapter {
  getPlatformName(): PlatformType {
    return 'web-pwa';
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: 'web-pwa',
      hasNativeFs: typeof window !== 'undefined' && 'showOpenFilePicker' in window,
      hasWindowControls: false,
      hasTray: false,
      hasSystemDiagnostics: false,
      hasClipboard: typeof navigator !== 'undefined' && 'clipboard' in navigator,
      isOfflineGuaranteed: typeof window !== 'undefined' && 'serviceWorker' in navigator,
      maxRecommendedBufferSizeMB: 75,
    };
  }

  async pickFiles(options?: { accept?: string[]; multiple?: boolean }): Promise<PlatformFile[]> {
    if (typeof window === 'undefined') return [];

    // 1. Try modern File System Access API
    if ('showOpenFilePicker' in window) {
      try {
        const types = options?.accept?.map((ext) => ({
          description: ext.toUpperCase(),
          accept: { '*/*': [ext.startsWith('.') ? ext : `.${ext}`] },
        }));

        const handles = await (window as any).showOpenFilePicker({
          multiple: Boolean(options?.multiple),
          types,
        });

        const files: PlatformFile[] = [];
        for (const handle of handles) {
          const file: File = await handle.getFile();
          const buffer = new Uint8Array(await file.arrayBuffer());
          files.push({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            buffer,
          });
        }
        return files;
      } catch (err: any) {
        if (err.name === 'AbortError') return [];
        // Fallback to input element
      }
    }

    // 2. Standard HTML input element fallback
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = Boolean(options?.multiple);
      if (options?.accept) {
        input.accept = options.accept.join(',');
      }

      input.onchange = async () => {
        if (!input.files || input.files.length === 0) {
          resolve([]);
          return;
        }

        const files: PlatformFile[] = [];
        for (let i = 0; i < input.files.length; i++) {
          const f = input.files[i];
          const buffer = new Uint8Array(await f.arrayBuffer());
          files.push({
            name: f.name,
            size: f.size,
            type: f.type,
            lastModified: f.lastModified,
            buffer,
          });
        }
        resolve(files);
      };

      input.click();
    });
  }

  async saveFile(data: Uint8Array | string, defaultName: string, mime = 'application/octet-stream'): Promise<PlatformSaveResult> {
    if (typeof window === 'undefined') return { success: false, error: 'Window unavailable' };

    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;

    // 1. Try File System Access API save picker
    if ('showSaveFilePicker' in window) {
      try {
        const ext = defaultName.split('.').pop() || 'bin';
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultName,
          types: [{ description: 'File', accept: { [mime]: [`.${ext}`] } }],
        });

        const writable = await handle.createWritable();
        await writable.write(buffer);
        await writable.close();
        return { success: true };
      } catch (err: any) {
        if (err.name === 'AbortError') return { success: false };
        // Fallback to blob download
      }
    }

    // 2. Anchor Blob download fallback
    try {
      const blob = new Blob([buffer], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async readClipboardText(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return '';
      }
    }
    return '';
  }

  async writeClipboardText(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  }

  minimizeWindow(): void {
    // Web / PWA environments do not support explicit programmatic window minimization
  }

  maximizeWindow(): void {
    // In full-screen PWA mode, fullscreen can be requested if user gesture is active
    if (typeof document !== 'undefined' && document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  closeWindow(): void {
    if (typeof window !== 'undefined') {
      window.close();
    }
  }

  showNotification(title: string, body: string): void {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') new Notification(title, { body });
        });
      }
    }
  }
}

/**
 * Native Tauri + Rust Desktop Implementation
 */
export class TauriPlatformAdapter implements PlatformAdapter {
  private get toiloki(): any {
    return typeof window !== 'undefined' ? (window as any).toiloki : null;
  }

  getPlatformName(): PlatformType {
    return 'tauri';
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: 'tauri',
      hasNativeFs: true,
      hasWindowControls: true,
      hasTray: true,
      hasSystemDiagnostics: true,
      hasClipboard: true,
      isOfflineGuaranteed: true,
      maxRecommendedBufferSizeMB: 1024,
    };
  }

  async pickFiles(options?: { accept?: string[]; multiple?: boolean }): Promise<PlatformFile[]> {
    if (!this.toiloki?.dialog?.openFile || !this.toiloki?.fs?.readFileBuffer) {
      throw new Error('Tauri filesystem bridge is not available');
    }

    const filters = options?.accept?.map((ext) => ({
      name: ext.toUpperCase().replace('.', ''),
      extensions: [ext.replace('.', '')],
    })) || [{ name: 'All Files', extensions: ['*'] }];

    const res = await this.toiloki.dialog.openFile({
      properties: options?.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters,
    });

    if (res.canceled || !res.filePaths || res.filePaths.length === 0) {
      return [];
    }

    const files: PlatformFile[] = [];
    for (const filePath of res.filePaths) {
      const readRes = await this.toiloki.fs.readFileBuffer(filePath);
      if (readRes.success && readRes.data) {
        const name = filePath.split(/[\\/]/).pop() || 'file';
        files.push({
          name,
          size: readRes.data.byteLength,
          type: '',
          buffer: new Uint8Array(readRes.data),
        });
      }
    }

    return files;
  }

  async saveFile(data: Uint8Array | string, defaultName: string, _mime?: string): Promise<PlatformSaveResult> {
    if (!this.toiloki?.dialog?.saveFile || !this.toiloki?.fs?.writeFileBuffer) {
      return { success: false, error: 'Tauri filesystem bridge unavailable' };
    }

    const ext = defaultName.split('.').pop() || '*';
    const res = await this.toiloki.dialog.saveFile({
      defaultPath: defaultName,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });

    if (res.canceled || !res.filePath) {
      return { success: false };
    }

    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const writeRes = await this.toiloki.fs.writeFileBuffer(res.filePath, buffer);
    return {
      success: Boolean(writeRes.success),
      path: res.filePath,
      error: writeRes.error,
    };
  }

  async readClipboardText(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      return navigator.clipboard.readText().catch(() => '');
    }
    return '';
  }

  async writeClipboardText(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  }

  minimizeWindow(): void {
    this.toiloki?.windowControls?.minimize();
  }

  maximizeWindow(): void {
    this.toiloki?.windowControls?.maximize();
  }

  closeWindow(): void {
    this.toiloki?.windowControls?.close();
  }

  showNotification(title: string, body: string): void {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }
}

let activePlatformAdapter: PlatformAdapter | null = null;

/**
 * Returns the active platform adapter based on runtime environment detection.
 */
export function getPlatformAdapter(): PlatformAdapter {
  if (activePlatformAdapter) return activePlatformAdapter;

  initTauriBridge();

  const isTauri =
    typeof window !== 'undefined' &&
    (isTauriEnvironment() || Boolean((window as any).toiloki?.isTauri));

  if (isTauri) {
    activePlatformAdapter = new TauriPlatformAdapter();
    return activePlatformAdapter;
  }

  const isElectron =
    typeof window !== 'undefined' &&
    Boolean((window as any).toiloki?.isElectron || (window as any).process?.type === 'renderer');

  if (isElectron) {
    activePlatformAdapter = new ElectronPlatformAdapter();
  } else {
    activePlatformAdapter = new WebPlatformAdapter();
  }

  return activePlatformAdapter;
}

