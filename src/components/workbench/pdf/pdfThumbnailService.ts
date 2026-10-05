import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker in browser environment
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  } catch {
    // fallback or default worker handling
  }
}

export interface PdfPageThumb {
  pageNumber: number; // 1-based
  dataUrl?: string;
  width?: number;
  height?: number;
  rotation?: number;
  isBlank?: boolean;
}

const thumbnailCache = new Map<string, string>();

/**
 * Render thumbnail data URL for a specific page of a PDF buffer
 */
export async function renderPageThumbnail(
  buffer: Uint8Array,
  pageNumber: number, // 1-based
  targetWidth = 180
): Promise<{ dataUrl: string; width: number; height: number; isBlank: boolean } | null> {
  const cacheKey = `${buffer.byteLength}_${buffer.slice(0, 16).join('-')}_p${pageNumber}_w${targetWidth}`;
  if (thumbnailCache.has(cacheKey)) {
    return {
      dataUrl: thumbnailCache.get(cacheKey)!,
      width: targetWidth,
      height: Math.round(targetWidth * 1.414),
      isBlank: false,
    };
  }

  try {
    const localBase = typeof window !== 'undefined' && window.location ? window.location.href : '';
    const loadingTask = pdfjsLib.getDocument({
      data: buffer.slice(0),
      cMapUrl: localBase ? new URL('cmaps/', localBase).href : './cmaps/',
      cMapPacked: true,
      standardFontDataUrl: localBase ? new URL('standard_fonts/', localBase).href : './standard_fonts/',
    });
    const pdfDoc = await loadingTask.promise;
    if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
      return null;
    }

    const page = await pdfDoc.getPage(pageNumber);
    const initialViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / initialViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    // Check if page is largely blank
    let isBlank = false;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let nonWhitePixels = 0;
      const totalPixels = canvas.width * canvas.height;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r < 240 || g < 240 || b < 240) {
          nonWhitePixels++;
        }
      }
      if (nonWhitePixels / (totalPixels / 4) < 0.005) {
        isBlank = true;
      }
    } catch {
      // ignore pixel inspection error
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    thumbnailCache.set(cacheKey, dataUrl);

    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      isBlank,
    };
  } catch (err) {
    console.warn(`Failed to render thumbnail for page ${pageNumber}:`, err);
    return null;
  }
}
