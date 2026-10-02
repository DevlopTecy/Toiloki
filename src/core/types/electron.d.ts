export interface WindowControlsBridge {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizeChanged: (callback: (isMaximized: boolean) => void) => () => void;
}

export interface OpenDialogOptions {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

export interface DialogBridge {
  openFile: (options?: OpenDialogOptions) => Promise<{ canceled: boolean; filePaths: string[]; error?: string }>;
  saveFile: (options?: SaveDialogOptions) => Promise<{ canceled: boolean; filePath?: string; error?: string }>;
}

export interface FileStats {
  exists: boolean;
  size?: number;
  birthtime?: string;
  mtime?: string;
  isDirectory?: boolean;
  name?: string;
  ext?: string;
  error?: string;
}

export interface FsBridge {
  readFileBuffer: (filePath: string) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  readFileText: (filePath: string) => Promise<{ success: boolean; text?: string; error?: string }>;
  writeFileBuffer: (filePath: string, bufferData: Uint8Array | number[]) => Promise<{ success: boolean; bytesWritten?: number; error?: string }>;
  writeFileText: (filePath: string, text: string) => Promise<{ success: boolean; error?: string }>;
  getStats: (filePath: string) => Promise<FileStats>;
  createTempFile: (bufferData: Uint8Array | number[], extension?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  deleteTempFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
}

export interface ShellBridge {
  showInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
}

export interface ToilokiBridge {
  windowControls: WindowControlsBridge;
  dialog: DialogBridge;
  fs: FsBridge;
  shell: ShellBridge;
}

declare global {
  interface Window {
    toiloki?: ToilokiBridge;
  }
}
