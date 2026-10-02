import { AppError } from '../errors/app-error';

export class PathSecurity {
  /**
   * Normalize path separators to unified forward slashes and eliminate duplicate slashes
   */
  static normalize(p: string): string {
    return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
  }

  /**
   * Clean and sanitize an archive entry path to prevent Zip Slip directory traversal vulnerabilities
   */
  static sanitizeArchivePath(entryPath: string): string {
    // 1. Remove any Windows drive letters (e.g. "C:", "D:")
    let cleaned = entryPath.replace(/^[a-zA-Z]:/, '');

    // 2. Normalize slashes
    cleaned = this.normalize(cleaned);

    // 3. Remove leading slashes
    cleaned = cleaned.replace(/^\/+/, '');

    // 4. Resolve dot segments (prevent ../../)
    const segments = cleaned.split('/');
    const safeSegments: string[] = [];

    for (const segment of segments) {
      if (segment === '' || segment === '.') {
        continue;
      }
      if (segment === '..') {
        // Pop if possible, but NEVER go below root
        if (safeSegments.length > 0) {
          safeSegments.pop();
        }
      } else {
        // Strip illegal filename characters inside segments
        const safeName = segment.replace(/[<>:"|?*\x00-\x1F]/g, '_');
        safeSegments.push(safeName);
      }
    }

    if (safeSegments.length === 0) {
      return `extracted_file_${Date.now()}`;
    }

    return safeSegments.join('/');
  }

  /**
   * Verify that a target path is strictly contained within a destination root
   */
  static isPathWithinRoot(targetPath: string, rootPath: string): boolean {
    const normTarget = this.normalize(targetPath).toLowerCase();
    const normRoot = this.normalize(rootPath).toLowerCase().replace(/\/+$/, '');
    return normTarget === normRoot || normTarget.startsWith(normRoot + '/');
  }

  /**
   * Validate that an output path is safe and valid
   */
  static assertSafeOutputPath(outputPath: string): void {
    if (!outputPath || typeof outputPath !== 'string') {
      throw new AppError({
        code: 'INVALID_INPUT',
        userMessage: 'Output destination path is invalid or empty.',
      });
    }

    const norm = this.normalize(outputPath);
    if (norm.includes('/../') || norm.endsWith('/..')) {
      throw new AppError({
        code: 'PERMISSION_DENIED',
        userMessage: 'Security check failed: Path traversal characters are not permitted in output paths.',
        remedy: 'Select a clean output folder without relative directory traversal.',
      });
    }
  }
}
