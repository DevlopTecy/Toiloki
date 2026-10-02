import { AppError } from '../errors/app-error';

export interface ValidationRule {
  allowedExtensions?: string[];
  maxSizeBytes?: number;
  expectedMagicBytes?: number[][];
  requireNonEmpty?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: AppError;
  detectedExtension?: string;
  detectedMime?: string;
}

export class FileValidator {
  private static readonly WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
  private static readonly ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

  /**
   * Sanitize a filename to make it safe on Windows and Unix filesystems
   */
  static sanitizeFilename(fileName: string, fallback = 'file'): string {
    let clean = fileName.trim().replace(this.ILLEGAL_FILENAME_CHARS, '_');
    // Prevent trailing dots or spaces which are invalid on Windows
    clean = clean.replace(/[. ]+$/, '');

    if (!clean || this.WINDOWS_RESERVED_NAMES.test(clean)) {
      clean = `${clean || fallback}_safe`;
    }
    return clean;
  }

  /**
   * Validate a file buffer against size, non-empty, and magic bytes
   */
  static validateBuffer(
    buffer: Uint8Array,
    fileName: string,
    rules: ValidationRule = {}
  ): ValidationResult {
    // 1. Non-empty check
    if (rules.requireNonEmpty !== false && buffer.length === 0) {
      return {
        valid: false,
        error: new AppError({
          code: 'INVALID_INPUT',
          userMessage: `File "${fileName}" is empty (0 bytes).`,
          remedy: 'Please select a file that contains content.',
        }),
      };
    }

    // 2. Max size check
    if (rules.maxSizeBytes && buffer.length > rules.maxSizeBytes) {
      const maxMb = (rules.maxSizeBytes / (1024 * 1024)).toFixed(1);
      const actualMb = (buffer.length / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: new AppError({
          code: 'INVALID_INPUT',
          userMessage: `File "${fileName}" (${actualMb} MB) exceeds maximum allowed size of ${maxMb} MB.`,
          remedy: 'Choose a smaller file or split the input.',
        }),
      };
    }

    // 3. Extension check
    const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';
    if (rules.allowedExtensions && rules.allowedExtensions.length > 0) {
      const allowed = rules.allowedExtensions.map((e) => e.replace(/^\./, '').toLowerCase());
      if (!allowed.includes(ext)) {
        return {
          valid: false,
          error: new AppError({
            code: 'UNSUPPORTED_FORMAT',
            userMessage: `File extension ".${ext}" is not supported for this tool.`,
            remedy: `Supported formats: ${allowed.map((e) => '.' + e).join(', ')}`,
          }),
        };
      }
    }

    // 4. Magic bytes sniffing
    if (rules.expectedMagicBytes && rules.expectedMagicBytes.length > 0) {
      const matchesMagic = rules.expectedMagicBytes.some((signature) => {
        if (buffer.length < signature.length) return false;
        return signature.every((byte, idx) => byte === buffer[idx]);
      });

      if (!matchesMagic) {
        return {
          valid: false,
          error: new AppError({
            code: 'UNSUPPORTED_FORMAT',
            userMessage: `File "${fileName}" does not match the expected format signature. The file may be renamed or corrupted.`,
            remedy: 'Ensure the file is authentic and not corrupted.',
          }),
        };
      }
    }

    return { valid: true };
  }

  /**
   * Common Magic Bytes Signatures for validation
   */
  static readonly Signatures = {
    PDF: [[0x25, 0x50, 0x44, 0x46]], // %PDF
    PNG: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    JPEG: [[0xff, 0xd8, 0xff]],
    GIF: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
    WEBP: [[0x52, 0x49, 0x46, 0x46]], // RIFF
    ZIP: [[0x50, 0x4b, 0x03, 0x04]],  // PK.. (ZIP, DOCX, XLSX)
  };
}
