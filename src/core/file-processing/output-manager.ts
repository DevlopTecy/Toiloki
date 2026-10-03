import { SettingsService } from '../services/settings.service';
import { AppError } from '../errors/app-error';
import { PathSecurity } from './path-security';
import { FileValidator } from './file-validator';

export type ConflictResolution = 'overwrite' | 'rename' | 'auto-rename' | 'cancel' | 'ask' | 'prompt';

export interface SaveOutputOptions {
  buffer?: Uint8Array;
  text?: string;
  desiredName: string;
  extension: string;
  targetDir?: string;
  toolId?: string;
  conflictPolicy?: ConflictResolution;
  onConflictNeeded?: (existingPath: string, suggestedName: string) => Promise<ConflictResolution>;
}

export interface SaveOutputResult {
  success: boolean;
  savedPath?: string;
  fileName: string;
  bytesWritten?: number;
  conflictResolvedBy?: ConflictResolution;
  error?: AppError;
}

export class OutputManager {
  /**
   * Apply naming template pattern to construct output file name
   * Supported tokens: {name}, {tool}, {date}, {time}, {counter}
   */
  static formatTemplateFilename(template: string, originalName: string, toolId?: string, counter: number = 1): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const cleanOriginal = originalName.replace(/\.[^/.]+$/, '');

    let res = template || '{name}_{tool}_{date}';
    res = res.replace(/\{name\}/g, cleanOriginal);
    res = res.replace(/\{tool\}/g, toolId || 'output');
    res = res.replace(/\{utility\}/g, toolId || 'output');
    res = res.replace(/\{date\}/g, dateStr);
    res = res.replace(/\{time\}/g, timeStr);
    res = res.replace(/\{counter\}/g, String(counter));

    return FileValidator.sanitizeFilename(res);
  }
  /**
   * Get effective output directory based on settings
   */
  static getDefaultOutputDir(): string {
    const settings = SettingsService.getSettings();
    return settings.outputDir || 'C:\\Users\\User\\Downloads\\Toiloki Output';
  }

  /**
   * Check if a file already exists on local filesystem
   */
  static async checkFileExists(filePath: string): Promise<boolean> {
    if (window.toiloki?.fs?.getStats) {
      const stats = await window.toiloki.fs.getStats(filePath);
      return !!stats.exists;
    }
    return false;
  }

  /**
   * Generate an incremental non-colliding filename (e.g. "report (1).pdf")
   */
  static async getNextAvailablePath(
    baseDir: string,
    fileName: string,
    ext: string
  ): Promise<{ fullPath: string; fileName: string }> {
    const cleanBaseName = fileName.replace(new RegExp(`\\.${ext}$`, 'i'), '');
    const cleanExt = ext.replace(/^\./, '');

    let counter = 0;
    let candidateName = `${cleanBaseName}.${cleanExt}`;
    let candidatePath = `${baseDir}\\${candidateName}`;

    while (await this.checkFileExists(candidatePath)) {
      counter++;
      candidateName = `${cleanBaseName} (${counter}).${cleanExt}`;
      candidatePath = `${baseDir}\\${candidateName}`;
      if (counter > 999) break; // Avoid infinite loops
    }

    return { fullPath: candidatePath, fileName: candidateName };
  }

  /**
   * Reusable save operation that handles overwrite detection, renaming, and local writing
   */
  static async saveOutput(options: SaveOutputOptions): Promise<SaveOutputResult> {
    try {
      const settings = SettingsService.getSettings();
      const targetDir = options.targetDir || this.getDefaultOutputDir();
      PathSecurity.assertSafeOutputPath(targetDir);

      const cleanExt = options.extension.replace(/^\./, '').toLowerCase();
      let cleanName = FileValidator.sanitizeFilename(options.desiredName);
      if (!cleanName.toLowerCase().endsWith(`.${cleanExt}`)) {
        cleanName = `${cleanName}.${cleanExt}`;
      }

      let targetPath = `${targetDir}\\${cleanName}`;
      let resolution: ConflictResolution = options.conflictPolicy || (settings.conflictBehavior as any) || 'auto-rename';

      // Check collision
      const exists = await this.checkFileExists(targetPath);
      if (exists) {
        if (resolution === 'ask' && options.onConflictNeeded) {
          const suggested = await this.getNextAvailablePath(targetDir, cleanName, cleanExt);
          resolution = await options.onConflictNeeded(targetPath, suggested.fileName);
        }

        if (resolution === 'cancel') {
          return {
            success: false,
            fileName: cleanName,
            conflictResolvedBy: 'cancel',
            error: new AppError({
              code: 'OUTPUT_EXISTS',
              userMessage: 'Save cancelled because target file already exists.',
            }),
          };
        }

        if (resolution === 'rename' || resolution === 'auto-rename') {
          const next = await this.getNextAvailablePath(targetDir, cleanName, cleanExt);
          targetPath = next.fullPath;
          cleanName = next.fileName;
        }
      }

      // Write file via Electron or trigger browser download fallback
      if (window.toiloki?.fs) {
        if (options.buffer) {
          const writeRes = await window.toiloki.fs.writeFileBuffer(targetPath, options.buffer);
          if (!writeRes.success) {
            throw new AppError({
              code: 'PROCESSING_FAILED',
              userMessage: `Failed to write file to "${targetPath}": ${writeRes.error}`,
              filePath: targetPath,
            });
          }
          return {
            success: true,
            savedPath: targetPath,
            fileName: cleanName,
            bytesWritten: writeRes.bytesWritten || options.buffer.length,
            conflictResolvedBy: resolution,
          };
        } else if (options.text !== undefined) {
          const writeRes = await window.toiloki.fs.writeFileText(targetPath, options.text);
          if (!writeRes.success) {
            throw new AppError({
              code: 'PROCESSING_FAILED',
              userMessage: `Failed to write text to "${targetPath}": ${writeRes.error}`,
              filePath: targetPath,
            });
          }
          return {
            success: true,
            savedPath: targetPath,
            fileName: cleanName,
            bytesWritten: new TextEncoder().encode(options.text).length,
            conflictResolvedBy: resolution,
          };
        }
      }

      // Web download fallback
      const dataBlob = options.buffer
        ? new Blob([options.buffer])
        : new Blob([options.text || ''], { type: 'text/plain' });
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      return {
        success: true,
        fileName: cleanName,
        bytesWritten: dataBlob.size,
        conflictResolvedBy: resolution,
      };
    } catch (err) {
      const appErr = AppError.fromUnknown(err, 'PROCESSING_FAILED');
      return {
        success: false,
        fileName: options.desiredName,
        error: appErr,
      };
    }
  }

  /**
   * Open the output location in system file explorer
   */
  static async openOutputLocation(filePath: string): Promise<boolean> {
    if (window.toiloki?.shell?.showInFolder) {
      const res = await window.toiloki.shell.showInFolder(filePath);
      return !!res.success;
    }
    return false;
  }
}
