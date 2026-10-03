import { WORKSPACES } from '../registry/app-registry';
import { WorkspaceId } from '../types/workspace';

export type DetectedFormatId =
  | 'json'
  | 'jwt'
  | 'cron'
  | 'color'
  | 'timestamp'
  | 'csv'
  | 'base64'
  | 'url'
  | 'unknown';

export interface MatchingUtilitySuggestion {
  workspaceId: WorkspaceId;
  groupId: string;
  utilityId: string;
  name: string;
  description: string;
  badge?: string;
  isPrimary?: boolean;
}

export interface SmartPasteDetection {
  formatId: DetectedFormatId;
  formatTitle: string;
  badgeText: string;
  confidence: number; // 0 to 1
  previewSnippet: string;
  extractedMeta?: Record<string, any>;
  suggestedUtilities: MatchingUtilitySuggestion[];
  rawText: string;
}

export class SmartPasteService {
  /**
   * Sniff text content and detect if it matches known patterns
   */
  static detect(input: string): SmartPasteDetection {
    const raw = (input || '').trim();

    if (!raw) {
      return {
        formatId: 'unknown',
        formatTitle: 'Empty or Plain Text',
        badgeText: 'TEXT',
        confidence: 0,
        previewSnippet: '',
        suggestedUtilities: [],
        rawText: input,
      };
    }

    // 1. Check JWT (header.payload.signature)
    const jwtDetection = this.detectJwt(raw);
    if (jwtDetection) return jwtDetection;

    // 2. Check JSON
    const jsonDetection = this.detectJson(raw);
    if (jsonDetection) return jsonDetection;

    // 3. Check Cron Expression
    const cronDetection = this.detectCron(raw);
    if (cronDetection) return cronDetection;

    // 4. Check Color (Hex, RGB, HSL)
    const colorDetection = this.detectColor(raw);
    if (colorDetection) return colorDetection;

    // 5. Check Timestamp (Unix Epoch or ISO 8601)
    const timestampDetection = this.detectTimestamp(raw);
    if (timestampDetection) return timestampDetection;

    // 6. Check URL
    const urlDetection = this.detectUrl(raw);
    if (urlDetection) return urlDetection;

    // 7. Check CSV / TSV
    const csvDetection = this.detectCsv(raw);
    if (csvDetection) return csvDetection;

    // 8. Check Base64
    const base64Detection = this.detectBase64(raw);
    if (base64Detection) return base64Detection;

    // Default Fallback
    return {
      formatId: 'unknown',
      formatTitle: 'Plain Text',
      badgeText: 'TEXT',
      confidence: 0.2,
      previewSnippet: raw.length > 120 ? raw.slice(0, 120) + '...' : raw,
      suggestedUtilities: [
        {
          workspaceId: 'text',
          groupId: 'text-transformer',
          utilityId: 'case-conversion',
          name: 'Case Conversion',
          description: 'Convert between uppercase, lowercase, camelCase, and title case.',
          isPrimary: true,
        },
        {
          workspaceId: 'text',
          groupId: 'text-analyzer',
          utilityId: 'text-statistics',
          name: 'Text Statistics',
          description: 'Word count, character count, and sentence density.',
        },
        {
          workspaceId: 'developer',
          groupId: 'dev-encode',
          utilityId: 'dev-base64',
          name: 'Base64 Encoder',
          description: 'Encode plain text into Base64 format.',
        },
      ],
      rawText: raw,
    };
  }

  // ─── 1. JWT DETECTION ───
  private static detectJwt(text: string): SmartPasteDetection | null {
    // Standard compact serialization: 3 base64url segments separated by dots
    const jwtRegex = /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_.-]*$/;
    if (!jwtRegex.test(text)) return null;

