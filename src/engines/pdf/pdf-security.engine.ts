import { PDFDocument } from 'pdf-lib';
import { EngineResult } from '../../core/types/engine';

export interface PdfSecurityInfo {
  isEncrypted: boolean;
  canPrint?: boolean;
  canModify?: boolean;
  canCopy?: boolean;
  encryptionMethod?: string;
}

export class PdfSecurityEngine {
  /**
   * Check if a PDF document is encrypted or password-protected
   */
  static async inspectSecurity(pdfBuffer: Uint8Array): Promise<EngineResult<PdfSecurityInfo>> {
    const start = performance.now();
    try {
      // First attempt to load normally
      try {
        const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: false });
        return {
          success: true,
          data: {
            isEncrypted: false,
            canPrint: true,
            canModify: true,
            canCopy: true,
            encryptionMethod: 'None (Unprotected)',
          },
          elapsedMs: Math.round(performance.now() - start),
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('encrypt') || msg.includes('password') || msg.includes('standard security handler')) {
          return {
            success: true,
            data: {
              isEncrypted: true,
              canPrint: false,
              canModify: false,
              canCopy: false,
              encryptionMethod: 'Standard PDF Security Handler (Encrypted)',
            },
            elapsedMs: Math.round(performance.now() - start),
          };
        }
        throw err;
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Remove non-cryptographic permissions restrictions by re-serializing unprotected streams
   */
  static async unlockAndSanitize(
    pdfBuffer: Uint8Array
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      // Load with ignoreEncryption flag to read content if only permission restricted
      const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const pageCount = doc.getPageCount();
      const pages = await newDoc.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => newDoc.addPage(p));

      const cleanBytes = await newDoc.save();

      return {
        success: true,
        data: cleanBytes,
        outputBuffer: cleanBytes,
        metadata: { pageCount },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: `Could not unlock document: ${err instanceof Error ? err.message : String(err)}`,
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }
}
