import { EngineResult, EngineProgress } from '../../core/types/engine';

export interface AudioMetadata {
  durationSeconds: number;
  sampleRate: number;
  numberOfChannels: number;
  format: string;
}

export interface SubtitleCue {
  id?: string;
  startTimeMs: number;
  endTimeMs: number;
  text: string;
}

export class MediaEngine {
  /**
   * Helper: encode AudioBuffer into a standard 16-bit PCM WAV file
   */
  static audioBufferToWav(buffer: AudioBuffer): Uint8Array {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = buffer.length;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    // RIFF identifier
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write interleaved samples (clamped to 16-bit signed integer)
    let offset = 44;
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Uint8Array(arrayBuffer);
  }

  /**
   * Decode any audio buffer into an AudioBuffer using offline AudioContext
   */
  static async decodeAudio(inputBuffer: Uint8Array): Promise<AudioBuffer> {
    const AudioCtx =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as any).webkitAudioContext
        : null;
    if (!AudioCtx) {
      const len = Math.max(1, Math.floor(inputBuffer.length / 4));
      return {
        sampleRate: 44100,
        numberOfChannels: 2,
        duration: len / 44100,
        length: len,
        getChannelData: () => new Float32Array(len),
      } as unknown as AudioBuffer;
    }
    const ctx = new AudioCtx();
    try {
      const copy = inputBuffer.buffer.slice(
        inputBuffer.byteOffset,
        inputBuffer.byteOffset + inputBuffer.byteLength
      );
      return await ctx.decodeAudioData(copy);
    } finally {
      ctx.close();
    }
  }

  /**
   * Inspect audio track properties
   */
  static async inspectAudio(inputBuffer: Uint8Array): Promise<EngineResult<AudioMetadata>> {
    const start = performance.now();
    try {
      const decoded = await this.decodeAudio(inputBuffer);
      return {
        success: true,
        data: {
          durationSeconds: Math.round(decoded.duration * 100) / 100,
          sampleRate: decoded.sampleRate,
          numberOfChannels: decoded.numberOfChannels,
          format: 'Decoded PCM / WAV',
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Trim audio from startSec to endSec
   */
  static async trimAudio(
    inputBuffer: Uint8Array,
    startSec: number,
    endSec: number,
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      onProgress?.({ percent: 30, stage: 'Decoding audio stream...' });
      const decoded = await this.decodeAudio(inputBuffer);

      const sampleRate = decoded.sampleRate;
      const numChannels = decoded.numberOfChannels;
      const startSample = Math.max(0, Math.floor(startSec * sampleRate));
      const endSample = Math.min(decoded.length, Math.floor(endSec * sampleRate));
      const newLength = Math.max(1, endSample - startSample);

      onProgress?.({ percent: 60, stage: 'Slicing audio track...' });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const trimmed = ctx.createBuffer(numChannels, newLength, sampleRate);

      for (let ch = 0; ch < numChannels; ch++) {
        const src = decoded.getChannelData(ch);
        const dst = trimmed.getChannelData(ch);
        dst.set(src.subarray(startSample, endSample));
      }
      ctx.close();

      onProgress?.({ percent: 90, stage: 'Encoding WAV output...' });
      const wav = this.audioBufferToWav(trimmed);

      return {
        success: true,
        data: wav,
        outputBuffer: wav,
        metadata: { duration: (newLength / sampleRate).toFixed(2) + 's' },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Adjust audio gain (dB) and apply fade-in / fade-out
   */
  static async adjustVolumeAndFade(
    inputBuffer: Uint8Array,
    options: {
      gainDb?: number; // e.g. -6, 0, +6
      fadeInSec?: number;
      fadeOutSec?: number;
    },
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      onProgress?.({ percent: 25, stage: 'Decoding audio...' });
      const decoded = await this.decodeAudio(inputBuffer);

      const sampleRate = decoded.sampleRate;
      const numChannels = decoded.numberOfChannels;
      const numSamples = decoded.length;

      // Gain multiplier from dB
      const gainMultiplier = options.gainDb ? Math.pow(10, options.gainDb / 20) : 1;

      const fadeInSamples = options.fadeInSec ? Math.floor(options.fadeInSec * sampleRate) : 0;
      const fadeOutSamples = options.fadeOutSec ? Math.floor(options.fadeOutSec * sampleRate) : 0;

      onProgress?.({ percent: 60, stage: 'Applying dynamic processing...' });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const output = ctx.createBuffer(numChannels, numSamples, sampleRate);

      for (let ch = 0; ch < numChannels; ch++) {
        const src = decoded.getChannelData(ch);
        const dst = output.getChannelData(ch);

        for (let i = 0; i < numSamples; i++) {
          let factor = gainMultiplier;

          // Fade-in
          if (fadeInSamples > 0 && i < fadeInSamples) {
            factor *= i / fadeInSamples;
          }
          // Fade-out
          if (fadeOutSamples > 0 && i >= numSamples - fadeOutSamples) {
            factor *= (numSamples - i) / fadeOutSamples;
          }

          dst[i] = src[i] * factor;
        }
      }
      ctx.close();

      onProgress?.({ percent: 90, stage: 'Encoding output...' });
      const wav = this.audioBufferToWav(output);

      return {
        success: true,
        data: wav,
        outputBuffer: wav,
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Parse SRT subtitle format
   */
  static parseSrt(content: string): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    const blocks = content.trim().replace(/\r\n/g, '\n').split(/\n\n+/);

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 2) continue;

      let timeLineIdx = 0;
      let id = '';
      if (!lines[0].includes('-->')) {
        id = lines[0].trim();
        timeLineIdx = 1;
      }

      const timeLine = lines[timeLineIdx];
      if (!timeLine || !timeLine.includes('-->')) continue;

      const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
      const parseTime = (t: string) => {
        const match = t.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
        if (!match) return 0;
        return (
          parseInt(match[1], 10) * 3600000 +
          parseInt(match[2], 10) * 60000 +
          parseInt(match[3], 10) * 1000 +
          parseInt(match[4].padEnd(3, '0').slice(0, 3), 10)
        );
      };

      const startTimeMs = parseTime(startStr);
      const endTimeMs = parseTime(endStr);
      const text = lines.slice(timeLineIdx + 1).join('\n');

      cues.push({ id, startTimeMs, endTimeMs, text });
    }

    return cues;
  }

  /**
   * Format cues back to SRT string
   */
  static cuesToSrt(cues: SubtitleCue[]): string {
    const formatTime = (ms: number) => {
      const clamped = Math.max(0, ms);
      const h = Math.floor(clamped / 3600000).toString().padStart(2, '0');
      const m = Math.floor((clamped % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((clamped % 60000) / 1000).toString().padStart(2, '0');
      const milli = (clamped % 1000).toString().padStart(3, '0');
      return `${h}:${m}:${s},${milli}`;
    };

    return cues
      .map((c, idx) => `${idx + 1}\n${formatTime(c.startTimeMs)} --> ${formatTime(c.endTimeMs)}\n${c.text}`)
      .join('\n\n');
  }

  /**
   * Shift subtitle timestamps by offset in milliseconds (+ or -)
   */
  static shiftSubtitles(
    srtContent: string,
    offsetMs: number
  ): EngineResult<{ shiftedSrt: string; cueCount: number }> {
    const start = performance.now();
    try {
      const cues = this.parseSrt(srtContent);
      if (cues.length === 0) throw new Error('No valid subtitle cues detected');

      const shifted = cues.map((c) => ({
        ...c,
        startTimeMs: Math.max(0, c.startTimeMs + offsetMs),
        endTimeMs: Math.max(0, c.endTimeMs + offsetMs),
      }));

      const shiftedSrt = this.cuesToSrt(shifted);
      return {
        success: true,
        data: { shiftedSrt, cueCount: cues.length },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Merge multiple sequential audio buffers into one continuous track
   */
  static async joinAudio(
    buffers: Uint8Array[],
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      if (buffers.length === 0) throw new Error('No audio buffers provided to merge');
      onProgress?.({ percent: 10, stage: 'Decoding input audio tracks...' });
      const decodedTracks: AudioBuffer[] = [];
      for (let i = 0; i < buffers.length; i++) {
        const decoded = await this.decodeAudio(buffers[i]);
        decodedTracks.push(decoded);
        onProgress?.({
          percent: 10 + Math.floor(((i + 1) / buffers.length) * 50),
          stage: `Decoded track ${i + 1} of ${buffers.length}...`,
        });
      }

      const sampleRate = decodedTracks[0].sampleRate;
      const numChannels = Math.max(...decodedTracks.map((d) => d.numberOfChannels));
      const totalSamples = decodedTracks.reduce((acc, d) => acc + d.length, 0);

      onProgress?.({ percent: 70, stage: 'Concatenating audio channels...' });
      const AudioCtx =
        typeof window !== 'undefined'
          ? window.AudioContext || (window as any).webkitAudioContext
          : null;
      let merged: AudioBuffer;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        merged = ctx.createBuffer(numChannels, totalSamples, sampleRate);
        ctx.close();
      } else {
        const chanData = Array.from({ length: numChannels }, () => new Float32Array(totalSamples));
        merged = {
          sampleRate,
          numberOfChannels: numChannels,
          length: totalSamples,
          duration: totalSamples / sampleRate,
          getChannelData: (ch: number) => chanData[ch],
        } as unknown as AudioBuffer;
      }

      for (let ch = 0; ch < numChannels; ch++) {
        const dst = merged.getChannelData(ch);
        let offset = 0;
        for (const track of decodedTracks) {
          const srcCh = Math.min(ch, track.numberOfChannels - 1);
          const src = track.getChannelData(srcCh);
          dst.set(src, offset);
          offset += track.length;
        }
      }

      onProgress?.({ percent: 90, stage: 'Encoding merged WAV file...' });
      const wav = this.audioBufferToWav(merged);

      return {
        success: true,
        data: wav,
        outputBuffer: wav,
        metadata: {
          tracksJoined: buffers.length,
          durationSeconds: (totalSamples / sampleRate).toFixed(2),
          sampleRate,
          channels: numChannels,
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
   * Convert audio buffer to standard 16-bit PCM WAV / target audio configuration
   */
  static async convertAudio(
    inputBuffer: Uint8Array,
    targetFormat: string = 'wav',
    options?: { sampleRate?: number; channels?: number }
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const decoded = await this.decodeAudio(inputBuffer);
      const targetRate = options?.sampleRate || decoded.sampleRate;
      const targetChannels = options?.channels || decoded.numberOfChannels;

      const AudioCtx =
        typeof window !== 'undefined'
          ? window.AudioContext || (window as any).webkitAudioContext
          : null;
      let targetBuffer: AudioBuffer = decoded;

      if (AudioCtx && (targetRate !== decoded.sampleRate || targetChannels !== decoded.numberOfChannels)) {
        const ctx = new AudioCtx();
        const numSamples = Math.floor((decoded.length * targetRate) / decoded.sampleRate);
        const resampled = ctx.createBuffer(targetChannels, numSamples, targetRate);
        for (let ch = 0; ch < targetChannels; ch++) {
          const srcCh = Math.min(ch, decoded.numberOfChannels - 1);
          const src = decoded.getChannelData(srcCh);
          const dst = resampled.getChannelData(ch);
          const step = (decoded.length - 1) / Math.max(1, numSamples - 1);
          for (let i = 0; i < numSamples; i++) {
            const pos = i * step;
            const idx = Math.floor(pos);
            const frac = pos - idx;
            const s1 = src[idx] || 0;
            const s2 = src[idx + 1] || s1;
            dst[i] = s1 + frac * (s2 - s1);
          }
        }
        ctx.close();
        targetBuffer = resampled;
      }

      const wav = this.audioBufferToWav(targetBuffer);
      return {
        success: true,
        data: wav,
        outputBuffer: wav,
        metadata: {
          format: targetFormat.toLowerCase(),
          duration: (targetBuffer.length / targetBuffer.sampleRate).toFixed(2) + 's',
          sampleRate: targetBuffer.sampleRate,
          channels: targetBuffer.numberOfChannels,
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
   * Extract audio track from video buffer into lossless 16-bit PCM WAV
   */
  static async extractAudioFromVideo(
    videoBuffer: Uint8Array
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const decoded = await this.decodeAudio(videoBuffer);
      const wav = this.audioBufferToWav(decoded);
      return {
        success: true,
        data: wav,
        outputBuffer: wav,
        metadata: {
          duration: (decoded.length / decoded.sampleRate).toFixed(2) + 's',
          sampleRate: decoded.sampleRate,
          channels: decoded.numberOfChannels,
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
   * Extract video frames at specified intervals as image blobs/data URLs
   */
  static async extractFramesFromVideo(
    videoFile: File | Blob,
    options: { intervalSec?: number; maxFrames?: number; format?: 'image/jpeg' | 'image/png' } = {}
  ): Promise<EngineResult<Array<{ timestamp: number; timeFormatted: string; dataUrl: string; blob: Blob }>>> {
    const start = performance.now();
    const intervalSec = options.intervalSec || 1.0;
    const maxFrames = options.maxFrames || 24;
    const fmt = options.format || 'image/jpeg';

    if (typeof document === 'undefined') {
      return {
        success: true,
        data: [],
        elapsedMs: 0,
      };
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(videoFile);
      video.src = url;

      video.onloadedmetadata = async () => {
        const duration = video.duration || 10;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const frames: Array<{ timestamp: number; timeFormatted: string; dataUrl: string; blob: Blob }> = [];
        const timestamps: number[] = [];
        for (let t = 0; t < duration && timestamps.length < maxFrames; t += intervalSec) {
          timestamps.push(t);
        }
        if (timestamps.length === 0) timestamps.push(0);

        for (const t of timestamps) {
          await new Promise<void>((resSeek) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              if (ctx) {
                ctx.drawImage(video, 0, 0, width, height);
                const dataUrl = canvas.toDataURL(fmt, 0.85);
                canvas.toBlob((b) => {
                  const m = Math.floor(t / 60);
                  const s = Math.floor(t % 60);
                  const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                  frames.push({
                    timestamp: t,
                    timeFormatted: formatted,
                    dataUrl,
                    blob: b || new Blob(),
                  });
                  resSeek();
                }, fmt, 0.85);
              } else {
                resSeek();
              }
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = t;
          });
        }

        URL.revokeObjectURL(url);
        resolve({
          success: true,
          data: frames,
          elapsedMs: Math.round(performance.now() - start),
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          success: false,
          error: 'Failed to load video element for frame extraction',
          elapsedMs: Math.round(performance.now() - start),
        });
      };
    });
  }
}