    try {
      const parts = text.split('.');
      if (parts.length !== 3) return null;

      // Try decoding payload
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = payloadBase64.length % 4;
      const padded = pad ? payloadBase64 + '='.repeat(4 - pad) : payloadBase64;
      const decodedPayload = atob(padded);
      const parsedPayload = JSON.parse(decodedPayload);

      return {
        formatId: 'jwt',
        formatTitle: 'JSON Web Token (JWT)',
        badgeText: 'JWT',
        confidence: 0.98,
        previewSnippet: `Header + Payload (${Object.keys(parsedPayload).slice(0, 4).join(', ')})`,
        extractedMeta: {
          issuer: parsedPayload.iss,
          subject: parsedPayload.sub,
          audience: parsedPayload.aud,
          exp: parsedPayload.exp,
        },
        suggestedUtilities: [
          {
            workspaceId: 'developer',
            groupId: 'dev-encode',
            utilityId: 'dev-jwt',
            name: 'JWT Inspector',
            description: 'Decode and inspect JWT header, claims, and signature validity.',
            isPrimary: true,
          },
          {
            workspaceId: 'developer',
            groupId: 'dev-encode',
            utilityId: 'dev-base64',
            name: 'Base64 Decoder',
            description: 'Inspect raw base64url segments independently.',
          },
        ],
        rawText: text,
      };
    } catch {
      return null;
    }
  }

  // ─── 2. JSON DETECTION ───
  private static detectJson(text: string): SmartPasteDetection | null {
    if (!((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']')))) {
      return null;
    }

    try {
      const parsed = JSON.parse(text);
      const isArray = Array.isArray(parsed);
      const keysCount = isArray ? parsed.length : Object.keys(parsed).length;

      return {
        formatId: 'json',
        formatTitle: isArray ? `JSON Array (${keysCount} items)` : `JSON Object (${keysCount} fields)`,
        badgeText: 'JSON',
        confidence: 0.99,
        previewSnippet: text.length > 120 ? text.slice(0, 120).replace(/\s+/g, ' ') + '...' : text,
        extractedMeta: { isArray, keysCount },
        suggestedUtilities: [
          {
            workspaceId: 'developer',
            groupId: 'dev-formatter',
            utilityId: 'format-json-code',
            name: 'JSON Formatter',
            description: 'Format, prettify, and minify JSON with custom indentation.',
            isPrimary: true,
          },
          {
            workspaceId: 'data',
            groupId: 'data-compare',
            utilityId: 'data-json-diff',
            name: 'JSON Diff',
            description: 'Compare this JSON structure against another file or revision.',
          },
          {
            workspaceId: 'developer',
            groupId: 'dev-encode',
            utilityId: 'dev-base64',
            name: 'Base64 Encode',
            description: 'Encode this JSON payload for network transport.',
          },
        ],
        rawText: text,
      };
    } catch {
      return null;
    }
  }

  // ─── 3. CRON EXPRESSION DETECTION ───
  private static detectCron(text: string): SmartPasteDetection | null {
    // 5 or 6 whitespace-separated tokens
    const parts = text.split(/\s+/);
    if (parts.length !== 5 && parts.length !== 6) return null;

    // Cron field allowed characters: numbers, *, /, -, ,, L, W, #, ?, names
    const cronFieldRegex = /^(\*|[0-9]{1,2}|\?|L|W|[A-Za-z]{3})(?:[-,/][0-9A-Za-z?LW#]+)*$/;
    const isAllValid = parts.every((p) => cronFieldRegex.test(p));

    if (!isAllValid) return null;

    // At least one wildcard or step to differentiate from ordinary space-separated words
    const hasCronFeatures = parts.some((p) => p.includes('*') || p.includes('/') || p === '?');
    if (!hasCronFeatures) return null;

    return {
      formatId: 'cron',
      formatTitle: 'Cron Schedule Expression',
      badgeText: 'CRON',
      confidence: 0.92,
      previewSnippet: text,
      extractedMeta: { fields: parts.length },
      suggestedUtilities: [
        {
          workspaceId: 'developer',
          groupId: 'dev-utilities',
          utilityId: 'dev-cron-explainer',
          name: 'Cron Explainer',
          description: 'Translate this cron expression into plain human English schedule.',
          isPrimary: true,
        },
        {
          workspaceId: 'calculator',
          groupId: 'calc-date-time',
          utilityId: 'calc-date-diff',
          name: 'Date Difference',
          description: 'Calculate time delta until next execution.',
        },
      ],
      rawText: text,
    };
  }

  // ─── 4. COLOR DETECTION ───
  private static detectColor(text: string): SmartPasteDetection | null {
    // Hex: #FFF, #FFFFFF, #FFFFFFFF
    const hexMatch = text.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
    if (hexMatch) {
      return {
        formatId: 'color',
        formatTitle: `Hex Color (${text.toUpperCase()})`,
        badgeText: 'COLOR',
        confidence: 0.95,
        previewSnippet: text.toUpperCase(),
        extractedMeta: { color: text, type: 'hex' },
        suggestedUtilities: [
          {
            workspaceId: 'design',
            groupId: 'design-color',
            utilityId: 'design-color-converter',
            name: 'Color Converter',
            description: 'Convert between HEX, RGB, HSL, HSV, CMYK, and CIE LAB.',
            isPrimary: true,
          },
          {
            workspaceId: 'design',
            groupId: 'design-color',
            utilityId: 'design-palette-generator',
            name: 'Palette Generator',
            description: 'Generate monochromatic, analogous, and complementary harmonies.',
          },
          {
            workspaceId: 'design',
            groupId: 'design-color',
            utilityId: 'design-contrast-checker',
            name: 'WCAG Contrast Checker',
            description: 'Verify accessibility compliance against white/black backgrounds.',
          },
          {
            workspaceId: 'design',
            groupId: 'design-color',
            utilityId: 'design-gradient-generator',
            name: 'Gradient Generator',
            description: 'Create multi-stop CSS gradients starting with this color.',
          },
        ],
        rawText: text,
      };
    }

    // RGB or RGBA: rgb(255, 0, 0)
    const rgbMatch = text.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+%?))?\s*\)$/i);
    if (rgbMatch) {
      return {
        formatId: 'color',
        formatTitle: `RGB Color (${text})`,
        badgeText: 'COLOR',
        confidence: 0.95,
        previewSnippet: text,
        extractedMeta: { color: text, type: 'rgb' },
        suggestedUtilities: [
          {
            workspaceId: 'design',
            groupId: 'design-color',
            utilityId: 'design-color-converter',
            name: 'Color Converter',
            description: 'Convert RGB values to HEX, HSL, and CMYK.',
            isPrimary: true,
          },
          {
            workspaceId: 'design',
            groupId: 'design-color',
            utilityId: 'design-contrast-checker',
            name: 'Contrast Checker',
            description: 'Check WCAG contrast with text backgrounds.',
          },
        ],
        rawText: text,
      };
    }

    // HSL or HSLA: hsl(200, 100%, 50%)
    const hslMatch = text.match(/^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*([\d.]+%?))?\s*\)$/i);
    if (hslMatch) {
      return {
        formatId: 'color',
        formatTitle: `HSL Color (${text})`,
        badgeText: 'COLOR',
        confidence: 0.95,
        previewSnippet: text,
        extractedMeta: { color: text, type: 'hsl' },
        suggestedUtilities: [
          {
            workspaceId: 'design',
            groupId: 'design-color',
            utilityId: 'design-color-converter',
            name: 'Color Converter',
            description: 'Convert HSL values to HEX and RGB.',
            isPrimary: true,
          },
        ],
        rawText: text,
      };
    }

    return null;
  }

  // ─── 5. TIMESTAMP DETECTION ───
  private static detectTimestamp(text: string): SmartPasteDetection | null {
    // Numeric epoch timestamp: 10 digits (seconds) or 13 digits (ms)
    if (/^\d{10}$/.test(text)) {
      const sec = parseInt(text, 10);
      const date = new Date(sec * 1000);
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1990 && date.getFullYear() <= 2100) {
        return {
          formatId: 'timestamp',
          formatTitle: `Epoch Seconds Timestamp (${text})`,
          badgeText: 'TIMESTAMP',
          confidence: 0.94,
          previewSnippet: `Equivalent: ${date.toUTCString()}`,
          extractedMeta: { epochSec: sec, iso: date.toISOString() },
          suggestedUtilities: [
            {
              workspaceId: 'developer',
              groupId: 'dev-generators',
              utilityId: 'gen-timestamp',
              name: 'Timestamp Utility',
              description: 'Convert and inspect epoch timestamps and timezones.',
              isPrimary: true,
            },
            {
              workspaceId: 'calculator',
              groupId: 'calc-date-time',
              utilityId: 'calc-date-diff',
              name: 'Date Difference',
              description: 'Calculate days and duration elapsed since or until this date.',
            },
          ],
          rawText: text,
        };
      }
    }

    if (/^\d{13}$/.test(text)) {
      const ms = parseInt(text, 10);
      const date = new Date(ms);
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1990 && date.getFullYear() <= 2100) {
        return {
          formatId: 'timestamp',
          formatTitle: `Epoch Milliseconds Timestamp (${text})`,
          badgeText: 'TIMESTAMP',
          confidence: 0.95,
          previewSnippet: `Equivalent: ${date.toUTCString()}`,
          extractedMeta: { epochMs: ms, iso: date.toISOString() },
          suggestedUtilities: [
            {
              workspaceId: 'developer',
              groupId: 'dev-generators',
              utilityId: 'gen-timestamp',
              name: 'Timestamp Utility',
              description: 'Convert and inspect epoch timestamps and human date formats.',
              isPrimary: true,
            },
          ],
          rawText: text,
        };
      }
    }

    // ISO 8601 string: 2026-10-03T12:00:00Z
    if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/i.test(text)) {
      const date = new Date(text);
      if (!isNaN(date.getTime())) {
        return {
          formatId: 'timestamp',
          formatTitle: 'ISO 8601 Date String',
          badgeText: 'DATE',
          confidence: 0.96,
          previewSnippet: `Epoch: ${Math.floor(date.getTime() / 1000)}s • ${date.toUTCString()}`,
          extractedMeta: { dateStr: text, epoch: date.getTime() },
          suggestedUtilities: [
            {
              workspaceId: 'developer',
              groupId: 'dev-generators',
              utilityId: 'gen-timestamp',
              name: 'Timestamp Utility',
              description: 'Convert ISO date to Unix epoch timestamps.',
              isPrimary: true,
            },
            {
              workspaceId: 'calculator',
              groupId: 'calc-date-time',
              utilityId: 'calc-date-diff',
              name: 'Date Difference',
              description: 'Calculate duration elapsed between this date and now.',
            },
          ],
          rawText: text,
        };
      }
    }

    return null;
  }

  // ─── 6. URL DETECTION ───
  private static detectUrl(text: string): SmartPasteDetection | null {
    if (!text.startsWith('http://') && !text.startsWith('https://') && !text.startsWith('ftp://')) {
      return null;
    }

    try {
      const url = new URL(text);
      return {
        formatId: 'url',
        formatTitle: `Web URL (${url.hostname})`,
        badgeText: 'URL',
        confidence: 0.98,
        previewSnippet: text.length > 100 ? text.slice(0, 100) + '...' : text,
        extractedMeta: {
          protocol: url.protocol,
          hostname: url.hostname,
          pathname: url.pathname,
          search: url.search,
        },
        suggestedUtilities: [
          {
            workspaceId: 'developer',
            groupId: 'dev-web',
            utilityId: 'web-url-parser',
            name: 'URL Parser',
            description: 'Inspect URL anatomy, domain, paths, and query string parameters.',
            isPrimary: true,
          },
          {
            workspaceId: 'network',
            groupId: 'net-url-web',
            utilityId: 'net-curl-builder',
            name: 'cURL Builder',
            description: 'Construct terminal HTTP requests and headers for this endpoint.',
          },
          {
            workspaceId: 'developer',
            groupId: 'dev-encode',
            utilityId: 'dev-url',
            name: 'URL Encoding',
            description: 'Percent-encode or decode query parameters.',
          },
          {
            workspaceId: 'developer',
            groupId: 'dev-generators',
            utilityId: 'dev-qr-generator',
            name: 'QR Generator',
            description: 'Generate offline QR code for this URL.',
          },
        ],
        rawText: text,
      };
    } catch {
      return null;
    }
  }

  // ─── 7. CSV / TSV DETECTION ───
  private static detectCsv(text: string): SmartPasteDetection | null {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return null;

    // Check comma delimiter
    const commaCounts = lines.slice(0, 5).map((l) => (l.match(/,/g) || []).length);
    const hasCommas = commaCounts[0] >= 1 && commaCounts.every((c) => c === commaCounts[0]);

    // Check tab delimiter
    const tabCounts = lines.slice(0, 5).map((l) => (l.match(/\t/g) || []).length);
    const hasTabs = tabCounts[0] >= 1 && tabCounts.every((c) => c === tabCounts[0]);

    if (!hasCommas && !hasTabs) return null;

    const delimiter = hasTabs ? 'Tab-separated (TSV)' : 'Comma-separated (CSV)';
    const colCount = (hasTabs ? tabCounts[0] : commaCounts[0]) + 1;

    return {
      formatId: 'csv',
      formatTitle: `${delimiter} (${colCount} columns, ${lines.length} rows)`,
      badgeText: hasTabs ? 'TSV' : 'CSV',
      confidence: 0.92,
      previewSnippet: lines[0],
      extractedMeta: { delimiter: hasTabs ? '\t' : ',', rows: lines.length, cols: colCount },
      suggestedUtilities: [
        {
          workspaceId: 'data',
          groupId: 'data-tabular',
          utilityId: 'csv-viewer',
          name: 'CSV / TSV Table Viewer',
          description: 'Render interactive data table with column sorting and filtering.',
          isPrimary: true,
        },
        {
          workspaceId: 'data',
          groupId: 'data-tabular',
          utilityId: 'data-pivot-groupby',
          name: 'Pivot & GroupBy Engine',
          description: 'Aggregate and group data rows by category.',
        },
        {
          workspaceId: 'data',
          groupId: 'data-tabular',
          utilityId: 'data-sql-csv',
          name: 'SQL Query on CSV',
          description: 'Run SQL queries against this tabular dataset.',
        },
      ],
      rawText: text,
    };
  }

  // ─── 8. BASE64 DETECTION ───
  private static detectBase64(text: string): SmartPasteDetection | null {
    // Must be at least 16 chars to prevent normal short words from false-matching
    if (text.length < 16 || text.length % 4 !== 0) return null;
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(text)) return null;

    try {
      const decoded = atob(text);
      if (decoded.length === 0) return null;

      // Check if it's printable or binary
      const isAscii = /^[\x20-\x7E\r\n\t]*$/.test(decoded);

      return {
        formatId: 'base64',
        formatTitle: isAscii ? 'Base64 Encoded Text' : 'Base64 Encoded Binary Data',
        badgeText: 'BASE64',
        confidence: 0.88,
        previewSnippet: isAscii
          ? `Decodes to: ${decoded.slice(0, 80)}...`
          : `Binary buffer (${Math.round((text.length * 3) / 4)} bytes)`,
        extractedMeta: { byteLength: Math.round((text.length * 3) / 4), isAscii },
        suggestedUtilities: [
          {
            workspaceId: 'developer',
            groupId: 'dev-encode',
            utilityId: 'dev-base64',
            name: 'Base64 Decoder',
            description: 'Decode into original plain text or binary representation.',
            isPrimary: true,
          },
          {
            workspaceId: 'developer',
            groupId: 'dev-utilities',
            utilityId: 'sec-hash-hmac',
            name: 'Hash & HMAC',
            description: 'Calculate cryptographic digests of this base64 string.',
          },
        ],
        rawText: text,
      };
    } catch {
      return null;
    }
  }
}
