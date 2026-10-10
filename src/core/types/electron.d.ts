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

export interface BackgroundBridge {
  pickImage: () => Promise<{ canceled: boolean; fileName?: string; url?: string; error?: string }>;
  removeImage: (fileName: string) => Promise<{ success: boolean; error?: string }>;
}

export interface RustFileHashItem {
  path: string;
  name: string;
  size: number;
  hash?: string;
  error?: string;
}

export interface RustSystemStats {
  total_memory_mb: number;
  used_memory_mb: number;
  free_memory_mb: number;
  memory_percentage: number;
  cpu_count: number;
  cpu_usage_percentage: number;
  os_name: string;
  os_version: string;
  host_name: string;
}

export interface RustRenamePreviewItem {
  original: string;
  proposed: string;
  has_changed: boolean;
}

export interface RustMultiHashItem {
  path: string;
  name: string;
  size: number;
  sha256: string;
  sha512: string;
}

export interface RustEngineBridge {
  computeSha256: (filePath: string) => Promise<string>;
  computeMultiHash?: (filePath: string) => Promise<RustMultiHashItem>;
  batchHashFiles: (filePaths: string[]) => Promise<RustFileHashItem[]>;
  getSystemStats: () => Promise<RustSystemStats>;
  batchRenamePreview: (options: {
    files: string[];
    prefix: string;
    suffix: string;
    find_str: string;
    replace_str: string;
    start_number: number;
    pad_zeros: number;
  }) => Promise<RustRenamePreviewItem[]>;
}

export interface ToilokiBridge {
  isTauri?: boolean;
  isElectron?: boolean;
  windowControls: WindowControlsBridge;
  dialog: DialogBridge;
  fs: FsBridge;
  shell: ShellBridge;
  background?: BackgroundBridge;
  rustEngine?: RustEngineBridge;
}

declare global {
  interface Window {
    toiloki?: ToilokiBridge;
    __TAURI_INTERNALS__?: any;
    __TAURI__?: any;
  }
}

