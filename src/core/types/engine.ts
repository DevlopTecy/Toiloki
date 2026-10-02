export interface EngineProgress {
  percent: number; // 0 to 100
  stage: string;   // e.g. "Compressing image 3 of 12"
}

export interface EngineResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  outputPath?: string;
  outputBuffer?: Uint8Array;
  metadata?: Record<string, unknown>;
  elapsedMs: number;
}

export interface BaseEngine<TOptions = unknown, TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  execute(
    input: TInput,
    options: TOptions,
    onProgress?: (progress: EngineProgress) => void,
    signal?: AbortSignal
  ): Promise<EngineResult<TOutput>>;
}
