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
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
}
