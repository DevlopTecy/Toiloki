import mammoth from 'mammoth';
import JSZip from 'jszip';
import { EngineResult } from '../../core/types/engine';
import { PdfEngine } from '../pdf/pdf.engine';

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

  /**
   * Convert plain text or markdown to a standard OpenXML (.docx) Word document package
   */
  static async createDocxFromText(
    text: string,
    title: string = 'Document'
  ): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const zip = new JSZip();

      zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

      zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

      zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

      const paragraphs = text.split(/\r?\n/);
      let paragraphsXml = '';

      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) {
          paragraphsXml += '<w:p/>';
          continue;
        }

        const escaped = trimmed
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        paragraphsXml += `<w:p><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
      }

      zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`);

      const bytes = await zip.generateAsync({ type: 'uint8array' });
      return {
        success: true,
        data: bytes,
        outputBuffer: bytes,
        metadata: {
          title,
          limitations: 'Converts sequential text and paragraphs. Complex multi-column tables, vector art, and dynamic form fields are flattened into clean text.',
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
   * Convert a PDF buffer to an editable Word (.docx) document
   */
  static async pdfToDocx(pdfBuffer: Uint8Array): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const textRes = await PdfEngine.extractText(pdfBuffer);
      const text = textRes.success && textRes.data ? textRes.data : '[No selectable text detected in PDF document]';
      const docxRes = await this.createDocxFromText(text, 'Converted PDF');
      if (!docxRes.success || !docxRes.data) throw new Error(docxRes.error || 'Failed to generate Word document');

      return {
        success: true,
        data: docxRes.data,
        outputBuffer: docxRes.data,
        metadata: {
          characterCount: text.length,
          limitations: 'Text paragraphs and linear flow extracted into DOCX. Scanned image-only PDFs require OCR; complex multi-column layouts are merged into linear text order.',
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
   * Generate hierarchical Table of Contents from markdown or document headings
   */
  static generateToc(
    text: string,
    options: { format?: 'markdown' | 'numbered' | 'bullets' | 'html'; maxDepth?: number } = {}
  ): EngineResult<{ toc: string; headings: Array<{ level: number; text: string; slug: string }> }> {
    const start = performance.now();
    try {
      const format = options.format || 'markdown';
      const maxDepth = options.maxDepth || 4;
      const lines = text.split(/\r?\n/);
      const headings: Array<{ level: number; text: string; slug: string }> = [];

      for (const line of lines) {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          if (level <= maxDepth) {
            const hText = match[2].trim();
            const slug = hText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            headings.push({ level, text: hText, slug });
          }
        }
      }

      if (headings.length === 0) {
        return {
          success: true,
          data: { toc: 'No markdown headings (# Heading) found in document.', headings: [] },
          elapsedMs: Math.round(performance.now() - start),
        };
      }

      const minLevel = Math.min(...headings.map((h) => h.level));
      const counters = [0, 0, 0, 0, 0, 0];
      const resultLines: string[] = [];

      for (const h of headings) {
        const indentLevel = h.level - minLevel;
        const indent = '  '.repeat(indentLevel);

        if (format === 'markdown') {
          resultLines.push(`${indent}- [${h.text}](#${h.slug})`);
        } else if (format === 'numbered') {
          counters[h.level - 1]++;
          for (let i = h.level; i < counters.length; i++) counters[i] = 0;
          const numStr = counters.slice(minLevel - 1, h.level).join('.');
          resultLines.push(`${indent}${numStr}. ${h.text}`);
        } else if (format === 'html') {
          resultLines.push(`${indent}<li><a href="#${h.slug}">${h.text}</a></li>`);
        } else {
          resultLines.push(`${indent}• ${h.text}`);
        }
      }

      const toc = format === 'html' ? `<ul>\n${resultLines.join('\n')}\n</ul>` : resultLines.join('\n');
      return {
        success: true,
        data: { toc, headings },
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
   * Mail merge template with records (array of key-value maps)
   */
  static mailMerge(
    template: string,
    records: Array<Record<string, string>>
  ): EngineResult<{ mergedDocs: string[]; count: number }> {
    const start = performance.now();
    try {
      if (!records || records.length === 0) {
        throw new Error('At least one data record is required for mail merge');
      }

      const mergedDocs = records.map((record) => {
        let doc = template;
        for (const [key, value] of Object.entries(record)) {
          const regex = new RegExp(`{{\\s*${key.trim()}\\s*}}`, 'gi');
          doc = doc.replace(regex, value ?? '');
        }
        return doc;
      });

      return {
        success: true,
        data: { mergedDocs, count: mergedDocs.length },
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
   * Batch Find and Replace across document text
   */
  static batchFindReplace(
    text: string,
    rules: Array<{ find: string; replace: string; matchCase?: boolean; matchWholeWord?: boolean; isRegex?: boolean }>
  ): EngineResult<{ text: string; replacementsCount: number; ruleMatches: number[] }> {
    const start = performance.now();
    try {
      let currentText = text;
      let totalReplacements = 0;
      const ruleMatches: number[] = [];

      for (const rule of rules) {
        if (!rule.find) {
          ruleMatches.push(0);
          continue;
        }

        let pattern = rule.find;
        if (!rule.isRegex) {
          pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        if (rule.matchWholeWord) {
          pattern = `\\b${pattern}\\b`;
        }

        const flags = rule.matchCase ? 'g' : 'gi';
        const regex = new RegExp(pattern, flags);

        let matches = 0;
        currentText = currentText.replace(regex, () => {
          matches++;
          return rule.replace;
        });

        ruleMatches.push(matches);
        totalReplacements += matches;
      }

      return {
        success: true,
        data: { text: currentText, replacementsCount: totalReplacements, ruleMatches },
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
   * Inspect metadata from Office documents (.docx, .xlsx, .pptx)
   */
  static async inspectOfficeMetadata(buffer: Uint8Array): Promise<EngineResult<{
    title?: string;
    creator?: string;
    lastModifiedBy?: string;
    revision?: string;
    created?: string;
    modified?: string;
    description?: string;
    application?: string;
    company?: string;
    hasMetadata: boolean;
  }>> {
    const start = performance.now();
    try {
      const zip = await JSZip.loadAsync(buffer);
      const coreXmlFile = zip.file('docProps/core.xml');
      const appXmlFile = zip.file('docProps/app.xml');

      let title: string | undefined;
      let creator: string | undefined;
      let lastModifiedBy: string | undefined;
      let revision: string | undefined;
      let created: string | undefined;
      let modified: string | undefined;
      let description: string | undefined;
      let application: string | undefined;
      let company: string | undefined;

      const extractTag = (xml: string, tag: string): string | undefined => {
        const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tag}>`, 'i');
        const match = xml.match(regex);
        return match ? match[1].trim() : undefined;
      };

      if (coreXmlFile) {
        const coreXml = await coreXmlFile.async('text');
        title = extractTag(coreXml, 'title');
        creator = extractTag(coreXml, 'creator');
        lastModifiedBy = extractTag(coreXml, 'lastModifiedBy');
        revision = extractTag(coreXml, 'revision');
        created = extractTag(coreXml, 'created');
        modified = extractTag(coreXml, 'modified');
        description = extractTag(coreXml, 'description');
      }

      if (appXmlFile) {
        const appXml = await appXmlFile.async('text');
        application = extractTag(appXml, 'Application');
        company = extractTag(appXml, 'Company');
      }

      const hasMetadata = Boolean(title || creator || lastModifiedBy || revision || created || modified || application);

      return {
        success: true,
        data: {
          title,
          creator,
          lastModifiedBy,
          revision,
          created,
          modified,
          description,
          application,
          company,
          hasMetadata,
        },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to inspect Office file metadata: ${err instanceof Error ? err.message : String(err)}`,
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }

  /**
   * Scrub metadata from Office documents (.docx, .xlsx, .pptx)
   */
  static async scrubOfficeMetadata(buffer: Uint8Array): Promise<EngineResult<Uint8Array>> {
    const start = performance.now();
    try {
      const zip = await JSZip.loadAsync(buffer);
      const cleanCoreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:dcmitype="http://purl.org/dc/dcmitype/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title></dc:title>
  <dc:creator></dc:creator>
  <cp:lastModifiedBy></cp:lastModifiedBy>
  <cp:revision>1</cp:revision>
</cp:coreProperties>`;

      zip.file('docProps/core.xml', cleanCoreXml);

      const cleanAppXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Toiloki Local Suite</Application>
  <Company></Company>
</Properties>`;
      if (zip.file('docProps/app.xml')) {
        zip.file('docProps/app.xml', cleanAppXml);
      }

      const scrubbedBuffer = await zip.generateAsync({ type: 'uint8array' });
      return {
        success: true,
        data: scrubbedBuffer,
        outputBuffer: scrubbedBuffer,
        metadata: { scrubbed: true },
        elapsedMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to scrub Office file metadata: ${err instanceof Error ? err.message : String(err)}`,
        elapsedMs: Math.round(performance.now() - start),
      };
    }
  }
}

