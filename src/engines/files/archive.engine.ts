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

  /**
   * Pack an array of files into a standard POSIX ustar TAR archive
   */
  static createTar(
    files: Array<{ name: string; buffer: Uint8Array }>
  ): EngineResult<Uint8Array> {
    const start = performance.now();
    try {
      const blocks: Uint8Array[] = [];

      for (const file of files) {
        const safeName = PathSecurity.sanitizeArchivePath(file.name);
        const header = new Uint8Array(512);

        const enc = new TextEncoder();
        const nameBytes = enc.encode(safeName);
        header.set(nameBytes.slice(0, 100), 0);

        header.set(enc.encode('0000644\0'), 100);
        header.set(enc.encode('0000000\0'), 108);
        header.set(enc.encode('0000000\0'), 116);

        const sizeOctal = file.buffer.length.toString(8).padStart(11, '0') + ' ';
        header.set(enc.encode(sizeOctal), 124);

        const mtimeOctal = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + ' ';
        header.set(enc.encode(mtimeOctal), 136);

        header[156] = 0x30; // '0'

        header.set(enc.encode('ustar\0'), 257);
        header.set(enc.encode('00'), 263);

        header.fill(0x20, 148, 156);
        let chksum = 0;
        for (let b = 0; b < 512; b++) chksum += header[b];
        const chksumStr = chksum.toString(8).padStart(6, '0') + '\0 ';
        header.set(enc.encode(chksumStr), 148);

        blocks.push(header);
        blocks.push(file.buffer);

        const remainder = file.buffer.length % 512;
        if (remainder > 0) {
          blocks.push(new Uint8Array(512 - remainder));
        }
      }

      blocks.push(new Uint8Array(1024));

      const totalLen = blocks.reduce((acc, b) => acc + b.length, 0);
      const out = new Uint8Array(totalLen);
      let offset = 0;
      for (const b of blocks) {
        out.set(b, offset);
        offset += b.length;
      }

      return {
        success: true,
        data: out,
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
   * Extract files from an uncompressed TAR archive
   */
  static extractTar(
    buffer: Uint8Array
  ): EngineResult<Array<{ name: string; buffer: Uint8Array }>> {
    const start = performance.now();
    try {
      const extracted: Array<{ name: string; buffer: Uint8Array }> = [];
      const dec = new TextDecoder();
      let offset = 0;

      while (offset + 512 <= buffer.length) {
        let isZero = true;
        for (let i = 0; i < 512; i++) {
          if (buffer[offset + i] !== 0) {
            isZero = false;
            break;
          }
        }
        if (isZero) break;

        const nameRaw = dec.decode(buffer.subarray(offset, offset + 100)).replace(/\0.*$/, '').trim();
        if (!nameRaw) break;

        const sizeStr = dec.decode(buffer.subarray(offset + 124, offset + 136)).replace(/\0.*$/, '').trim();
        const size = parseInt(sizeStr, 8) || 0;
        const typeFlag = String.fromCharCode(buffer[offset + 156]);

        offset += 512;
        if (offset + size > buffer.length) break;

        if (typeFlag === '0' || typeFlag === '\0' || typeFlag === '') {
          const content = buffer.slice(offset, offset + size);
          const safeName = PathSecurity.sanitizeArchivePath(nameRaw);
          extracted.push({ name: safeName, buffer: content });
        }

        offset += Math.ceil(size / 512) * 512;
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
   * Inspect entries in an uncompressed TAR archive without extracting files
   */
  static inspectTar(buffer: Uint8Array): EngineResult<ArchiveEntry[]> {
    const start = performance.now();
    try {
      const entries: ArchiveEntry[] = [];
      const dec = new TextDecoder();
      let offset = 0;

      while (offset + 512 <= buffer.length) {
        let isZero = true;
        for (let i = 0; i < 512; i++) {
          if (buffer[offset + i] !== 0) {
            isZero = false;
            break;
          }
        }
        if (isZero) break;

        const nameRaw = dec.decode(buffer.subarray(offset, offset + 100)).replace(/\0.*$/, '').trim();
        if (!nameRaw) break;

        const sizeStr = dec.decode(buffer.subarray(offset + 124, offset + 136)).replace(/\0.*$/, '').trim();
        const size = parseInt(sizeStr, 8) || 0;
        const typeFlag = String.fromCharCode(buffer[offset + 156]);
        const mtimeStr = dec.decode(buffer.subarray(offset + 136, offset + 148)).replace(/\0.*$/, '').trim();
        const mtimeSec = parseInt(mtimeStr, 8) || 0;

        offset += 512;
        if (offset + size > buffer.length) break;

        const isDir = typeFlag === '5' || nameRaw.endsWith('/');
        const safeName = PathSecurity.sanitizeArchivePath(nameRaw);

        entries.push({
          name: safeName,
          size,
          compressedSize: size,
          isDir,
          date: mtimeSec > 0 ? new Date(mtimeSec * 1000) : undefined,
        });

        offset += Math.ceil(size / 512) * 512;
      }

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
   * Check if buffer matches 7z file signature
   */
  static is7zArchive(buffer: Uint8Array): boolean {
    if (buffer.length < 6) return false;
    return (
      buffer[0] === 0x37 &&
      buffer[1] === 0x7a &&
      buffer[2] === 0xbc &&
      buffer[3] === 0xaf &&
      buffer[4] === 0x27 &&
      buffer[5] === 0x1c
    );
  }

  /**
   * Inspect 7z archive header and metadata
   */
  static inspect7z(buffer: Uint8Array): EngineResult<ArchiveEntry[]> {
    const start = performance.now();
    try {
      if (!ArchiveEngine.is7zArchive(buffer)) {
        throw new Error('File does not match standard 7z signature (37 7A BC AF 27 1C)');
      }
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const majorVer = view.getUint8(6);
      const minorVer = view.getUint8(7);
      const nextHeaderOffset = Number(view.getBigUint64(12, true));
      const nextHeaderSize = Number(view.getBigUint64(20, true));

      const entries: ArchiveEntry[] = [
        {
          name: `7z Archive (v${majorVer}.${minorVer}, Header: ${nextHeaderSize}B at offset 0x${nextHeaderOffset.toString(16)})`,
          size: buffer.length,
          compressedSize: buffer.length,
          isDir: false,
        },
      ];

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
}


