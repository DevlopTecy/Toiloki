import { JobItem, BatchState } from './job.types';
import { AppError } from '../errors/app-error';

export type WorkerFunction<TOptions, TResult> = (
  job: JobItem<TResult>,
  options: TOptions,
  signal: AbortSignal,
  onProgress: (percent: number, stage: string) => void
) => Promise<{ result?: TResult; outputBuffer?: Uint8Array; outputPath?: string }>;

export class BatchProcessor<TOptions = unknown, TResult = unknown> {
  private jobs: JobItem<TResult>[] = [];
  private abortController: AbortController | null = null;
  private isProcessing = false;
  private isCancelled = false;
  private currentIndex = 0;
  private startedAt?: number;
  private completedAt?: number;
  private listeners: Set<(state: BatchState<TResult>) => void> = new Set();
  private workerFn: WorkerFunction<TOptions, TResult>;

  constructor(workerFn: WorkerFunction<TOptions, TResult>) {
    this.workerFn = workerFn;
  }

  /**
   * Set or replace the input queue
   */
  setItems(files: Array<{ name: string; path?: string; buffer?: Uint8Array }>): void {
    if (this.isProcessing) {
      throw new Error('Cannot replace items while batch processing is active');
    }

    this.jobs = files.map((f, idx) => ({
      id: `job-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      fileName: f.name,
      filePath: f.path,
      buffer: f.buffer,
      status: 'queued',
      progress: 0,
    }));

    this.currentIndex = 0;
    this.isCancelled = false;
    this.startedAt = undefined;
    this.completedAt = undefined;
    this.notify();
  }

  /**
   * Subscribe to batch state changes
   */
  subscribe(listener: (state: BatchState<TResult>) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current state snapshot
   */
  getState(): BatchState<TResult> {
    const totalFiles = this.jobs.length;
    const completedCount = this.jobs.filter((j) => j.status === 'completed').length;
    const failedCount = this.jobs.filter((j) => j.status === 'failed').length;

    let overallProgress = 0;
    if (totalFiles > 0) {
      const sumProgress = this.jobs.reduce((acc, j) => acc + (j.status === 'completed' ? 100 : j.progress), 0);
      overallProgress = Math.round(sumProgress / totalFiles);
    }

    const currentFile = this.jobs[this.currentIndex]?.fileName || '';

    return {
      jobs: [...this.jobs],
      currentIndex: this.currentIndex,
      currentFile,
      totalFiles,
      completedCount,
      failedCount,
      overallProgress,
      isProcessing: this.isProcessing,
      isCancelled: this.isCancelled,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('BatchProcessor listener error:', err);
      }
    }
  }

  /**
   * Start batch processing
   */
  async start(options: TOptions): Promise<void> {
    if (this.isProcessing) return;
    if (this.jobs.length === 0) return;

    this.isProcessing = true;
    this.isCancelled = false;
    this.abortController = new AbortController();
    this.startedAt = Date.now();
    this.completedAt = undefined;
    this.notify();

    const signal = this.abortController.signal;

    try {
      for (let i = 0; i < this.jobs.length; i++) {
        if (signal.aborted) {
          break;
        }

        const job = this.jobs[i];
        if (job.status === 'completed') {
          continue; // Skip already completed on resume/retry
        }

        this.currentIndex = i;
        job.status = 'preparing';
        job.progress = 5;
        job.stage = 'Preparing file...';
        job.startedAt = Date.now();
        this.notify();

        try {
          job.status = 'processing';
          this.notify();

          const result = await this.workerFn(
            job,
            options,
            signal,
            (percent, stage) => {
              job.progress = percent;
              job.stage = stage;
              this.notify();
            }
          );

          if (signal.aborted) {
            job.status = 'cancelled';
            job.stage = 'Cancelled';
            break;
          }

          job.status = 'completed';
          job.progress = 100;
          job.stage = 'Completed';
          job.result = result.result;
          job.outputBuffer = result.outputBuffer;
          job.outputPath = result.outputPath;
          job.completedAt = Date.now();
          job.elapsedMs = job.completedAt - (job.startedAt || job.completedAt);
          job.error = undefined;
        } catch (err: unknown) {
          if (signal.aborted) {
            job.status = 'cancelled';
            job.stage = 'Cancelled';
            break;
          }

          job.status = 'failed';
          job.error = AppError.fromUnknown(err, 'PROCESSING_FAILED');
          job.stage = `Failed: ${job.error.userMessage}`;
          job.completedAt = Date.now();
          job.elapsedMs = job.completedAt - (job.startedAt || job.completedAt);
        }

        this.notify();
      }
    } finally {
      this.isProcessing = false;
      this.completedAt = Date.now();
      this.notify();
    }
  }

  /**
   * Cancel ongoing batch operation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.isCancelled = true;

      // Mark any queued or processing items as cancelled
      for (const job of this.jobs) {
        if (job.status === 'queued' || job.status === 'preparing' || job.status === 'processing') {
          job.status = 'cancelled';
          job.stage = 'Operation cancelled by user';
        }
      }

      this.isProcessing = false;
      this.completedAt = Date.now();
      this.notify();
    }
  }

  /**
   * Retry failed jobs
   */
  async retryFailed(options: TOptions): Promise<void> {
    if (this.isProcessing) return;

    for (const job of this.jobs) {
      if (job.status === 'failed' || job.status === 'cancelled') {
        job.status = 'queued';
        job.progress = 0;
        job.stage = 'Queued for retry';
        job.error = undefined;
      }
    }

    this.notify();
    await this.start(options);
  }

  /**
   * Clear all completed jobs from queue
   */
  clearCompleted(): void {
    if (this.isProcessing) return;
    this.jobs = this.jobs.filter((j) => j.status !== 'completed');
    this.currentIndex = 0;
    this.notify();
  }
}
