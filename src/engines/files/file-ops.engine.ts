import { EngineResult } from '../../core/types/engine';

export interface RenameRule {
  prefix?: string;
  suffix?: string;
  findText?: string;
  replaceText?: string;
  caseTransform?: 'lower' | 'upper' | 'capitalize' | 'none';
  numberingStart?: number;
  numberingDigits?: number;
}

export interface FileTypeInfo {
  mime: string;
  extension: string;
  description: string;
  magicHex: string;
}

export class FileOpsEngine {
  /**
   * Preview or apply batch renaming to a list of file names
   */
  static applyBatchRename(
    fileNames: string[],
    rule: RenameRule
  ): EngineResult<Array<{ original: string; renamed: string }>> {
    const start = performance.now();
    try {
      const results = fileNames.map((name, index) => {
        const lastDot = name.lastIndexOf('.');
        let base = lastDot !== -1 ? name.substring(0, lastDot) : name;
        const ext = lastDot !== -1 ? name.substring(lastDot) : '';

        // Find and replace
        if (rule.findText) {
          base = base.replaceAll(rule.findText, rule.replaceText || '');
        }

        // Case transform
        if (rule.caseTransform === 'lower') base = base.toLowerCase();
        else if (rule.caseTransform === 'upper') base = base.toUpperCase();
        else if (rule.caseTransform === 'capitalize') {
          base = base.charAt(0).toUpperCase() + base.slice(1);
        }

        // Prefix & Suffix
        if (rule.prefix) base = rule.prefix + base;
        if (rule.suffix) base = base + rule.suffix;

        // Numbering
        if (rule.numberingStart !== undefined) {
          const num = rule.numberingStart + index;
          const padded = String(num).padStart(rule.numberingDigits || 1, '0');
          base = `${base}_${padded}`;
        }

        return {
          original: name,
          renamed: `${base}${ext}`,
        };
      });

      return {
        success: true,
        data: results,
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
   * Calculate SHA-256 hash using native Web Crypto API (fast and standard)
   */
  static async calculateSha256(buffer: Uint8Array): Promise<EngineResult<string>> {
    const start = performance.now();
    try {
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(digest));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      return {
        success: true,
        data: hashHex,
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
   * Detect true file format from magic bytes signatures
   */
  static detectFileType(buffer: Uint8Array, fileName: string): EngineResult<FileTypeInfo> {
    const start = performance.now();
    try {
      const hex = Array.from(buffer.slice(0, 8))
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');

      let mime = 'application/octet-stream';
      let extension = fileName.split('.').pop() || 'bin';
      let description = 'Binary or Raw Data';

      if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        mime = 'application/pdf';
        extension = 'pdf';
        description = 'Portable Document Format (PDF)';
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        mime = 'image/png';
        extension = 'png';
        description = 'Portable Network Graphics (PNG)';
      } else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        mime = 'image/jpeg';
        extension = 'jpg';
        description = 'JPEG Image';
      } else if (buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 0x03 || buffer[2] === 0x05)) {
        if (fileName.endsWith('.docx')) {
          mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          extension = 'docx';
          description = 'Microsoft Word OpenXML Document';
        } else if (fileName.endsWith('.xlsx')) {
          mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          description = 'Microsoft Excel OpenXML Spreadsheet';
        } else {
          mime = 'application/zip';
          extension = 'zip';
          description = 'ZIP Archive';
        }
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        mime = 'image/gif';
        extension = 'gif';
        description = 'Graphics Interchange Format (GIF)';
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        mime = 'image/webp';
        extension = 'webp';
        description = 'WebP Image';
      } else if (
        // UTF-8 check for JSON / CSV / Text
        buffer.slice(0, 100).every((b) => b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126))
      ) {
        const textSample = new TextDecoder().decode(buffer.slice(0, 100)).trim();
        if (textSample.startsWith('{') || textSample.startsWith('[')) {
          mime = 'application/json';
          extension = 'json';
          description = 'JavaScript Object Notation (JSON)';
        } else if (textSample.startsWith('<')) {
          mime = 'application/xml';
          extension = 'xml';
          description = 'Extensible Markup Language (XML)';
        } else {
          mime = 'text/plain';
          extension = 'txt';
          description = 'Plain Text Document';
        }
      }

      return {
        success: true,
        data: { mime, extension, description, magicHex: hex },
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
   * Compare two binary file buffers
   */
  static compareBuffers(
    bufA: Uint8Array,
    bufB: Uint8Array
  ): EngineResult<{ identical: boolean; byteDifference: number; sizeA: number; sizeB: number }> {
    const start = performance.now();
    try {
      const sizeA = bufA.length;
      const sizeB = bufB.length;
      const byteDifference = Math.abs(sizeA - sizeB);

      let identical = sizeA === sizeB;
      if (identical) {
        for (let i = 0; i < sizeA; i++) {
          if (bufA[i] !== bufB[i]) {
            identical = false;
            break;
          }
        }
      }

      return {
        success: true,
        data: { identical, byteDifference, sizeA, sizeB },
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
   * Calculate multiple cryptographic hashes (SHA-256 and SHA-1) using Web Crypto
   */
  static async calculateHashes(buffer: Uint8Array): Promise<EngineResult<{ sha256: string; sha1: string }>> {
    const start = performance.now();
    try {
      const digest256 = await crypto.subtle.digest('SHA-256', buffer);
      const sha256 = Array.from(new Uint8Array(digest256))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const digest1 = await crypto.subtle.digest('SHA-1', buffer);
      const sha1 = Array.from(new Uint8Array(digest1))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      return {
        success: true,
        data: { sha256, sha1 },
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
   * Complete file analysis: extension, mime, formatted size, timestamps, and hashes
   */
  static async analyzeFile(file: {
    name: string;
    size: number;
    lastModified?: number;
    buffer?: Uint8Array;
  }): Promise<EngineResult<{
    name: string;
    extension: string;
    mime: string;
    sizeBytes: number;
    sizeFormatted: string;
    lastModifiedIso: string;
    sha256?: string;
  }>> {
    const start = performance.now();
    try {
      const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
      let mime = 'application/octet-stream';
      if (file.buffer) {
        const typeInfo = this.detectFileType(file.buffer, file.name);
        if (typeInfo.success && typeInfo.data) {
          mime = typeInfo.data.mime;
        }
      }

      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      };

      let sha256: string | undefined;
      if (file.buffer) {
        const hashRes = await this.calculateSha256(file.buffer);
        if (hashRes.success && hashRes.data) {
          sha256 = hashRes.data;
        }
      }

      return {
        success: true,
        data: {
          name: file.name,
          extension: ext,
          mime,
          sizeBytes: file.size,
          sizeFormatted: formatSize(file.size),
          lastModifiedIso: new Date(file.lastModified || Date.now()).toISOString(),
          sha256,
        },
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
   * Two-phase duplicate finder:
   * Phase 1: Group files by exact byte size (skips hashing non-candidates).
   * Phase 2: Compute cryptographic hash only for size candidates.
   */
  static async findDuplicates(
    files: Array<{ name: string; path?: string; size: number; buffer?: Uint8Array }>,
    onProgress?: (progress: { percent: number; stage: string }) => void,
    signal?: AbortSignal
  ): Promise<EngineResult<{
    groups: Array<{
      hash: string;
      size: number;
      files: Array<{ name: string; path?: string; index: number }>;
      wastedBytes: number;
    }>;
    totalWastedBytes: number;
    totalDuplicates: number;
  }>> {
    const start = performance.now();
    try {
      if (files.length < 2) {
        return {
          success: true,
          data: { groups: [], totalWastedBytes: 0, totalDuplicates: 0 },
          elapsedMs: 0,
        };
      }

      onProgress?.({ percent: 10, stage: 'Grouping files by size...' });

      // Step 1: Bucket by size
      const sizeBuckets = new Map<number, Array<{ file: typeof files[0]; index: number }>>();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const bucket = sizeBuckets.get(f.size) || [];
        bucket.push({ file: f, index: i });
        sizeBuckets.set(f.size, bucket);
      }

      // Filter only buckets with >= 2 items
      const candidateBuckets = Array.from(sizeBuckets.entries()).filter(([, list]) => list.length > 1);

      const hashGroups = new Map<string, { size: number; files: Array<{ name: string; path?: string; index: number }> }>();
      let processedCandidates = 0;
      const totalCandidates = candidateBuckets.reduce((acc, [, list]) => acc + list.length, 0);

      // Step 2: Hash only candidates
      for (const [size, list] of candidateBuckets) {
        if (signal?.aborted) throw new Error('Operation cancelled by user.');

        for (const item of list) {
          if (signal?.aborted) throw new Error('Operation cancelled by user.');

          processedCandidates++;
          onProgress?.({
            percent: 20 + Math.round((processedCandidates / (totalCandidates || 1)) * 75),
            stage: `Hashing candidate ${processedCandidates} of ${totalCandidates}...`,
          });

          let hash: string;
          if (item.file.buffer) {
            const digest = await crypto.subtle.digest('SHA-256', item.file.buffer);
            hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
          } else {
            // Path-based fallback hash
            hash = `size_${size}_name_${item.file.name}`;
          }

          const existing = hashGroups.get(hash);
          if (existing) {
            existing.files.push({ name: item.file.name, path: item.file.path, index: item.index });
          } else {
            hashGroups.set(hash, {
              size,
              files: [{ name: item.file.name, path: item.file.path, index: item.index }],
            });
          }
        }
      }

      // Step 3: Filter true duplicate groups (count > 1)
      const duplicateGroups: Array<{
        hash: string;
        size: number;
        files: Array<{ name: string; path?: string; index: number }>;
        wastedBytes: number;
      }> = [];

      let totalWastedBytes = 0;
      let totalDuplicates = 0;

      for (const [hash, group] of hashGroups.entries()) {
        if (group.files.length > 1) {
          const wasted = (group.files.length - 1) * group.size;
          totalWastedBytes += wasted;
          totalDuplicates += group.files.length - 1;
          duplicateGroups.push({
            hash,
            size: group.size,
            files: group.files,
            wastedBytes: wasted,
          });
        }
      }

      return {
        success: true,
        data: {
          groups: duplicateGroups,
          totalWastedBytes,
          totalDuplicates,
        },
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
