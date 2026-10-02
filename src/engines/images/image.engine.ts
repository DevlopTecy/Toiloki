import { EngineResult, EngineProgress } from '../../core/types/engine';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  rotationDegrees?: 0 | 90 | 180 | 270;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  quality?: number; // 0.1 to 1.0
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  brightness?: number; // 100 is normal
  contrast?: number;   // 100 is normal
  saturation?: number; // 100 is normal
  grayscale?: boolean;
  blur?: number;       // in pixels
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class ImageEngine {
  /**
   * Load image buffer into HTMLImageElement
   */
  private static loadImage(buffer: Uint8Array): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to decode image buffer.'));
      };
      img.src = url;
    });
  }

  /**
   * Transform, resize, filter, and convert image
   */
  static async transformImage(
    inputBuffer: Uint8Array,
    options: ImageTransformOptions,
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      onProgress?.({ percent: 20, stage: 'Decoding input image...' });
      const img = await this.loadImage(inputBuffer);

      let targetWidth = options.width || img.width;
      let targetHeight = options.height || img.height;

      if (options.maintainAspectRatio) {
        const ratio = img.width / img.height;
        if (options.width && !options.height) {
          targetHeight = Math.round(targetWidth / ratio);
        } else if (options.height && !options.width) {
          targetWidth = Math.round(targetHeight * ratio);
        }
      }

      onProgress?.({ percent: 50, stage: 'Applying transformations...' });

      // Determine canvas dimensions based on rotation
      const rot = options.rotationDegrees || 0;
      const isPerpendicular = rot === 90 || rot === 270;
      const canvasWidth = isPerpendicular ? targetHeight : targetWidth;
      const canvasHeight = isPerpendicular ? targetWidth : targetHeight;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return { success: false, error: 'Could not acquire 2D rendering context.', elapsedMs: 0 };
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Filters
      const filters: string[] = [];
      if (options.brightness !== undefined && options.brightness !== 100) {
        filters.push(`brightness(${options.brightness}%)`);
      }
      if (options.contrast !== undefined && options.contrast !== 100) {
        filters.push(`contrast(${options.contrast}%)`);
      }
      if (options.saturation !== undefined && options.saturation !== 100) {
        filters.push(`saturate(${options.saturation}%)`);
      }
      if (options.grayscale) {
        filters.push('grayscale(100%)');
      }
      if (options.blur && options.blur > 0) {
        filters.push(`blur(${options.blur}px)`);
      }

      if (filters.length > 0) {
        ctx.filter = filters.join(' ');
      }

      // Transformations
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      if (rot !== 0) {
        ctx.rotate((rot * Math.PI) / 180);
      }
      if (options.flipHorizontal || options.flipVertical) {
        ctx.scale(options.flipHorizontal ? -1 : 1, options.flipVertical ? -1 : 1);
      }

      if (options.crop) {
        const { x, y, width: cw, height: ch } = options.crop;
        ctx.drawImage(img, x, y, cw, ch, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      } else {
        ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      }

      onProgress?.({ percent: 80, stage: 'Encoding output format...' });

      const format = options.format || 'image/png';
      const quality = options.quality !== undefined ? options.quality : 0.9;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, format, quality)
      );

      if (!blob) {
        return { success: false, error: 'Failed to encode canvas to image blob.', elapsedMs: 0 };
      }

      const outputBuffer = new Uint8Array(await blob.arrayBuffer());

      return {
        success: true,
        data: outputBuffer,
        outputBuffer,
        metadata: {
          originalWidth: img.width,
          originalHeight: img.height,
          outputWidth: canvasWidth,
          outputHeight: canvasHeight,
          format,
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
   * Detect image dimensions without performing full transformation
   */
  static async getImageDimensions(
    buffer: Uint8Array
  ): Promise<EngineResult<{ width: number; height: number; aspect: string }>> {
    const start = performance.now();
    try {
      const img = await this.loadImage(buffer);
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(img.width, img.height);
      const aspect = `${img.width / divisor}:${img.height / divisor}`;

      return {
        success: true,
        data: { width: img.width, height: img.height, aspect },
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
   * Strip EXIF, IPTC, and all metadata by re-encoding via canvas
   */
  static async stripMetadata(
    buffer: Uint8Array,
    format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/png'
  ): Promise<EngineResult<Uint8Array>> {
    return this.transformImage(buffer, { format, quality: 0.95 });
  }
}
