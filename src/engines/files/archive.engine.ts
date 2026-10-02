import JSZip from 'jszip';
import { EngineResult } from '../../core/types/engine';
import { PathSecurity } from '../../core/file-processing/path-security';

export interface ArchiveEntry {
  name: string;
  size: number;
  compressedSize: number;
  isDir: boolean;
  date?: Date;
}

export class ArchiveEngine {
  /**
   * Create a ZIP archive from an array of file buffers
   */
  static async createZip(
    files: Array<{ name: string; buffer: Uint8Array }>
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const zip = new JSZip();
      for (const file of files) {
        const safeName = PathSecurity.sanitizeArchivePath(file.name);
        zip.file(safeName, file.buffer);
      }
      const content = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      return {
        success: true,
        data: content,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Inspect entries in a ZIP archive without extracting everything to disk
   */
  static async inspectZip(buffer: Uint8Array): Promise<EngineResult<ArchiveEntry[]>> {
    const start = performance.now();
    try {
      const zip = await JSZip.loadAsync(buffer);
      const entries: ArchiveEntry[] = [];

      zip.forEach((relativePath, file) => {
        entries.push({
          name: PathSecurity.sanitizeArchivePath(relativePath),
          size: (file as any)._data?.uncompressedSize || 0,
          compressedSize: (file as any)._data?.compressedSize || 0,
          isDir: file.dir,
          date: file.date,
        });
      });

      return {
        success: true,
        data: entries,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Extract files from a ZIP archive with strict Zip Slip directory traversal prevention
   */
  static async extractZip(
    buffer: Uint8Array
  ): Promise<EngineResult<Array<{ name: string; buffer: Uint8Array }>>> {
    const start = performance.now();
    try {
      const zip = await JSZip.loadAsync(buffer);
      const extracted: Array<{ name: string; buffer: Uint8Array }> = [];

      for (const [relativePath, file] of Object.entries(zip.files)) {
        if (!file.dir) {
          // Strict path sanitization against Zip Slip (e.g. "../../file")
          const safePath = PathSecurity.sanitizeArchivePath(relativePath);
          const content = await file.async('uint8array');
          extracted.push({ name: safePath, buffer: content });
        }
      }

      return {
        success: true,
        data: extracted,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Add files to an existing ZIP archive
   */
  static async addFilesToZip(
    existingZipBuffer: Uint8Array,
    newFiles: Array<{ name: string; buffer: Uint8Array }>
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const zip = await JSZip.loadAsync(existingZipBuffer);
      for (const f of newFiles) {
        const safeName = PathSecurity.sanitizeArchivePath(f.name);
        zip.file(safeName, f.buffer);
      }
      const updated = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      return {
        success: true,
        data: updated,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Remove files from an existing ZIP archive
   */
  static async removeFilesFromZip(
    existingZipBuffer: Uint8Array,
    fileNamesToRemove: string[]
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const zip = await JSZip.loadAsync(existingZipBuffer);
      for (const name of fileNamesToRemove) {
        zip.remove(name);
      }
      const updated = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      return {
        success: true,
        data: updated,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Compress data using GZIP via Web Streams API (standard in modern JS/Electron)
   */
  static async createGzip(data: Uint8Array): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      if (typeof CompressionStream !== 'undefined') {
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(data);
        writer.close();
        const output = await new Response(cs.readable).arrayBuffer();
        return {
          success: true,
          data: new Uint8Array(output),
          elapsedMs: Math.round(performance.now() - start),
        };
      } else {
        // Fallback to JSZip deflation
        const zip = new JSZip();
        zip.file('data', data);
        const out = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
        return {
          success: true,
          data: out,
          elapsedMs: Math.round(performance.now() - start),
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Decompress GZIP data via Web Streams API
   */
  static async decompressGzip(data: Uint8Array): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(data);
        writer.close();
        const output = await new Response(ds.readable).arrayBuffer();
        return {
          success: true,
          data: new Uint8Array(output),
          elapsedMs: Math.round(performance.now() - start),
        };
      } else {
        throw new Error('DecompressionStream not supported in this runtime environment');
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }
}

