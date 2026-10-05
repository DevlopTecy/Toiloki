import { EngineResult, EngineProgress } from '../../core/types/engine';
import { ExifEngine } from './exif.engine';

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

      // Safety limit: clamp extreme image dimensions to avoid canvas memory exhaustion (> 8192px)
      const MAX_CANVAS_DIM = 8192;
      if (targetWidth > MAX_CANVAS_DIM || targetHeight > MAX_CANVAS_DIM) {
        const scale = Math.min(MAX_CANVAS_DIM / targetWidth, MAX_CANVAS_DIM / targetHeight);
        targetWidth = Math.round(targetWidth * scale);
        targetHeight = Math.round(targetHeight * scale);
      }

      if (options.maintainAspectRatio) {
        const ratio = img.width / img.height;
        if (options.width && !options.height) {
          targetHeight = Math.round(targetWidth / ratio);
        } else if (options.height && !options.width) {
          targetWidth = Math.round(targetHeight * ratio);
        }
      }

      onProgress?.({ percent: 50, stage: 'Applying transformations...' });

      // Determine canvas dimensions based on rotation (respecting EXIF orientation if not explicitly overridden)
      let rot = options.rotationDegrees;
      if (rot === undefined) {
        rot = ExifEngine.getExifOrientationDegrees(inputBuffer);
      }
      rot = rot || 0;

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

      const format = options.format || 'image/png';
      const quality = options.quality !== undefined ? options.quality : 0.9;

      // If output is JPEG, fill with pure white background so alpha channels never render black
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
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

  /**
   * Convert image buffer to standard 24-bit uncompressed BMP
   */
  static async convertToBmp(
    inputBuffer: Uint8Array,
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      onProgress?.({ percent: 30, stage: 'Decoding input image...' });
      const img = await this.loadImage(inputBuffer);
      const width = img.width;
      const height = img.height;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');
      ctx.drawImage(img, 0, 0);

      onProgress?.({ percent: 60, stage: 'Encoding BMP structure...' });
      const imgData = ctx.getImageData(0, 0, width, height).data;

      const rowSize = Math.floor((24 * width + 31) / 32) * 4;
      const pixelArraySize = rowSize * height;
      const fileSize = 54 + pixelArraySize;

      const buffer = new Uint8Array(fileSize);
      const view = new DataView(buffer.buffer);

      // BMP Header (14 bytes)
      buffer[0] = 0x42; // 'B'
      buffer[1] = 0x4D; // 'M'
      view.setUint32(2, fileSize, true);
      view.setUint16(6, 0, true);
      view.setUint16(8, 0, true);
      view.setUint32(10, 54, true);

      // DIB Header (BITMAPINFOHEADER - 40 bytes)
      view.setUint32(14, 40, true);
      view.setInt32(18, width, true);
      view.setInt32(22, height, true);
      view.setUint16(26, 1, true);
      view.setUint16(28, 24, true);
      view.setUint32(30, 0, true);
      view.setUint32(34, pixelArraySize, true);
      view.setInt32(38, 2835, true);
      view.setInt32(42, 2835, true);
      view.setUint32(46, 0, true);
      view.setUint32(50, 0, true);

      let offset = 54;
      for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          buffer[offset++] = imgData[idx + 2]; // B
          buffer[offset++] = imgData[idx + 1]; // G
          buffer[offset++] = imgData[idx];     // R
        }
        const padding = rowSize - (width * 3);
        for (let p = 0; p < padding; p++) {
          buffer[offset++] = 0;
        }
      }

      onProgress?.({ percent: 100, stage: 'Complete' });
      return {
        success: true,
        data: buffer,
        outputBuffer: buffer,
        metadata: { width, height, format: 'image/bmp' },
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
   * Convert image buffer to standard uncompressed 24-bit RGB TIFF
   */
  static async convertToTiff(
    inputBuffer: Uint8Array,
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      onProgress?.({ percent: 30, stage: 'Decoding input image...' });
      const img = await this.loadImage(inputBuffer);
      const width = img.width;
      const height = img.height;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');
      ctx.drawImage(img, 0, 0);

      onProgress?.({ percent: 60, stage: 'Encoding TIFF structure...' });
      const imgData = ctx.getImageData(0, 0, width, height).data;

      const numPixels = width * height;
      const rawDataSize = numPixels * 3;
      const headerSize = 8;
      const ifdOffset = headerSize + rawDataSize;
      const numEntries = 12;
      const extraDataSize = 6 + 8 + 8;
      const ifdSize = 2 + (numEntries * 12) + 4 + extraDataSize;
      const totalSize = ifdOffset + ifdSize;

      const buffer = new Uint8Array(totalSize);
      const view = new DataView(buffer.buffer);

      view.setUint16(0, 0x4949, true); // 'II'
      view.setUint16(2, 42, true);
      view.setUint32(4, ifdOffset, true);

      let rawOffset = 8;
      for (let i = 0; i < numPixels; i++) {
        const srcIdx = i * 4;
        buffer[rawOffset++] = imgData[srcIdx];
        buffer[rawOffset++] = imgData[srcIdx + 1];
        buffer[rawOffset++] = imgData[srcIdx + 2];
      }

      const ifdStart = ifdOffset;
      const entriesStart = ifdStart + 2;
      const afterEntries = entriesStart + (numEntries * 12) + 4;
      const bitsPerSampleOffset = afterEntries;
      const xResOffset = bitsPerSampleOffset + 6;
      const yResOffset = xResOffset + 8;

      view.setUint16(bitsPerSampleOffset, 8, true);
      view.setUint16(bitsPerSampleOffset + 2, 8, true);
      view.setUint16(bitsPerSampleOffset + 4, 8, true);
      view.setUint32(xResOffset, 72, true);
      view.setUint32(xResOffset + 4, 1, true);
      view.setUint32(yResOffset, 72, true);
      view.setUint32(yResOffset + 4, 1, true);

      view.setUint16(ifdStart, numEntries, true);

      const writeEntry = (idx: number, tag: number, type: number, count: number, val: number) => {
        const pos = entriesStart + (idx * 12);
        view.setUint16(pos, tag, true);
        view.setUint16(pos + 2, type, true);
        view.setUint32(pos + 4, count, true);
        view.setUint32(pos + 8, val, true);
      };

      writeEntry(0, 256, 4, 1, width);
      writeEntry(1, 257, 4, 1, height);
      writeEntry(2, 258, 3, 3, bitsPerSampleOffset);
      writeEntry(3, 259, 3, 1, 1);
      writeEntry(4, 262, 3, 1, 2);
      writeEntry(5, 273, 4, 1, 8);
      writeEntry(6, 277, 3, 1, 3);
      writeEntry(7, 278, 4, 1, height);
      writeEntry(8, 279, 4, 1, rawDataSize);
      writeEntry(9, 282, 5, 1, xResOffset);
      writeEntry(10, 283, 5, 1, yResOffset);
      writeEntry(11, 296, 3, 1, 2);

      view.setUint32(entriesStart + (numEntries * 12), 0, true);

      onProgress?.({ percent: 100, stage: 'Complete' });
      return {
        success: true,
        data: buffer,
        outputBuffer: buffer,
        metadata: { width, height, format: 'image/tiff' },
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
   * Render SVG string or buffer to high-resolution PNG
   */
  static async svgToPng(
    svgContent: string | Uint8Array,
    options: { scale?: number; width?: number; height?: number } = {}
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      let svgStr = typeof svgContent === 'string' ? svgContent : new TextDecoder().decode(svgContent);
      if (!svgStr.includes('<svg')) throw new Error('Input does not appear to be valid SVG');

      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load SVG into browser image element'));
        img.src = url;
      });

      URL.revokeObjectURL(url);

      const scale = options.scale || 1;
      const targetWidth = options.width || Math.round((img.width || 800) * scale);
      const targetHeight = options.height || Math.round((img.height || 600) * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!pngBlob) throw new Error('Canvas PNG export failed');

      const arrayBuf = await pngBlob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuf);

      return {
        success: true,
        data: buffer,
        outputBuffer: buffer,
        metadata: { width: targetWidth, height: targetHeight, format: 'image/png' },
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
   * Apply text watermark to an image
   */
  static async applyWatermark(
    inputBuffer: Uint8Array,
    options: {
      text: string;
      position?: 'center' | 'bottom-right' | 'top-left' | 'tile';
      opacity?: number;
      fontSize?: number;
      color?: string;
      rotation?: number;
    }
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const img = await this.loadImage(inputBuffer);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      ctx.drawImage(img, 0, 0);

      const text = options.text || 'WATERMARK';
      const opacity = options.opacity ?? 0.35;
      const fontSize = options.fontSize || Math.max(16, Math.round(img.width / 24));
      const color = options.color || '#FFFFFF';
      const position = options.position || 'center';
      const rotation = options.rotation !== undefined ? options.rotation : -30;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textBaseline = 'middle';

      if (position === 'center') {
        ctx.textAlign = 'center';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.fillText(text, 0, 0);
      } else if (position === 'tile') {
        ctx.textAlign = 'center';
        const stepX = fontSize * 10;
        const stepY = fontSize * 5;
        for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
          for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      } else if (position === 'bottom-right') {
        ctx.textAlign = 'right';
        ctx.fillText(text, canvas.width - 24, canvas.height - 24);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(text, 24, 24 + fontSize / 2);
      }

      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Canvas export failed');
      const arrayBuf = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuf);

      return {
        success: true,
        data: buffer,
        outputBuffer: buffer,
        metadata: { width: canvas.width, height: canvas.height },
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
   * Create a contact sheet / photo collage from multiple images
   */
  static async createContactSheet(
    images: Array<{ buffer: Uint8Array; name: string }>,
    options: {
      columns?: number;
      thumbWidth?: number;
      thumbHeight?: number;
      gap?: number;
      bg?: string;
      showLabels?: boolean;
    } = {}
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      if (images.length === 0) throw new Error('At least one image is required');

      const cols = options.columns || Math.min(images.length, 3);
      const rows = Math.ceil(images.length / cols);
      const thumbW = options.thumbWidth || 280;
      const thumbH = options.thumbHeight || 200;
      const gap = options.gap !== undefined ? options.gap : 16;
      const showLabels = options.showLabels !== false;
      const labelHeight = showLabels ? 24 : 0;
      const bg = options.bg || '#12141A';

      const cellW = thumbW;
      const cellH = thumbH + labelHeight;

      const totalW = gap * (cols + 1) + cols * cellW;
      const totalH = gap * (rows + 1) + rows * cellH;

      const canvas = document.createElement('canvas');
      canvas.width = totalW;
      canvas.height = totalH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, totalW, totalH);

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = gap + col * (cellW + gap);
        const y = gap + row * (cellH + gap);

        try {
          const img = await this.loadImage(item.buffer);
          // Scale to cover or fit thumbnail
          const ratio = Math.max(thumbW / img.width, thumbH / img.height);
          const sw = thumbW / ratio;
          const sh = thumbH / ratio;
          const sx = (img.width - sw) / 2;
          const sy = (img.height - sh) / 2;

          ctx.drawImage(img, sx, sy, sw, sh, x, y, thumbW, thumbH);

          if (showLabels) {
            ctx.fillStyle = '#9E9E9E';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.name.slice(0, 28), x + thumbW / 2, y + thumbH + 16);
          }
        } catch {
          // If image fails to decode, draw error box
          ctx.fillStyle = '#262A35';
          ctx.fillRect(x, y, thumbW, thumbH);
        }
      }

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Canvas export failed');
      const arrayBuf = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuf);

      return {
        success: true,
        data: buffer,
        outputBuffer: buffer,
        metadata: { width: totalW, height: totalH, count: images.length },
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
   * Create a CSS sprite sheet from multiple images
   */
  static async createSpriteSheet(
    images: Array<{ buffer: Uint8Array; name: string }>,
    options: { layout?: 'horizontal' | 'vertical' | 'grid'; gap?: number } = {}
  ): Promise<EngineResult<{ buffer: Uint8Array; css: string; json: Record<string, { x: number; y: number; width: number; height: number }> }>> {
    const start = performance.now();
    try {
      if (images.length === 0) throw new Error('At least one image is required');

      const layout = options.layout || 'horizontal';
      const gap = options.gap || 4;

      const loadedImages = await Promise.all(
        images.map(async (img) => {
          const loaded = await this.loadImage(img.buffer);
          return { name: img.name.replace(/\.[^.]+$/, ''), img: loaded, width: loaded.width, height: loaded.height };
        })
      );

      let totalWidth = 0;
      let totalHeight = 0;

      if (layout === 'horizontal') {
        totalWidth = loadedImages.reduce((acc, curr) => acc + curr.width + gap, 0) - gap;
        totalHeight = Math.max(...loadedImages.map((i) => i.height));
      } else if (layout === 'vertical') {
        totalWidth = Math.max(...loadedImages.map((i) => i.width));
        totalHeight = loadedImages.reduce((acc, curr) => acc + curr.height + gap, 0) - gap;
      } else {
        // Grid layout (approx square)
        const cols = Math.ceil(Math.sqrt(loadedImages.length));
        const cellW = Math.max(...loadedImages.map((i) => i.width));
        const cellH = Math.max(...loadedImages.map((i) => i.height));
        const rows = Math.ceil(loadedImages.length / cols);
        totalWidth = cols * cellW + (cols - 1) * gap;
        totalHeight = rows * cellH + (rows - 1) * gap;
      }

      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      const jsonCoords: Record<string, { x: number; y: number; width: number; height: number }> = {};
      let currentX = 0;
      let currentY = 0;
      const cellW = Math.max(...loadedImages.map((i) => i.width));
      const cellH = Math.max(...loadedImages.map((i) => i.height));
      const cols = Math.ceil(Math.sqrt(loadedImages.length));

      for (let i = 0; i < loadedImages.length; i++) {
        const item = loadedImages[i];
        let x = 0;
        let y = 0;

        if (layout === 'horizontal') {
          x = currentX;
          y = 0;
          currentX += item.width + gap;
        } else if (layout === 'vertical') {
          x = 0;
          y = currentY;
          currentY += item.height + gap;
        } else {
          const col = i % cols;
          const row = Math.floor(i / cols);
          x = col * (cellW + gap);
          y = row * (cellH + gap);
        }

        ctx.drawImage(item.img, x, y);
        jsonCoords[item.name] = { x, y, width: item.width, height: item.height };
      }

      const cssLines = Object.entries(jsonCoords).map(([name, c]) => {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
        return `.sprite-${cleanName} {\n  width: ${c.width}px;\n  height: ${c.height}px;\n  background-position: -${c.x}px -${c.y}px;\n}`;
      });

      const css = `/* Toiloki Generated CSS Sprite Sheet */\n.toiloki-sprite {\n  background-image: url('spritesheet.png');\n  background-repeat: no-repeat;\n  display: inline-block;\n}\n\n` + cssLines.join('\n\n');

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Canvas export failed');
      const arrayBuf = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuf);

      return {
        success: true,
        data: { buffer, css, json: jsonCoords },
        outputBuffer: buffer,
        metadata: { width: totalWidth, height: totalHeight, count: loadedImages.length },
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
   * Compare two images pixel-by-pixel
   */
  static async compareImages(
    bufA: Uint8Array,
    bufB: Uint8Array,
    tolerance = 15
  ): Promise<EngineResult<{ diffBuffer: Uint8Array; diffPercentage: number; mismatchedPixels: number; totalPixels: number }>> {
    const start = performance.now();
    try {
      const [imgA, imgB] = await Promise.all([this.loadImage(bufA), this.loadImage(bufB)]);
      const width = Math.max(imgA.width, imgB.width);
      const height = Math.max(imgA.height, imgB.height);

      const canvasA = document.createElement('canvas');
      canvasA.width = width;
      canvasA.height = height;
      const ctxA = canvasA.getContext('2d');
      if (!ctxA) throw new Error('Canvas 2D unavailable');
      ctxA.drawImage(imgA, 0, 0);
      const dataA = ctxA.getImageData(0, 0, width, height).data;

      const canvasB = document.createElement('canvas');
      canvasB.width = width;
      canvasB.height = height;
      const ctxB = canvasB.getContext('2d');
      if (!ctxB) throw new Error('Canvas 2D unavailable');
      ctxB.drawImage(imgB, 0, 0);
      const dataB = ctxB.getImageData(0, 0, width, height).data;

      const diffCanvas = document.createElement('canvas');
      diffCanvas.width = width;
      diffCanvas.height = height;
      const diffCtx = diffCanvas.getContext('2d');
      if (!diffCtx) throw new Error('Canvas 2D unavailable');
      const diffImgData = diffCtx.createImageData(width, height);
      const outData = diffImgData.data;

      let mismatched = 0;
      const totalPixels = width * height;

      for (let i = 0; i < totalPixels * 4; i += 4) {
        const rDiff = Math.abs(dataA[i] - dataB[i]);
        const gDiff = Math.abs(dataA[i + 1] - dataB[i + 1]);
        const bDiff = Math.abs(dataA[i + 2] - dataB[i + 2]);
        const aDiff = Math.abs(dataA[i + 3] - dataB[i + 3]);

        if (rDiff > tolerance || gDiff > tolerance || bDiff > tolerance || aDiff > tolerance) {
          mismatched++;
          // High-visibility Magenta highlighting for differences
          outData[i] = 255;
          outData[i + 1] = 0;
          outData[i + 2] = 90;
          outData[i + 3] = 255;
        } else {
          // Dimmed grayscale background
          const gray = Math.round((dataA[i] * 0.299 + dataA[i + 1] * 0.587 + dataA[i + 2] * 0.114) * 0.35);
          outData[i] = gray;
          outData[i + 1] = gray;
          outData[i + 2] = gray;
          outData[i + 3] = 255;
        }
      }

      diffCtx.putImageData(diffImgData, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => diffCanvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Canvas diff export failed');
      const arrayBuf = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuf);
      const diffPercentage = parseFloat(((mismatched / totalPixels) * 100).toFixed(2));

      return {
        success: true,
        data: { diffBuffer: buffer, diffPercentage, mismatchedPixels: mismatched, totalPixels },
        outputBuffer: buffer,
        metadata: { width, height, diffPercentage },
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
   * Check if an image buffer is an animated GIF
   */
  static isAnimatedGif(buffer: Uint8Array): boolean {
    if (buffer.length < 14) return false;
    const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 &&
                  buffer[3] === 0x38 && (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61;
    if (!isGif) return false;

    let frames = 0;
    for (let i = 0; i < buffer.length - 2; i++) {
      if (buffer[i] === 0x21 && buffer[i + 1] === 0xF9) {
        frames++;
        if (frames > 1) return true;
      }
    }
    return false;
  }

  /**
   * Compress image with numeric size feedback, quality control, and isLarger preservation
   */
  static async compressImage(
    inputBuffer: Uint8Array,
    qualityPercent = 80,
    format: 'image/jpeg' | 'image/webp' | 'image/png' = 'image/webp',
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<{
    originalSize: number;
    newSize: number;
    ratioPercent: number;
    savedBytes: number;
    isLarger: boolean;
  }>> {
    const start = performance.now();
    const originalSize = inputBuffer.length;
    try {
      const res = await this.transformImage(inputBuffer, {
        quality: qualityPercent / 100,
        format,
      }, onProgress);

      if (!res.success || !res.outputBuffer) {
        throw new Error(res.error || 'Image compression failed.');
      }

      const compressedBytes = res.outputBuffer;
      const newSize = compressedBytes.length;
      const isLarger = newSize >= originalSize;
      const savedBytes = isLarger ? 0 : originalSize - newSize;
      const ratioPercent = isLarger ? 0 : Math.round((savedBytes / originalSize) * 100);
      const finalBytes = isLarger ? inputBuffer : compressedBytes;

      return {
        success: true,
        outputBuffer: finalBytes,
        data: {
          originalSize,
          newSize: isLarger ? originalSize : newSize,
          ratioPercent,
          savedBytes,
          isLarger,
        },
        metadata: {
          originalSize,
          newSize,
          ratioPercent,
          isLarger,
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
}



