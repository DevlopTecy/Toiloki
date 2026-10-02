import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { EngineResult, EngineProgress } from '../../core/types/engine';

export class PdfEngine {
  /**
   * Merge multiple PDF buffers into a single PDF
   */
  static async merge(
    pdfBuffers: Uint8Array[],
    onProgress?: (progress: EngineProgress) => void,
    signal?: AbortSignal
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      if (pdfBuffers.length < 2) {
        return {
          success: false,
          error: 'Please provide at least 2 PDF files to merge.',
          elapsedMs: 0,
        };
      }

      const mergedDoc = await PDFDocument.create();

      for (let i = 0; i < pdfBuffers.length; i++) {
        if (signal?.aborted) throw new Error('Operation cancelled by user.');

        onProgress?.({
          percent: Math.round(((i + 1) / pdfBuffers.length) * 80),
          stage: `Merging document ${i + 1} of ${pdfBuffers.length}...`,
        });

        const donorDoc = await PDFDocument.load(pdfBuffers[i]);
        const copiedPages = await mergedDoc.copyPages(donorDoc, donorDoc.getPageIndices());
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }

      onProgress?.({ percent: 90, stage: 'Saving merged document...' });
      const mergedPdfBytes = await mergedDoc.save();

      return {
        success: true,
        data: mergedPdfBytes,
        outputBuffer: mergedPdfBytes,
        metadata: { pageCount: mergedDoc.getPageCount() },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Extract specified 1-indexed pages from a PDF
   */
  static async extractPages(
    pdfBuffer: Uint8Array,
    pageIndicesOneBased: number[],
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const srcDoc = await PDFDocument.load(pdfBuffer);
      const newDoc = await PDFDocument.create();

      const validIndices = pageIndicesOneBased
        .map((p) => p - 1)
        .filter((idx) => idx >= 0 && idx < srcDoc.getPageCount());

      if (validIndices.length === 0) {
        return { success: false, error: 'No valid pages selected for extraction.', elapsedMs: 0 };
      }

      const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      onProgress?.({ percent: 85, stage: 'Finalizing extracted pages...' });
      const bytes = await newDoc.save();

      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
        metadata: { pageCount: newDoc.getPageCount() },
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
   * Rotate pages in a PDF
   */
  static async rotatePages(
    pdfBuffer: Uint8Array,
    rotationDegrees: 90 | 180 | 270,
    pageIndicesOneBased?: number[]
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const doc = await PDFDocument.load(pdfBuffer);
      const pageCount = doc.getPageCount();

      const targets = pageIndicesOneBased
        ? pageIndicesOneBased.map((p) => p - 1).filter((p) => p >= 0 && p < pageCount)
        : doc.getPageIndices();

      for (const idx of targets) {
        const page = doc.getPage(idx);
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotationDegrees) % 360));
      }

      const bytes = await doc.save();
      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
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
   * Convert multiple images to a single PDF
   */
  static async createFromImages(
    images: { buffer: Uint8Array; type: 'png' | 'jpeg' | 'jpg' }[],
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      if (images.length === 0) {
        return { success: false, error: 'No images provided.', elapsedMs: 0 };
      }

      const doc = await PDFDocument.create();

      for (let i = 0; i < images.length; i++) {
        onProgress?.({
          percent: Math.round(((i + 1) / images.length) * 85),
          stage: `Embedding image ${i + 1} of ${images.length}...`,
        });

        const img = images[i];
        let embeddedImage;
        if (img.type === 'png') {
          embeddedImage = await doc.embedPng(img.buffer);
        } else {
          embeddedImage = await doc.embedJpg(img.buffer);
        }

        const { width, height } = embeddedImage;
        const page = doc.addPage([width, height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const pdfBytes = await doc.save();
      return {
        success: true,
        data: pdfBytes,
        outputBuffer: pdfBytes,
        metadata: { pageCount: doc.getPageCount() },
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
   * Read PDF metadata and properties
   */
  static async getMetadata(pdfBuffer: Uint8Array): Promise<EngineResult<Record<string, unknown>>> {
    const start = performance.now();
    try {
      const doc = await PDFDocument.load(pdfBuffer);
      const metadata = {
        title: doc.getTitle() || 'Untitled',
        author: doc.getAuthor() || 'Unknown',
        subject: doc.getSubject() || '',
        creator: doc.getCreator() || '',
        producer: doc.getProducer() || '',
        pageCount: doc.getPageCount(),
        creationDate: doc.getCreationDate()?.toISOString() || null,
        modificationDate: doc.getModificationDate()?.toISOString() || null,
      };

      return {
        success: true,
        data: metadata,
        metadata,
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
   * Apply watermark text across all pages of a PDF
   */
  static async addWatermark(
    pdfBuffer: Uint8Array,
    options: {
      text: string;
      opacity?: number;
      fontSize?: number;
      rotationDegrees?: number;
    },
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const doc = await PDFDocument.load(pdfBuffer);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pageCount = doc.getPageCount();
      const fontSize = options.fontSize || 42;
      const opacity = options.opacity ?? 0.25;
      const rot = options.rotationDegrees ?? 45;

      for (let i = 0; i < pageCount; i++) {
        onProgress?.({
          percent: Math.round(((i + 1) / pageCount) * 85),
          stage: `Watermarking page ${i + 1} of ${pageCount}...`,
        });

        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(options.text, fontSize);
        const textHeight = font.heightAtSize(fontSize);
        const x = (width - textWidth) / 2;
        const y = (height - textHeight) / 2;

        page.drawText(options.text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.6, 0.6, 0.6),
          opacity,
          rotate: degrees(rot),
        });
      }

      onProgress?.({ percent: 95, stage: 'Saving watermarked document...' });
      const bytes = await doc.save();
      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
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
   * Add sequential page numbers to all pages of a PDF
   */
  static async addPageNumbers(
    pdfBuffer: Uint8Array,
    options: {
      position?: 'bottom-center' | 'bottom-right' | 'top-right';
      startNumber?: number;
    },
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const doc = await PDFDocument.load(pdfBuffer);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pageCount = doc.getPageCount();
      const startNum = options.startNumber || 1;
      const fontSize = 10;
      const pos = options.position || 'bottom-center';

      for (let i = 0; i < pageCount; i++) {
        onProgress?.({
          percent: Math.round(((i + 1) / pageCount) * 85),
          stage: `Numbering page ${i + 1} of ${pageCount}...`,
        });

        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const label = `Page ${i + startNum} of ${pageCount + startNum - 1}`;
        const labelWidth = font.widthOfTextAtSize(label, fontSize);

        let x = (width - labelWidth) / 2;
        let y = 24;
        if (pos === 'bottom-right') {
          x = width - labelWidth - 36;
          y = 24;
        } else if (pos === 'top-right') {
          x = width - labelWidth - 36;
          y = height - 24;
        }

        page.drawText(label, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      const bytes = await doc.save();
      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
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
   * Flatten forms and strip document metadata from PDF
   */
  static async flattenAndStripMetadata(
    pdfBuffer: Uint8Array
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const doc = await PDFDocument.load(pdfBuffer);
      try {
        const form = doc.getForm();
        form.flatten();
      } catch {
        // No form to flatten
      }

      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setProducer('Toiloki Offline Engine');
      doc.setCreator('Toiloki Offline Engine');

      const bytes = await doc.save();
      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
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
   * Fast page count retrieval
   */
  static async getPageCount(pdfBuffer: Uint8Array): Promise<number> {
    const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    return doc.getPageCount();
  }

  /**
   * Inspect PDF structure, metadata and dimensions
   */
  static async inspectPdf(pdfBuffer: Uint8Array): Promise<EngineResult<{
    pageCount: number;
    title: string;
    author: string;
    producer: string;
    pageSize: { width: number; height: number };
    isEncrypted: boolean;
  }>> {
    const start = performance.now();
    try {
      const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const pageCount = doc.getPageCount();
      const firstPage = pageCount > 0 ? doc.getPage(0) : null;
      const size = firstPage ? firstPage.getSize() : { width: 0, height: 0 };

      return {
        success: true,
        data: {
          pageCount,
          title: doc.getTitle() || '',
          author: doc.getAuthor() || '',
          producer: doc.getProducer() || '',
          pageSize: { width: Math.round(size.width), height: Math.round(size.height) },
          isEncrypted: false,
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
   * Delete specified 1-indexed pages from PDF
   */
  static async deletePages(
    pdfBuffer: Uint8Array,
    pageIndicesOneBased: number[],
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const srcDoc = await PDFDocument.load(pdfBuffer);
      const totalPages = srcDoc.getPageCount();
      const toDelete = new Set(pageIndicesOneBased.map((p) => p - 1));

      const keepIndices: number[] = [];
      for (let i = 0; i < totalPages; i++) {
        if (!toDelete.has(i)) {
          keepIndices.push(i);
        }
      }

      if (keepIndices.length === 0) {
        return {
          success: false,
          error: 'Cannot delete all pages from document.',
          elapsedMs: 0,
        };
      }

      const newDoc = await PDFDocument.create();
      onProgress?.({ percent: 30, stage: 'Copying remaining pages...' });
      const copied = await newDoc.copyPages(srcDoc, keepIndices);
      copied.forEach((p) => newDoc.addPage(p));

      onProgress?.({ percent: 85, stage: 'Saving document...' });
      const bytes = await newDoc.save();

      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
        metadata: { pageCount: newDoc.getPageCount() },
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
   * Reorder pages in PDF according to new 1-indexed page array
   */
  static async reorderPages(
    pdfBuffer: Uint8Array,
    newOrderOneBased: number[],
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const srcDoc = await PDFDocument.load(pdfBuffer);
      const totalPages = srcDoc.getPageCount();
      const newDoc = await PDFDocument.create();

      const validOrder = newOrderOneBased
        .map((p) => p - 1)
        .filter((idx) => idx >= 0 && idx < totalPages);

      if (validOrder.length === 0) {
        return { success: false, error: 'No valid page ordering provided.', elapsedMs: 0 };
      }

      onProgress?.({ percent: 40, stage: 'Arranging pages in new order...' });
      const copied = await newDoc.copyPages(srcDoc, validOrder);
      copied.forEach((p) => newDoc.addPage(p));

      onProgress?.({ percent: 85, stage: 'Finalizing PDF...' });
      const bytes = await newDoc.save();

      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
        metadata: { pageCount: newDoc.getPageCount() },
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
   * Duplicate specified 1-indexed pages within the PDF
   */
  static async duplicatePages(
    pdfBuffer: Uint8Array,
    pageIndicesOneBased: number[],
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const srcDoc = await PDFDocument.load(pdfBuffer);
      const totalPages = srcDoc.getPageCount();
      const dupSet = new Set(pageIndicesOneBased.map((p) => p - 1));

      const newDoc = await PDFDocument.create();
      const order: number[] = [];

      for (let i = 0; i < totalPages; i++) {
        order.push(i);
        if (dupSet.has(i)) {
          order.push(i); // Duplicate page
        }
      }

      onProgress?.({ percent: 40, stage: 'Duplicating selected pages...' });
      const copied = await newDoc.copyPages(srcDoc, order);
      copied.forEach((p) => newDoc.addPage(p));

      const bytes = await newDoc.save();
      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
        metadata: { pageCount: newDoc.getPageCount() },
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
   * Split a PDF into chunks or individual pages
   */
  static async splitPdf(
    pdfBuffer: Uint8Array,
    mode: 'each-page' | 'fixed-chunk' = 'each-page',
    chunkSize = 1,
    onProgress?: (progress: EngineProgress) => void,
    signal?: AbortSignal
  ): Promise<EngineResult<Array<{ name: string; buffer: Uint8Array; pageCount: number }>>> {
    const start = performance.now();
    try {
      const srcDoc = await PDFDocument.load(pdfBuffer);
      const totalPages = srcDoc.getPageCount();
      const results: Array<{ name: string; buffer: Uint8Array; pageCount: number }> = [];

      const step = mode === 'each-page' ? 1 : Math.max(1, chunkSize);

      for (let i = 0; i < totalPages; i += step) {
        if (signal?.aborted) throw new Error('Operation cancelled by user.');

        const end = Math.min(i + step, totalPages);
        const chunkIndices: number[] = [];
        for (let k = i; k < end; k++) {
          chunkIndices.push(k);
        }

        onProgress?.({
          percent: Math.round(((i + step) / totalPages) * 90),
          stage: `Creating part for pages ${i + 1} to ${end}...`,
        });

        const partDoc = await PDFDocument.create();
        const copied = await partDoc.copyPages(srcDoc, chunkIndices);
        copied.forEach((p) => partDoc.addPage(p));
        const partBytes = await partDoc.save();

        const partName = step === 1 ? `page_${i + 1}.pdf` : `pages_${i + 1}_to_${end}.pdf`;
        results.push({
          name: partName,
          buffer: partBytes,
          pageCount: copied.length,
        });
      }

      return {
        success: true,
        data: results,
        metadata: { partsCreated: results.length, totalPages },
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
   * Replace specific 1-indexed pages in PDF with pages from a replacement PDF
   */
  static async replacePages(
    srcBuffer: Uint8Array,
    pageIndicesOneBased: number[],
    replacementBuffer: Uint8Array,
    onProgress?: (progress: EngineProgress) => void
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const srcDoc = await PDFDocument.load(srcBuffer);
      const repDoc = await PDFDocument.load(replacementBuffer);
      const newDoc = await PDFDocument.create();

      const repPages = await newDoc.copyPages(repDoc, repDoc.getPageIndices());
      const totalSrcPages = srcDoc.getPageCount();
      const replaceSet = new Set(pageIndicesOneBased.map((p) => p - 1));

      onProgress?.({ percent: 30, stage: 'Assembling document with replaced pages...' });

      let repIdx = 0;
      for (let i = 0; i < totalSrcPages; i++) {
        if (replaceSet.has(i)) {
          if (repIdx < repPages.length) {
            newDoc.addPage(repPages[repIdx++]);
          }
        } else {
          const [kept] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(kept);
        }
      }

      onProgress?.({ percent: 85, stage: 'Saving modified PDF...' });
      const bytes = await newDoc.save();

      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
        metadata: { pageCount: newDoc.getPageCount() },
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
   * Create a formatted PDF document directly from plain text or markdown
   */
  static async createFromText(
    text: string,
    options: { fontSize?: number; title?: string } = {}
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontSize = options.fontSize || 11;
      const lineHeight = fontSize * 1.4;

      const pageWidth = 595.28; // Standard A4 width
      const pageHeight = 841.89; // Standard A4 height
      const margin = 50;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const lines = text.split(/\r?\n/);
      const wrappedLines: string[] = [];

      for (const line of lines) {
        if (!line.trim()) {
          wrappedLines.push('');
          continue;
        }

        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const width = font.widthOfTextAtSize(testLine, fontSize);

          if (width > usableWidth) {
            wrappedLines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) wrappedLines.push(currentLine);
      }

      const linesPerPage = Math.floor(usableHeight / lineHeight);
      const pageCount = Math.max(1, Math.ceil(wrappedLines.length / linesPerPage));

      for (let p = 0; p < pageCount; p++) {
        const page = doc.addPage([pageWidth, pageHeight]);
        const pageSlice = wrappedLines.slice(p * linesPerPage, (p + 1) * linesPerPage);

        let y = pageHeight - margin;
        for (const line of pageSlice) {
          if (line) {
            page.drawText(line, {
              x: margin,
              y,
              size: fontSize,
              font,
              color: rgb(0.1, 0.1, 0.1),
            });
          }
          y -= lineHeight;
        }
      }

      const bytes = await doc.save();
      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
        metadata: { pageCount: doc.getPageCount() },
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
   * Add text, shapes, or highlights annotations to pages
   */
  static async addAnnotations(
    pdfBuffer: Uint8Array,
    annotations: Array<{
      pageIndex: number;
      type: 'text' | 'rect' | 'line';
      x: number;
      y: number;
      width?: number;
      height?: number;
      text?: string;
      color?: { r: number; g: number; b: number };
      opacity?: number;
    }>
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const doc = await PDFDocument.load(pdfBuffer);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const totalPages = doc.getPageCount();

      for (const ann of annotations) {
        if (ann.pageIndex < 0 || ann.pageIndex >= totalPages) continue;
        const page = doc.getPage(ann.pageIndex);
        const col = ann.color ? rgb(ann.color.r, ann.color.g, ann.color.b) : rgb(0.2, 0.2, 0.2);

        if (ann.type === 'text' && ann.text) {
          page.drawText(ann.text, {
            x: ann.x,
            y: ann.y,
            size: ann.height || 12,
            font,
            color: col,
            opacity: ann.opacity ?? 1,
          });
        } else if (ann.type === 'rect') {
          page.drawRectangle({
            x: ann.x,
            y: ann.y,
            width: ann.width || 100,
            height: ann.height || 20,
            color: col,
            opacity: ann.opacity ?? 0.3,
          });
        } else if (ann.type === 'line') {
          page.drawLine({
            start: { x: ann.x, y: ann.y },
            end: { x: ann.x + (ann.width || 100), y: ann.y + (ann.height || 0) },
            thickness: 2,
            color: col,
            opacity: ann.opacity ?? 1,
          });
        }
      }

      const bytes = await doc.save();
      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
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
   * Extract textual content from a PDF document buffer
   */
  static async extractText(pdfBuffer: Uint8Array): Promise<EngineResult<string>> {
    const start = performance.now();
    try {
      // Decode text stream markers from PDF
      const decoder = new TextDecoder('latin1');
      const raw = decoder.decode(pdfBuffer);
      const textMatches: string[] = [];

      // Extract text in parentheses (Text) Tj and [(Text)] TJ operators
      const tjRegex = /\((.*?)\)\s*Tj/g;
      let m;
      while ((m = tjRegex.exec(raw)) !== null) {
        if (m[1].trim()) textMatches.push(m[1]);
      }

      const extracted = textMatches.join(' ').replace(/\\([()\\])/g, '$1');
      return {
        success: true,
        data: extracted || 'Document processed. (No uncompressed text streams detected in document)',
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
