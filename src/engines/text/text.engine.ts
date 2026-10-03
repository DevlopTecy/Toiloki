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

  /**
   * Extract entities (emails, URLs, numbers, phones, IPs) from text
   */
  static extractEntities(text: string): EngineResult<{
    emails: string[]; urls: string[]; numbers: string[];
    phones: string[]; ipAddresses: string[]; hashtags: string[]; dates: string[];
  }> {
    const start = performance.now();
    try {
      if (!text.trim()) throw new Error('Input text is required');
      const emails = [...new Set((text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []))];
      const urls = [...new Set((text.match(/https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/g) || []))];
      const numbers = [...new Set((text.match(/-?\d+(?:\.\d+)?/g) || []))];
      const phones = [...new Set((text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || []))];
      const ipAddresses = [...new Set((text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []).filter(ip => ip.split('.').every(oct => parseInt(oct) <= 255)))];
      const hashtags = [...new Set((text.match(/#\w+/g) || []))];
      const dates = [...new Set((text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b/g) || []))];
      return { success: true, data: { emails, urls, numbers, phones, ipAddresses, hashtags, dates }, elapsedMs: Math.round(performance.now() - start) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 };
    }
  }

  /**
   * Count word frequency
   */
  static wordFrequency(text: string, opts: { caseSensitive?: boolean; minLength?: number; excludeStopWords?: boolean } = {}): EngineResult<{
    words: Array<{ word: string; count: number; percent: number }>; totalWords: number; uniqueWords: number; avgWordLength: number;
  }> {
    const start = performance.now();
    try {
      if (!text.trim()) throw new Error('Input text is required');
      const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','have','has','had','do','does','did','this','that','it','i','you','he','she','we','they']);
      const minLen = opts.minLength ?? 1;
      const rawWords = text.match(/\b[a-zA-Z][a-zA-Z'-]*[a-zA-Z]\b|\b[a-zA-Z]\b/g) || [];
      const processed = rawWords.map(w => opts.caseSensitive ? w : w.toLowerCase()).filter(w => w.length >= minLen).filter(w => !opts.excludeStopWords || !stopWords.has(w.toLowerCase()));
      const freq = new Map<string, number>();
      let totalLen = 0;
      for (const w of processed) { freq.set(w, (freq.get(w) || 0) + 1); totalLen += w.length; }
      const total = processed.length;
      const words = [...freq.entries()].sort((a,b)=>b[1]-a[1]).map(([word,count])=>({ word, count, percent: Math.round(count/total*10000)/100 }));
      return { success: true, data: { words, totalWords: total, uniqueWords: freq.size, avgWordLength: total>0?Math.round(totalLen/total*10)/10:0 }, elapsedMs: Math.round(performance.now()-start) };
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 }; }
  }

  /**
   * Convert text to URL slug
   */
  static slugify(text: string, sep: '-'|'_'|'.' = '-', maxLength?: number): EngineResult<string> {
    const start = performance.now();
    try {
      if (!text.trim()) throw new Error('Input text is required');
      const accentMap: Record<string,string> = {'á':'a','à':'a','ä':'a','â':'a','ã':'a','å':'a','æ':'ae','é':'e','è':'e','ë':'e','ê':'e','í':'i','ì':'i','ï':'i','î':'i','ó':'o','ò':'o','ö':'o','ô':'o','õ':'o','ø':'o','ú':'u','ù':'u','ü':'u','û':'u','ñ':'n','ç':'c','ß':'ss'};
      let result = text.trim().replace(/[áàäâãåæéèëêíìïîóòöôõøúùüûñçß]/gi, ch => accentMap[ch.toLowerCase()]??ch).toLowerCase().replace(/[^a-z0-9]/g, sep).replace(new RegExp(`\\${sep}+`,'g'),sep).replace(new RegExp(`^\\${sep}|\\${sep}$`,'g'),'');
      if (maxLength && result.length > maxLength) result = result.slice(0,maxLength).replace(new RegExp(`\\${sep}$`),'');
      return { success: true, data: result, elapsedMs: Math.round(performance.now()-start) };
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 }; }
  }

  /**
   * Generate Lorem Ipsum placeholder text
   */
  static generateLoremIpsum(count: number, unit: 'words'|'sentences'|'paragraphs' = 'paragraphs'): EngineResult<string> {
    const start = performance.now();
    try {
      if (count <= 0 || count > 100) throw new Error('Count must be 1–100');
      const pool = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','labore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','commodo','consequat','duis','aute','irure','reprehenderit','voluptate','velit','esse','cillum','dolore','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','culpa','officia','deserunt','mollit','anim','laborum'];
      const rw = () => pool[Math.floor(Math.random()*pool.length)];
      const ws = (n:number) => Array.from({length:n},rw).join(' ');
      const sent = () => { const s = ws(8+Math.floor(Math.random()*10)); return s.charAt(0).toUpperCase()+s.slice(1)+'.'; };
      const para = () => Array.from({length:3+Math.floor(Math.random()*4)},sent).join(' ');
      const result = unit==='words' ? ws(count) : unit==='sentences' ? Array.from({length:count},sent).join(' ') : Array.from({length:count},para).join('\n\n');
      return { success: true, data: result, elapsedMs: Math.round(performance.now()-start) };
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 }; }
  }

  /**
   * Natural sort lines (handles embedded numbers)
   */
  static naturalSort(lines: string[], direction: 'asc'|'desc' = 'asc'): EngineResult<string[]> {
    const start = performance.now();
    try {
      if (!lines.length) throw new Error('Input is required');
      const coll = new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
      const sorted = [...lines].sort((a,b)=>direction==='asc'?coll.compare(a,b):-coll.compare(a,b));
      return { success: true, data: sorted, elapsedMs: Math.round(performance.now()-start) };
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 }; }
  }

  /**
   * Find duplicate paragraphs
   */
  static findDuplicateParagraphs(text: string): EngineResult<{ duplicates: Array<{paragraph:string;count:number}>; total: number }> {
    const start = performance.now();
    try {
      if (!text.trim()) throw new Error('Input text is required');
      const paras = text.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean);
      const freq = new Map<string,number>();
      for (const p of paras) { const k=p.toLowerCase().replace(/\s+/g,' '); freq.set(k,(freq.get(k)||0)+1); }
      const duplicates = [...freq.entries()].filter(([,c])=>c>1).sort((a,b)=>b[1]-a[1]).map(([paragraph,count])=>({paragraph,count}));
      return { success: true, data: { duplicates, total: paras.length }, elapsedMs: Math.round(performance.now()-start) };
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 }; }
  }

  /**
   * Convert delimited text to structured table
   */
  static textToTable(text: string, delimiter: string = ',', hasHeader: boolean = true): EngineResult<{ headers:string[]; rows:string[][]; rowCount:number }> {
    const start = performance.now();
    try {
      if (!text.trim()) throw new Error('Input text is required');
      const lines = text.trim().split('\n').filter(Boolean);
      const allRows = lines.map(l => l.split(delimiter).map(c=>c.trim()));
      const maxCols = Math.max(...allRows.map(r=>r.length));
      const padded = allRows.map(r => { while(r.length<maxCols) r.push(''); return r; });
      const headers = hasHeader && padded.length>0 ? padded[0] : Array.from({length:maxCols},(_,i)=>`Col ${i+1}`);
      const rows = hasHeader ? padded.slice(1) : padded;
      return { success: true, data: { headers, rows, rowCount: rows.length }, elapsedMs: Math.round(performance.now()-start) };
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 }; }
  }

  /**
   * Regex find and replace across text
   */
  static regexReplace(text: string, pattern: string, replacement: string, flags: string = 'gm'): EngineResult<{ result:string; matchCount:number }> {
    const start = performance.now();
    try {
      if (!pattern) throw new Error('Pattern is required');
      const regex = new RegExp(pattern, flags);
      let matchCount = 0;
      const result = text.replace(regex, m => { matchCount++; return replacement; });
      return { success: true, data: { result, matchCount }, elapsedMs: Math.round(performance.now()-start) };
    } catch (err) { return { success: false, error: err instanceof Error ? err.message : String(err), elapsedMs: 0 }; }
  }
}
