// src/core/platform/tauri-bridge.ts
// Native Tauri & Rust Bridge for Toiloki
// Provides a transparent drop-in implementation of window.toiloki
// backed by high-performance Rust commands in src-tauri.

import type {
  ToilokiBridge,
  WindowControlsBridge,
  DialogBridge,
  FsBridge,
  ShellBridge,
  BackgroundBridge,
  RustEngineBridge,
} from '../types/electron';

/**
 * Checks if the current environment is running inside a Tauri WebView.
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).__TAURI_INTERNALS__ ||
    (window as any).__TAURI__ ||
    (window as any).__TAURI_METADATA__
  );
}

/**
 * Dynamically invokes a Tauri Rust command through the internal Tauri bridge.
 */
export async function invokeTauri<T = any>(command: string, args: Record<string, any> = {}): Promise<T> {
  const tauriInternals = (window as any).__TAURI_INTERNALS__;
  if (tauriInternals?.invoke) {
    return tauriInternals.invoke(command, args);
  }

  const tauriGlobal = (window as any).__TAURI__;
  if (tauriGlobal?.core?.invoke) {
    return tauriGlobal.core.invoke(command, args);
  }

  throw new Error(`Tauri IPC not available for command "${command}"`);
}

/**
 * Creates the window controls bridge backed by Rust.
 */
function createTauriWindowControls(): WindowControlsBridge {
  return {
    minimize: () => {
      invokeTauri('window_minimize').catch((err) => console.error('Tauri minimize error:', err));
    },
    maximize: () => {
      invokeTauri('window_maximize').catch((err) => console.error('Tauri maximize error:', err));
    },
    close: () => {
      invokeTauri('window_close').catch((err) => console.error('Tauri close error:', err));
    },
    isMaximized: async () => {
      try {
        return await invokeTauri<boolean>('window_is_maximized');
      } catch {
        return false;
      }
    },
    onMaximizeChanged: (callback: (isMaximized: boolean) => void) => {
      const handleResize = () => {
        invokeTauri<boolean>('window_is_maximized')
          .then(callback)
          .catch(() => {});
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    },
  };
}

/**
 * Creates the native file dialogs bridge backed by Rust (rfd).
 */
function createTauriDialog(): DialogBridge {
  return {
    openFile: async (options) => {
      try {
        const res = await invokeTauri<{ canceled: boolean; filePaths: string[]; error?: string }>('dialog_open_file', {
          options,
        });
        return {
          canceled: Boolean(res.canceled),
          filePaths: res.filePaths || [],
          error: res.error,
        };
      } catch (err: any) {
        return { canceled: true, filePaths: [], error: err?.message || String(err) };
      }
    },
    saveFile: async (options) => {
      try {
        const res = await invokeTauri<{ canceled: boolean; filePath?: string; error?: string }>('dialog_save_file', {
          options,
        });
        return {
          canceled: Boolean(res.canceled),
          filePath: res.filePath,
          error: res.error,
        };
      } catch (err: any) {
        return { canceled: true, error: err?.message || String(err) };
      }
    },
  };
}

/**
 * Creates the file system bridge backed by Rust.
 */
function createTauriFs(): FsBridge {
  return {
    readFileBuffer: async (filePath: string) => {
      try {
        const res = await invokeTauri<{ success: boolean; data?: number[]; error?: string }>('fs_read_file_buffer', {
          filePath,
        });
        return {
          success: res.success,
          data: res.data ? new Uint8Array(res.data) : undefined,
          error: res.error,
        };
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    },
    readFileText: async (filePath: string) => {
      try {
        return await invokeTauri<{ success: boolean; text?: string; error?: string }>('fs_read_file_text', {
          filePath,
        });
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    },
    writeFileBuffer: async (filePath: string, bufferData: Uint8Array | number[]) => {
      try {
        const arrayData = Array.from(bufferData);
        return await invokeTauri<{ success: boolean; bytesWritten?: number; error?: string }>('fs_write_file_buffer', {
          filePath,
          bufferData: arrayData,
        });
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    },
    writeFileText: async (filePath: string, text: string) => {
      try {
        return await invokeTauri<{ success: boolean; error?: string }>('fs_write_file_text', {
          filePath,
          text,
        });
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    },
    getStats: async (filePath: string) => {
      try {
        return await invokeTauri('fs_get_stats', { filePath });
      } catch (err: any) {
        return { exists: false, error: err?.message || String(err) };
      }
    },
    createTempFile: async (bufferData: Uint8Array | number[], extension?: string) => {
      try {
        const arrayData = Array.from(bufferData);
        return await invokeTauri<{ success: boolean; filePath?: string; error?: string }>('fs_create_temp_file', {
          bufferData: arrayData,
          extension: extension || 'tmp',
        });
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    },
    deleteTempFile: async (filePath: string) => {
      try {
        return await invokeTauri<{ success: boolean; error?: string }>('fs_delete_temp_file', {
          filePath,
        });
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    },
  };
}

/**
 * Creates the shell bridge backed by Rust.
 */
function createTauriShell(): ShellBridge {
  return {
    showInFolder: async (filePath: string) => {
      try {
        return await invokeTauri<{ success: boolean; error?: string }>('shell_show_in_folder', {
          filePath,
        });
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    },
    openPath: async (filePath: string) => {
      try {
        return await invokeTauri<{ success: boolean; error?: string }>('shell_open_path', {
          filePath,
        });
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    },
  };
}

/**
 * Creates the wallpaper bridge backed by Rust.
 */
function createTauriBackground(): BackgroundBridge {
  return {
    pickImage: async () => {
      try {
        return await invokeTauri('bg_pick_image');
      } catch (err: any) {
        return { canceled: true, error: err?.message || String(err) };
      }
    },
    removeImage: async (fileName: string) => {
      try {
        return await invokeTauri('bg_remove_image', { fileName });
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    },
  };
}

/**
 * Creates the native Rust engine bridge for high-performance operations.
 */
function createTauriRustEngine(): RustEngineBridge {
  return {
    computeSha256: async (filePath: string) => {
      return await invokeTauri<string>('engine_compute_sha256', { filePath });
    },
    computeMultiHash: async (filePath: string) => {
      return await invokeTauri('engine_compute_multi_hash', { filePath });
    },
    batchHashFiles: async (filePaths: string[]) => {
      return await invokeTauri('engine_batch_hash_files', { filePaths });
    },
    getSystemStats: async () => {
      return await invokeTauri('engine_get_system_stats');
    },
    batchRenamePreview: async (options) => {
      return await invokeTauri('engine_batch_rename_preview', options);
    },
  };
}

/**
 * Initializes the Tauri bridge on window.toiloki if running in Tauri.
 * Safe to call repeatedly or in non-Tauri environments (no-op).
 */
export function initTauriBridge(): boolean {
  if (typeof window === 'undefined') return false;

  if (isTauriEnvironment() && !window.toiloki) {
    const bridge: ToilokiBridge = {
      isTauri: true,
      isElectron: false,
      windowControls: createTauriWindowControls(),
      dialog: createTauriDialog(),
      fs: createTauriFs(),
      shell: createTauriShell(),
      background: createTauriBackground(),
      rustEngine: createTauriRustEngine(),
    };

    window.toiloki = bridge;
    return true;
  }

  // If window.toiloki already exists (e.g. injected or hybrid), ensure rustEngine is mounted if in Tauri
  if (isTauriEnvironment() && window.toiloki && !window.toiloki.rustEngine) {
    window.toiloki.rustEngine = createTauriRustEngine();
    window.toiloki.isTauri = true;
  }

  return Boolean(window.toiloki?.isTauri);
}
