/**
 * Safe Temporary File Manager
 * Handles local temporary file lifecycles with strict bounds checking
 * so user files can NEVER be accidentally deleted.
 */
export class TempFileManager {
  private static registeredTempFiles = new Set<string>();
  private static isUnloadHooked = false;

  private static ensureUnloadHook(): void {
    if (this.isUnloadHooked || typeof window === 'undefined') return;
    this.isUnloadHooked = true;

    window.addEventListener('beforeunload', () => {
      this.cleanupAllSync();
    });
  }

  /**
   * Create a safe temporary file on the local filesystem
   */
  static async createTempFile(
    data: Uint8Array | number[],
    extension = 'tmp'
  ): Promise<string> {
    this.ensureUnloadHook();

    if (window.toiloki?.fs?.createTempFile) {
      const res = await window.toiloki.fs.createTempFile(data, extension);
      if (res.success && res.filePath) {
        this.registeredTempFiles.add(res.filePath);
        return res.filePath;
      }
      throw new Error(res.error || 'Failed to create local temporary file');
    }

    // Fallback in web/preview mode: generate object URL
    const blob = new Blob([data instanceof Uint8Array ? data : new Uint8Array(data)]);
    const blobUrl = URL.createObjectURL(blob);
    this.registeredTempFiles.add(blobUrl);
    return blobUrl;
  }

  /**
   * Clean up a specific temporary file.
   * Safety check: ONLY files registered as temporary by Toiloki can be deleted.
   */
  static async cleanupFile(filePath: string): Promise<boolean> {
    if (!this.registeredTempFiles.has(filePath)) {
      // Safety guard: NEVER delete a file not created by this TempFileManager
      return false;
    }

    this.registeredTempFiles.delete(filePath);

    if (filePath.startsWith('blob:')) {
      URL.revokeObjectURL(filePath);
      return true;
    }

    if (window.toiloki?.fs?.deleteTempFile) {
      const res = await window.toiloki.fs.deleteTempFile(filePath);
      return !!res.success;
    }

    return true;
  }

  /**
   * Clean up all temporary files created in this session
   */
  static async cleanupAll(): Promise<void> {
    const files = Array.from(this.registeredTempFiles);
    for (const f of files) {
      await this.cleanupFile(f);
    }
  }

  /**
   * Synchronous cleanup for unload events
   */
  private static cleanupAllSync(): void {
    const files = Array.from(this.registeredTempFiles);
    for (const f of files) {
      if (f.startsWith('blob:')) {
        URL.revokeObjectURL(f);
      } else if (window.toiloki?.fs?.deleteTempFile) {
        window.toiloki.fs.deleteTempFile(f).catch(() => {});
      }
    }
    this.registeredTempFiles.clear();
  }

  /**
   * Get count of active tracked temp files
   */
  static getActiveTempFileCount(): number {
    return this.registeredTempFiles.size;
  }
}
