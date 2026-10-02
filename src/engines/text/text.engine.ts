import { EngineResult } from '../../core/types/engine';

export type CaseType =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'kebab'
  | 'snake';

export class TextEngine {
  /**
   * Transform text case
   */
  static transformCase(text: string, caseType: CaseType): EngineResult<string> {
    const start = performance.now();
    let result = '';

    switch (caseType) {
      case 'upper':
        result = text.toUpperCase();
        break;
      case 'lower':
        result = text.toLowerCase();
        break;
      case 'title':
        result = text.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );
        break;
      case 'sentence':
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;
      case 'camel':
        result = text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr) => chr.toUpperCase())
          .replace(/^[A-Z]/, (c) => c.toLowerCase());
        break;
      case 'kebab':
        result = text
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, '-');
        break;
      case 'snake':
        result = text
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, '_');
        break;
    }

    return {
      success: true,
      data: result,
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  /**
   * Clean spaces, blank lines, and line endings
   */
  static cleanText(
    text: string,
    options: {
      removeExtraSpaces?: boolean;
      removeBlankLines?: boolean;
      normalizeLineEndings?: boolean;
      stripInvisibleChars?: boolean;
    }
  ): EngineResult<string> {
    const start = performance.now();
    let out = text;

    if (options.normalizeLineEndings) {
      out = out.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    if (options.stripInvisibleChars) {
      // Remove zero-width spaces and control characters (except \n, \t)
      out = out.replace(/[\u200B-\u200D\uFEFF]/g, '');
    }

    if (options.removeExtraSpaces) {
      out = out
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n');
    }

    if (options.removeBlankLines) {
      out = out
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .join('\n');
    }

    return {
      success: true,
      data: out,
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  /**
   * Sort lines and deduplicate
   */
  static sortAndDeduplicate(
    text: string,
    sortDirection: 'asc' | 'desc',
    deduplicate = false
  ): EngineResult<string> {
    const start = performance.now();
    let lines = text.split(/\r?\n/);

    if (deduplicate) {
      lines = Array.from(new Set(lines));
    }

    lines.sort((a, b) => {
      const cmp = a.localeCompare(b);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return {
      success: true,
      data: lines.join('\n'),
      metadata: { totalLines: lines.length },
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  /**
   * Calculate text statistics
   */
  static analyzeText(text: string): EngineResult<{
    words: number;
    characters: number;
    charactersNoSpaces: number;
    lines: number;
    sentences: number;
    paragraphs: number;
    readingTimeMin: number;
  }> {
    const start = performance.now();
    const trimmed = text.trim();
    const words = trimmed ? (trimmed.match(/\S+/g) || []).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const lines = text ? text.split(/\r?\n/).length : 0;
    const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed]).length : 0;
    const paragraphs = trimmed ? text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;
    const readingTimeMin = parseFloat((words / 200).toFixed(1));

    return {
      success: true,
      data: {
        words,
        characters,
        charactersNoSpaces,
        lines,
        sentences,
        paragraphs,
        readingTimeMin,
      },
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  /**
   * Reverse text by characters, words, or lines
   */
  static reverseText(text: string, mode: 'characters' | 'lines' | 'words' = 'characters'): EngineResult<string> {
    const start = performance.now();
    let result = '';

    if (mode === 'characters') {
      result = Array.from(text).reverse().join('');
    } else if (mode === 'lines') {
      result = text.split(/\r?\n/).reverse().join('\n');
    } else if (mode === 'words') {
      result = text
        .split('\n')
        .map((line) => line.split(/\s+/).reverse().join(' '))
        .join('\n');
    }

    return {
      success: true,
      data: result,
      elapsedMs: Math.round(performance.now() - start),
    };
  }
}
