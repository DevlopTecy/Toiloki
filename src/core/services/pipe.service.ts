import { WorkspaceId } from '../types/workspace';
import { WORKSPACES } from '../registry/app-registry';

export interface PipedData {
  sourceUtilityId?: string;
  sourceUtilityName?: string;
  targetUtilityId: string;
  timestamp: number;
  text?: string;
  buffer?: Uint8Array;
  fileName?: string;
  format?: string;
}

export interface PipeTargetOption {
  workspaceId: WorkspaceId;
  groupId: string;
  utilityId: string;
  name: string;
  description: string;
  category: 'text' | 'image' | 'pdf' | 'data' | 'archive' | 'any';
}

const PIPE_STORAGE_KEY = 'toiloki_pipe_pending';

export class PipeService {
  private static inMemoryPipes = new Map<string, PipedData>();

  /**
   * Send output payload to a target utility
   */
  static pipeToUtility(targetUtilityId: string, data: Omit<PipedData, 'targetUtilityId' | 'timestamp'>): void {
    const pipeItem: PipedData = {
      ...data,
      targetUtilityId,
      timestamp: Date.now(),
    };

    // Store in-memory
    this.inMemoryPipes.set(targetUtilityId, pipeItem);

    // Also persist text/metadata to sessionStorage for tab/reload resilience
    try {
      const serializable = {
        ...pipeItem,
        // buffer cannot be directly stringified, retain in memory only
        hasBuffer: !!pipeItem.buffer,
      };
      sessionStorage.setItem(`${PIPE_STORAGE_KEY}_${targetUtilityId}`, JSON.stringify(serializable));
    } catch {}

    // Dispatch global event
    window.dispatchEvent(
      new CustomEvent('toiloki-pipe-received', {
        detail: pipeItem,
      })
    );
  }

  /**
   * Consume and retrieve piped data for a utility (once retrieved, it is cleared)
   */
  static consumePipedData(utilityId: string): PipedData | null {
    // Check in-memory first (preserves binary buffer)
    const memData = this.inMemoryPipes.get(utilityId);
    if (memData) {
      this.inMemoryPipes.delete(utilityId);
      try {
        sessionStorage.removeItem(`${PIPE_STORAGE_KEY}_${utilityId}`);
      } catch {}
      return memData;
    }

    // Fallback to sessionStorage
    try {
      const raw = sessionStorage.getItem(`${PIPE_STORAGE_KEY}_${utilityId}`);
      if (raw) {
        sessionStorage.removeItem(`${PIPE_STORAGE_KEY}_${utilityId}`);
        return JSON.parse(raw);
      }
    } catch {}

    return null;
  }

  /**
   * Check if a utility has pending piped data waiting
   */
  static hasPendingData(utilityId: string): boolean {
    if (this.inMemoryPipes.has(utilityId)) return true;
    try {
      return !!sessionStorage.getItem(`${PIPE_STORAGE_KEY}_${utilityId}`);
    } catch {
      return false;
    }
  }

