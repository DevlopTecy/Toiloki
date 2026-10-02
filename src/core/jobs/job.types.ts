import { AppError } from '../errors/app-error';

export type JobStatus =
  | 'queued'
  | 'preparing'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface JobItem<TResult = unknown> {
  id: string;
  fileName: string;
  filePath?: string;
  buffer?: Uint8Array;
  status: JobStatus;
  progress: number; // 0 to 100
  stage?: string;
  result?: TResult;
  outputBuffer?: Uint8Array;
  outputPath?: string;
  error?: AppError;
  startedAt?: number;
  completedAt?: number;
  elapsedMs?: number;
}

export interface BatchState<TResult = unknown> {
  jobs: JobItem<TResult>[];
  currentIndex: number;
  currentFile: string;
  totalFiles: number;
  completedCount: number;
  failedCount: number;
  overallProgress: number; // 0 to 100
  isProcessing: boolean;
  isCancelled: boolean;
  startedAt?: number;
  completedAt?: number;
}
