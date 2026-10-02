import mammoth from 'mammoth';
import { EngineResult } from '../../core/types/engine';

export interface DocumentConversionResult {
  content: string;
  outputFormat: 'html' | 'txt' | 'md' | 'rtf' | 'docx';
  limitationsWarning?: string;
}

export class DocumentEngine {
  /**
   * Convert Word (.docx) buffer to clean HTML using mammoth
   */
  static async docxToHtml(docxBuffer: Uint8Array): Promise<EngineResult<string>> {
    const start = performance.now();
    try {
      const buffer = docxBuffer.buffer.slice(
        docxBuffer.byteOffset,
        docxBuffer.byteOffset + docxBuffer.byteLength
      );
      const res = await mammoth.convertToHtml({ arrayBuffer: buffer });

      return {
        success: true,
        data: res.value,
        metadata: {
          messages: res.messages,
          limitations: 'Converts headings, paragraphs, lists, and tables. Word macros and embedded shapes are omitted.',
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: `DOCX extraction error: ${err instanceof Error ? err.message : String(err)}`,
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Extract plain text from Word (.docx) buffer
   */
  static async docxToText(docxBuffer: Uint8Array): Promise<EngineResult<string>> {
    const start = performance.now();
    try {
      const buffer = docxBuffer.buffer.slice(
        docxBuffer.byteOffset,
        docxBuffer.byteOffset + docxBuffer.byteLength
      );
      const res = await mammoth.extractRawText({ arrayBuffer: buffer });

      return {
        success: true,
        data: res.value,
        metadata: {
          messages: res.messages,
          limitations: 'Extracts textual content. Formatting, colors, and layout are removed.',
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: `DOCX extraction error: ${err instanceof Error ? err.message : String(err)}`,
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Convert Markdown to standard HTML
   */
  static markdownToHtml(mdText: string): EngineResult<string> {
    const start = performance.now();
    try {
      let html = mdText
        // Escape existing HTML tags for safety
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold & Italic
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/gim, '<code>$1</code>')
        // Blockquotes
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
        // Unordered lists
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        // Paragraph breaks
        .replace(/\n\s*\n/gim, '</p><p>');

      html = `<p>${html}</p>`.replace(/<p><\/p>/g, '');

      return {
        success: true,
        data: html,
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
   * Convert basic HTML to Markdown
   */
  static htmlToMarkdown(htmlText: string): EngineResult<string> {
    const start = performance.now();
    try {
      let md = htmlText
        .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i>(.*?)<\/i>/gi, '*$1*')
        .replace(/<code>(.*?)<\/code>/gi, '`$1`')
        .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
        .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, '') // Strip remaining tags
        .trim();

      return {
        success: true,
        data: md,
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
   * Convert plain text to standard Rich Text Format (RTF) string
   */
  static textToRtf(plainText: string): EngineResult<string> {
    const start = performance.now();
    try {
      const escaped = plainText
        .replace(/\\/g, '\\\\')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\n/g, '\\par\n');

      const rtf = `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}\n\\viewkind4\\uc1\\pard\\lang1033\\f0\\fs20\n${escaped}\n}`;

      return {
        success: true,
        data: rtf,
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
   * Extract plain text from RTF string
   */
  static rtfToText(rtfText: string): EngineResult<string> {
    const start = performance.now();
    try {
      let text = rtfText
        .replace(/\\par[d]?/g, '\n')
        .replace(/\{\\*?\\[^{}]+;?\}|[{}]|\\\n?[A-Za-z]+[0-9-]*\s?/g, '')
        .trim();

      return {
        success: true,
        data: text,
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
