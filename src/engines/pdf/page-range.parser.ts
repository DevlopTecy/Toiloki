/**
 * Page Range Parser for PDF documents
 * Grammar:
 * - comma-separated tokens: N, N-M, N-end, end
 * - whitespace ignored
 * - blank or "All" = every page (1 to pageCount)
 * - order preserved as typed (e.g. "5, 1-2" gives [5, 1, 2])
 * - reverse ranges supported (e.g. "3-1" gives [3, 2, 1])
 * - repeats allowed with note ("Page 3 is included twice")
 * - out-of-range or invalid tokens return valid=false and clear error message
 */

import { plural } from '../../core/utils/plural';

export interface PageRangeParseResult {
  valid: boolean;
  pageIndices1Based: number[];
  pageIndices0Based: number[];
  error?: string;
  notes: string[];
  hasRepeats: boolean;
  totalSelected: number;
}

export function parsePageRange(rangeStr: string, totalPages: number): PageRangeParseResult {
  const notes: string[] = [];
  const clean = rangeStr.trim();

  // If no pages in document or invalid total
  if (totalPages <= 0) {
    return {
      valid: false,
      pageIndices1Based: [],
      pageIndices0Based: [],
      error: 'Document contains 0 pages.',
      notes: [],
      hasRepeats: false,
      totalSelected: 0,
    };
  }

  // Blank or "All" -> include all pages 1 to totalPages
  if (!clean || clean.toLowerCase() === 'all') {
    const all1 = Array.from({ length: totalPages }, (_, i) => i + 1);
    const all0 = Array.from({ length: totalPages }, (_, i) => i);
    return {
      valid: true,
      pageIndices1Based: all1,
      pageIndices0Based: all0,
      notes: [],
      hasRepeats: false,
      totalSelected: totalPages,
    };
  }

  const tokens = clean.split(',');
  const result1Based: number[] = [];

  for (let rawToken of tokens) {
    const token = rawToken.trim();
    if (!token) continue; // skip trailing or extra commas

    // 1. Single page: "end"
    if (token.toLowerCase() === 'end') {
      result1Based.push(totalPages);
      continue;
    }

    // 2. Single page number: e.g. "5"
    if (/^\d+$/.test(token)) {
      const pageNum = parseInt(token, 10);
      if (pageNum < 1 || pageNum > totalPages) {
        return {
          valid: false,
          pageIndices1Based: [],
          pageIndices0Based: [],
          error: `Page ${pageNum} is out of range. This file has ${totalPages} ${plural(totalPages, 'page')}.`,
          notes: [],
          hasRepeats: false,
          totalSelected: 0,
        };
      }
      result1Based.push(pageNum);
      continue;
    }

    // 3. Range: e.g. "1-3", "5-2", "8-end"
    const rangeMatch = token.match(/^(\d+)\s*-\s*(end|\d+)$/i);
    if (rangeMatch) {
      const startNum = parseInt(rangeMatch[1], 10);
      const endPart = rangeMatch[2].toLowerCase();
      const endNum = endPart === 'end' ? totalPages : parseInt(endPart, 10);

      if (startNum < 1 || startNum > totalPages) {
        return {
          valid: false,
          pageIndices1Based: [],
          pageIndices0Based: [],
          error: `Page ${startNum} is out of range. This file has ${totalPages} ${plural(totalPages, 'page')}.`,
          notes: [],
          hasRepeats: false,
          totalSelected: 0,
        };
      }

      if (endNum < 1 || endNum > totalPages) {
        return {
          valid: false,
          pageIndices1Based: [],
          pageIndices0Based: [],
          error: `Page ${endNum} is out of range. This file has ${totalPages} ${plural(totalPages, 'page')}.`,
          notes: [],
          hasRepeats: false,
          totalSelected: 0,
        };
      }

      if (startNum <= endNum) {
        for (let p = startNum; p <= endNum; p++) {
          result1Based.push(p);
        }
      } else {
        for (let p = startNum; p >= endNum; p--) {
          result1Based.push(p);
        }
      }
      continue;
    }

    // 4. Invalid token format
    return {
      valid: false,
      pageIndices1Based: [],
      pageIndices0Based: [],
      error: `Invalid page token "${token}". Use numbers or ranges like 1-3, 5, 8-end.`,
      notes: [],
      hasRepeats: false,
      totalSelected: 0,
    };
  }

  if (result1Based.length === 0) {
    return {
      valid: false,
      pageIndices1Based: [],
      pageIndices0Based: [],
      error: 'No pages selected.',
      notes: [],
      hasRepeats: false,
      totalSelected: 0,
    };
  }

  // Check for duplicates
  const counts: Record<number, number> = {};
  for (const p of result1Based) {
    counts[p] = (counts[p] || 0) + 1;
  }

  let hasRepeats = false;
  for (const [p, c] of Object.entries(counts)) {
    if (c > 1) {
      hasRepeats = true;
      notes.push(`Page ${p} is included ${c === 2 ? 'twice' : `${c} times`}`);
    }
  }

  const result0Based = result1Based.map((p) => p - 1);

  return {
    valid: true,
    pageIndices1Based: result1Based,
    pageIndices0Based: result0Based,
    notes,
    hasRepeats,
    totalSelected: result1Based.length,
  };
}