  /**
   * Get list of recommended recipient utilities based on output data type and format
   */
  static getCompatibleTargets(options: {
    format?: string;
    hasBuffer?: boolean;
    hasText?: boolean;
  }): PipeTargetOption[] {
    const ext = (options.format || '').toLowerCase().replace(/^\./, '');
    const results: PipeTargetOption[] = [];

    // PDF outputs
    if (ext === 'pdf') {
      results.push(
        {
          workspaceId: 'pdf',
          groupId: 'pdf-optimizer',
          utilityId: 'compress-pdf',
          name: 'Compress PDF',
          description: 'Reduce size while preserving layout and fonts.',
          category: 'pdf',
        },
        {
          workspaceId: 'pdf',
          groupId: 'page-organizer',
          utilityId: 'split-pdf',
          name: 'Split PDF',
          description: 'Extract or split into individual page ranges.',
          category: 'pdf',
        },
        {
          workspaceId: 'pdf',
          groupId: 'pdf-security',
          utilityId: 'password-protect',
          name: 'Password Protect PDF',
          description: 'Encrypt with password credentials.',
          category: 'pdf',
        },
        {
          workspaceId: 'pdf',
          groupId: 'pdf-converter',
          utilityId: 'pdf-to-images',
          name: 'PDF to Images',
          description: 'Render pages as high-resolution PNG or JPG images.',
          category: 'pdf',
        }
      );
    }

    // Image outputs
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
      results.push(
        {
          workspaceId: 'images',
          groupId: 'img-optimizer',
          utilityId: 'compress-image',
          name: 'Compress Image',
          description: 'Lossless or lossy size optimization.',
          category: 'image',
        },
        {
          workspaceId: 'images',
          groupId: 'img-editor',
          utilityId: 'img-resize',
          name: 'Resize Image',
          description: 'Scale dimensions by pixels or percentage.',
          category: 'image',
        },
        {
          workspaceId: 'pdf',
          groupId: 'pdf-converter',
          utilityId: 'images-to-pdf',
          name: 'Images → PDF',
          description: 'Compile into a multi-page PDF document.',
          category: 'pdf',
        },
        {
          workspaceId: 'design',
          groupId: 'design-color',
          utilityId: 'design-image-palette-extractor',
          name: 'Image Palette Extractor',
          description: 'Extract dominant color swatches and mood palette.',
          category: 'image',
        }
      );
    }

    // Tabular / CSV outputs
    if (['csv', 'tsv'].includes(ext)) {
      results.push(
        {
          workspaceId: 'data',
          groupId: 'data-tabular',
          utilityId: 'csv-viewer',
          name: 'CSV Table Viewer',
          description: 'Interactive table with column filtering and sorting.',
          category: 'data',
        },
        {
          workspaceId: 'data',
          groupId: 'data-tabular',
          utilityId: 'data-pivot-groupby',
          name: 'Pivot & GroupBy Engine',
          description: 'Multi-column aggregation and metrics.',
          category: 'data',
        },
        {
          workspaceId: 'data',
          groupId: 'data-tabular',
          utilityId: 'data-sql-csv',
          name: 'SQL Query on CSV',
          description: 'Execute standard SELECT/JOIN/WHERE queries.',
          category: 'data',
        }
      );
    }

    // JSON outputs
    if (ext === 'json') {
      results.push(
        {
          workspaceId: 'developer',
          groupId: 'dev-formatter',
          utilityId: 'format-json-code',
          name: 'JSON Formatter',
          description: 'Beautify or minify with custom indentation.',
          category: 'text',
        },
        {
          workspaceId: 'data',
          groupId: 'data-compare',
          utilityId: 'data-json-diff',
          name: 'JSON Diff',
          description: 'Compare against another JSON tree.',
          category: 'data',
        },
        {
          workspaceId: 'developer',
          groupId: 'dev-encode',
          utilityId: 'dev-base64',
          name: 'Base64 Encoder',
          description: 'Encode JSON payload to Base64 string.',
          category: 'text',
        }
      );
    }

    // Text outputs
    if (options.hasText || ['txt', 'md', 'html', 'sql', 'js', 'ts', 'css'].includes(ext)) {
      results.push(
        {
          workspaceId: 'text',
          groupId: 'text-transformer',
          utilityId: 'case-conversion',
          name: 'Case Conversion',
          description: 'Transform letter case across uppercase, lowercase, camelCase.',
          category: 'text',
        },
        {
          workspaceId: 'text',
          groupId: 'text-analyzer',
          utilityId: 'text-statistics',
          name: 'Text Statistics',
          description: 'Live counts for words, characters, sentences.',
          category: 'text',
        },
        {
          workspaceId: 'developer',
          groupId: 'dev-utilities',
          utilityId: 'sec-hash-hmac',
          name: 'Hash & HMAC',
          description: 'Generate SHA-256 or MD5 integrity checksum.',
          category: 'text',
        },
        {
          workspaceId: 'text',
          groupId: 'text-compare',
          utilityId: 'text-diff',
          name: 'Text Diff',
          description: 'Compare with another text version.',
          category: 'text',
        }
      );
    }

    return results;
  }
}
