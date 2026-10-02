export type AppErrorCode =
  | 'INVALID_INPUT'
  | 'UNSUPPORTED_FORMAT'
  | 'PERMISSION_DENIED'
  | 'FILE_NOT_FOUND'
  | 'FILE_LOCKED'
  | 'OUTPUT_EXISTS'
  | 'INSUFFICIENT_STORAGE'
  | 'PROCESSING_FAILED'
  | 'CANCELLED';

export interface AppErrorDetails {
  code: AppErrorCode;
  userMessage: string;
  technicalDetails?: string;
  filePath?: string;
  remedy?: string;
}

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly userMessage: string;
  public readonly technicalDetails?: string;
  public readonly filePath?: string;
  public readonly remedy?: string;

  constructor(details: AppErrorDetails) {
    super(details.userMessage);
    this.name = 'AppError';
    this.code = details.code;
    this.userMessage = details.userMessage;
    this.technicalDetails = details.technicalDetails;
    this.filePath = details.filePath;
    this.remedy = details.remedy;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert any unknown error or exception into a structured AppError
   */
  static fromUnknown(err: unknown, defaultCode: AppErrorCode = 'PROCESSING_FAILED'): AppError {
    if (err instanceof AppError) {
      return err;
    }

    const message = err instanceof Error ? err.message : String(err);

    // Auto-detect specific common error patterns
    if (message.includes('cancelled') || message.includes('aborted') || message.includes('AbortError')) {
      return new AppError({
        code: 'CANCELLED',
        userMessage: 'The operation was cancelled by the user.',
        technicalDetails: message,
      });
    }

    if (message.includes('ENOENT') || message.includes('does not exist') || message.includes('File not found')) {
      return new AppError({
        code: 'FILE_NOT_FOUND',
        userMessage: 'The specified file or directory could not be found.',
        technicalDetails: message,
        remedy: 'Verify the file still exists and has not been moved or deleted.',
      });
    }

    if (message.includes('EACCES') || message.includes('EPERM') || message.includes('permission denied')) {
      return new AppError({
        code: 'PERMISSION_DENIED',
        userMessage: 'Access denied: You do not have permission to read or write this file.',
        technicalDetails: message,
        remedy: 'Check file permissions or run the application with appropriate privileges.',
      });
    }

    if (message.includes('EBUSY') || message.includes('locked') || message.includes('resource busy')) {
      return new AppError({
        code: 'FILE_LOCKED',
        userMessage: 'The file is currently locked by another application.',
        technicalDetails: message,
        remedy: 'Close other applications that might be accessing this file and try again.',
      });
    }

    if (message.includes('ENOSPC') || message.includes('disk full') || message.includes('no space')) {
      return new AppError({
        code: 'INSUFFICIENT_STORAGE',
        userMessage: 'Insufficient disk storage to complete the operation.',
        technicalDetails: message,
        remedy: 'Free up disk space on your drive and try again.',
      });
    }

    if (message.includes('unsupported') || message.includes('Invalid format') || message.includes('magic number')) {
      return new AppError({
        code: 'UNSUPPORTED_FORMAT',
        userMessage: 'The file format or structure is unsupported or corrupted.',
        technicalDetails: message,
        remedy: 'Select a valid file with a supported format.',
      });
    }

    return new AppError({
      code: defaultCode,
      userMessage: message || 'An unexpected processing error occurred.',
      technicalDetails: err instanceof Error ? err.stack : undefined,
    });
  }
}
