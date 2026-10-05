import React, { useState, useMemo, useEffect } from 'react';
import { ToolLayout } from '../../components/common/ToolLayout';
import { SplitEditor } from '../../components/common/SplitEditor';
import { TextEngine, CaseType } from '../../engines/text/text.engine';
import { DiffEngine, DiffChange } from '../../engines/diff/diff.engine';
import { DevEngine } from '../../engines/developer/dev.engine';
import { GitCompare, Filter, Hash, Table, Shuffle, FileText, CheckCircle2 } from 'lucide-react';
import { HistoryService } from '../../core/services/history.service';
import './TextWorkspaceView.css';

interface TextWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const TextWorkspaceView: React.FC<TextWorkspaceViewProps> = ({
  groupId,
  utilityId,
  toolName,
  toolDescription,
  onBackToUtilities,
  isFavorite,
  onToggleFavorite,
}) => {
  // Input & Output states
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeCaseOption, setActiveCaseOption] = useState<string>('case-upper');

  // Compare diff state
  const [compareLeft, setCompareLeft] = useState(
    'First line of original document.\nSecond line with some parameters.\nThird line unchanged.\nFourth line for testing.'
  );
  const [compareRight, setCompareRight] = useState(
    'First line of original document.\nSecond line with updated production parameters.\nThird line unchanged.\nFifth line newly appended.'
  );
  const [diffChanges, setDiffChanges] = useState<DiffChange[] | null>(null);

  // Specific tool parameters
  const [slugSep, setSlugSep] = useState<'-' | '_' | '.'>('-');
  const [slugMaxLen, setSlugMaxLen] = useState<number>(60);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [tableDelim, setTableDelim] = useState<string>(',');
  const [tableHasHeader, setTableHasHeader] = useState<boolean>(true);
  const [tableFormat, setTableFormat] = useState<'markdown' | 'ascii' | 'json'>('markdown');
  const [regexPattern, setRegexPattern] = useState<string>('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)');
  const [regexReplacement, setRegexReplacement] = useState<string>('$1@[HIDDEN]');
  const [regexFlags, setRegexFlags] = useState<string>('gm');
  const [regexMatches, setRegexMatches] = useState<number | null>(null);
  const [loremCount, setLoremCount] = useState<number>(3);
  const [loremUnit, setLoremUnit] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [freqCaseSensitive, setFreqCaseSensitive] = useState<boolean>(false);
  const [freqExcludeStop, setFreqExcludeStop] = useState<boolean>(true);
  const [entityFilter, setEntityFilter] = useState<'all' | 'emails' | 'urls' | 'phones' | 'ipAddresses' | 'dates' | 'hashtags'>('all');

  // Seed sample data according to current utility
  useEffect(() => {
    switch (utilityId) {
      case 'text-extract-entities':
        setInputText(
          'Contact engineering at dev-ops@toiloki.org or security team via sec-report@toiloki.dev.\n' +
          'Access dashboard at https://toiloki.dev/dashboard or documentation at http://docs.local.\n' +
          'Direct hotline: +1 (800) 555-0199 or office line (415) 888-2345.\n' +
          'Gateway addresses: 192.168.1.1 and 10.0.0.254.\n' +
          'Key milestones recorded on 2026-10-03 and 2026-12-31.\n' +
          'Tags: #privacy #offline #localfirst #zeroCloud'
        );
        break;
      case 'text-find-duplicate-paras':
        setInputText(
          'Toiloki runs 100% offline without telemetry or server tracking.\n\n' +
          'Second paragraph explaining local-first file processing pipelines.\n\n' +
          'Toiloki runs 100% offline without telemetry or server tracking.\n\n' +
          'All document parsing executes strictly in memory using WebAssembly and pure TypeScript.\n\n' +
          'Second paragraph explaining local-first file processing pipelines.'
        );
        break;
      case 'text-slugify':
        setInputText('Building High-Performance Local-First Desktop Suites with Zero Telemetry in 2026!');
        break;
      case 'text-natural-sort':
        setInputText('item1\nitem10\nitem2\nitem20\nitem3\nrelease-v1.2.0\nrelease-v1.10.0\nrelease-v1.2.1\nbeta-4\nbeta-12');
        break;
      case 'text-to-table':
        setInputText('Name,Role,Department,Status\nAlice Vance,Lead Architect,Core Engine,Active\nBob Miller,UI/UX Engineer,Design,Active\nCharlie King,Security Specialist,Privacy,Away\nDiana Ross,QA Lead,Verification,Active');
        break;
      case 'text-multi-file-regex':
        setInputText('Developer alert: contact alice@corp.internal or support@service.com for assistance. Backup: admin@corp.internal.');
        break;
      case 'text-word-frequency':
        setInputText(
          'Local suite architecture provides deterministic performance. ' +
          'The suite runs entirely offline. Deterministic code guarantees consistency across multiple operations. ' +
          'The local suite privacy guarantee protects sensitive data.'
        );
        break;
      case 'text-lorem-ipsum':
        setInputText('');
        break;
      default:
        if (!inputText) {
          setInputText(
            'The quick brown fox jumps over the lazy dog.\n\nToiloki provides offline local utilities with zero tracking.\nExtra whitespace and duplicate lines can be cleaned in milliseconds.'
          );
        }
        break;
    }
  }, [utilityId]);

  // Sync activeCaseOption or trigger transform when utilityId changes
  useEffect(() => {
    if (utilityId.startsWith('case-')) {
      setActiveCaseOption(utilityId);
      runTransform(utilityId);
    } else {
      runTransform(utilityId);
    }
  }, [
    utilityId,
    inputText,
    slugSep,
    slugMaxLen,
    sortDir,
    tableDelim,
    tableHasHeader,
    tableFormat,
    regexPattern,
    regexReplacement,
    regexFlags,
    loremCount,
    loremUnit,
    freqCaseSensitive,
    freqExcludeStop,
    entityFilter,
  ]);

  // Text analysis metrics
  const metrics = useMemo(() => {
    const res = TextEngine.analyzeText(inputText);
    return res.data || { words: 0, characters: 0, lines: 0, sentences: 0, readingTimeMin: 0 };
  }, [inputText]);

  const runTransform = (actionId: string) => {
    let result = '';

    if (actionId.startsWith('case-')) {
      const mode = actionId.replace('case-', '') as CaseType;
      const res = TextEngine.transformCase(inputText, mode);
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'clean-trim' || actionId === 'trim') {
      const res = TextEngine.cleanText(inputText, { removeExtraSpaces: true });
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'remove-spaces' || actionId === 'clean-spaces') {
      const res = TextEngine.cleanText(inputText, { removeExtraSpaces: true });
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'remove-blank-lines' || actionId === 'clean-blank') {
      const res = TextEngine.cleanText(inputText, { removeBlankLines: true });
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'strip-invisible' || actionId === 'invisible-chars') {
      const res = TextEngine.cleanText(inputText, { stripInvisibleChars: true });
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'line-endings') {
      const res = TextEngine.cleanText(inputText, { normalizeLineEndings: true });
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'sort-lines') {
      const res = TextEngine.sortAndDeduplicate(inputText, 'asc', false);
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'deduplicate-lines') {
      const res = TextEngine.sortAndDeduplicate(inputText, 'asc', true);
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'reverse-text') {
      const res = TextEngine.reverseText(inputText, 'characters');
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'text-extract-entities') {
      const res = TextEngine.extractEntities(inputText);
      if (res.success && res.data) {
        const d = res.data;
        if (entityFilter === 'all') {
          const lines: string[] = [];
          if (d.emails.length) lines.push(`═══ EMAILS (${d.emails.length}) ═══\n${d.emails.join('\n')}\n`);
          if (d.urls.length) lines.push(`═══ URLS (${d.urls.length}) ═══\n${d.urls.join('\n')}\n`);
          if (d.phones.length) lines.push(`═══ PHONE NUMBERS (${d.phones.length}) ═══\n${d.phones.join('\n')}\n`);
          if (d.ipAddresses.length) lines.push(`═══ IP ADDRESSES (${d.ipAddresses.length}) ═══\n${d.ipAddresses.join('\n')}\n`);
          if (d.dates.length) lines.push(`═══ DATES (${d.dates.length}) ═══\n${d.dates.join('\n')}\n`);
          if (d.hashtags.length) lines.push(`═══ HASHTAGS (${d.hashtags.length}) ═══\n${d.hashtags.join('\n')}\n`);
          if (d.numbers.length) lines.push(`═══ NUMBERS (${d.numbers.length}) ═══\n${d.numbers.join('\n')}`);
          result = lines.join('\n');
        } else {
          result = (d[entityFilter] || []).join('\n');
        }
      } else {
        result = res.error || 'No entities found';
      }
    } else if (actionId === 'text-find-duplicate-paras') {
      const res = TextEngine.findDuplicateParagraphs(inputText);
      if (res.success && res.data) {
        const { duplicates, total } = res.data;
        if (duplicates.length === 0) {
          result = `✓ No duplicate paragraphs found across all ${total} paragraphs analyzed.`;
        } else {
          result = `Found ${duplicates.length} duplicate paragraphs (Total paragraphs: ${total}):\n\n` +
            duplicates.map((d, i) => `[Duplicate #${i + 1} — Repeated ${d.count}x]:\n"${d.paragraph}"`).join('\n\n');
        }
      } else {
        result = res.error || 'Error finding duplicate paragraphs';
      }
    } else if (actionId === 'text-slugify') {
      const res = TextEngine.slugify(inputText, slugSep, slugMaxLen);
      if (res.success && res.data) result = res.data;
      else result = res.error || '';
    } else if (actionId === 'text-natural-sort') {
      const lines = inputText.split(/\r?\n/).filter(Boolean);
      const res = TextEngine.naturalSort(lines, sortDir);
      if (res.success && res.data) result = res.data.join('\n');
      else result = res.error || '';
    } else if (actionId === 'text-to-table') {
      const res = TextEngine.textToTable(inputText, tableDelim, tableHasHeader);
      if (res.success && res.data) {
        const { headers, rows } = res.data;
        if (tableFormat === 'markdown') {
          const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] || '').length), 3));
          const headLine = '| ' + headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ') + ' |';
          const sepLine = '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |';
          const rowLines = rows.map(r => '| ' + headers.map((_, i) => (r[i] || '').padEnd(colWidths[i])).join(' | ') + ' |');
          result = [headLine, sepLine, ...rowLines].join('\n');
        } else if (tableFormat === 'json') {
          const jsonRows = rows.map(r => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = r[i] || ''; });
            return obj;
          });
          result = JSON.stringify(jsonRows, null, 2);
        } else {
          // ASCII Grid
          const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] || '').length)));
          const border = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
          const head = '| ' + headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ') + ' |';
          const body = rows.map(r => '| ' + headers.map((_, i) => (r[i] || '').padEnd(colWidths[i])).join(' | ') + ' |').join('\n');
          result = [border, head, border, body, border].join('\n');
        }
      } else {
        result = res.error || 'Failed to parse table';
      }
    } else if (actionId === 'text-multi-file-regex') {
      const res = TextEngine.regexReplace(inputText, regexPattern, regexReplacement, regexFlags);
      if (res.success && res.data) {
        result = res.data.result;
        setRegexMatches(res.data.matchCount);
      } else {
        result = res.error || 'Invalid regular expression';
        setRegexMatches(0);
      }
    } else if (actionId === 'text-word-frequency') {
      const res = TextEngine.wordFrequency(inputText, {
        caseSensitive: freqCaseSensitive,
        excludeStopWords: freqExcludeStop,
      });
      if (res.success && res.data) {
        const { words, totalWords, uniqueWords, avgWordLength } = res.data;
        const summary = `Total Words: ${totalWords} | Unique Words: ${uniqueWords} | Avg Length: ${avgWordLength} chars\n\n`;
        const col1 = 'Rank'.padEnd(6);
        const col2 = 'Word'.padEnd(20);
        const col3 = 'Count'.padEnd(10);
        const col4 = 'Percentage';
        const header = `${col1}${col2}${col3}${col4}\n` + '─'.repeat(48) + '\n';
        const rows = words.map((w, i) =>
          `#${(i + 1).toString().padEnd(5)}${w.word.padEnd(20)}${w.count.toString().padEnd(10)}${w.percent.toFixed(2)}%`
        ).join('\n');
        result = summary + header + rows;
      } else {
        result = res.error || 'Could not calculate frequency';
      }
    } else if (actionId === 'text-lorem-ipsum') {
      const res = TextEngine.generateLoremIpsum(loremCount, loremUnit);
      if (res.success && res.data) result = res.data;
      else result = res.error || '';
    } else if (actionId === 'text-statistics' || actionId === 'reading-time') {
      const res = TextEngine.analyzeText(inputText);
      if (res.success && res.data) {
        const d = res.data;
        result = `Word Count: ${d.words}\nCharacter Count: ${d.characters}\nCharacters (No Spaces): ${d.charactersNoSpaces}\nLine Count: ${d.lines}\nSentence Count: ${d.sentences}\nParagraph Count: ${d.paragraphs}\nEstimated Reading Time: ${d.readingTimeMin} min`;
      }
    } else if (actionId === 'dev-base64') {
      const res = DevEngine.encodeDecode(inputText, 'base64-encode');
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'dev-url') {
      const res = DevEngine.encodeDecode(inputText, 'url-encode');
      if (res.success && res.data) result = res.data;
    } else if (actionId === 'html-encoding') {
      result = inputText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    } else if (actionId === 'unicode-tool') {
      result = Array.from(inputText)
        .map((ch) => `${ch}  ->  U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`)
        .join('\n');
    } else {
      result = inputText;
    }

    setOutputText(result);

    HistoryService.record({
      toolName,
      workspaceId: 'text',
      groupId,
      utilityId: actionId || utilityId,
      input: `${inputText.length} chars`,
      output: `Completed ${actionId}`,
      status: 'completed',
    });
  };

  const handleSwap = () => {
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setDiffChanges(null);
  };

  const handleCopyOutput = async () => {
    const textToCopy = outputText || inputText;
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveOutput = () => {
    const textToSave = outputText || inputText;
    if (!textToSave) return;
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toiloki_${utilityId}_output.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunDiff = () => {
    const res = DiffEngine.compareLines(compareLeft, compareRight);
    if (res.success && res.data) {
      setDiffChanges(res.data.changes);
    }
  };

  const caseOptions = [
    { id: 'case-upper', label: 'UPPERCASE' },
    { id: 'case-lower', label: 'lowercase' },
    { id: 'case-title', label: 'Title Case' },
    { id: 'case-sentence', label: 'Sentence case' },
    { id: 'case-camel', label: 'camelCase' },
    { id: 'case-snake', label: 'snake_case' },
    { id: 'case-kebab', label: 'kebab-case' },
  ];

  const cleanOptions = [
    { id: 'clean-trim', label: 'Trim Lines' },
    { id: 'remove-spaces', label: 'Remove Extra Spaces' },
    { id: 'remove-blank-lines', label: 'Remove Blank Lines' },
    { id: 'strip-invisible', label: 'Strip Invisible Chars' },
    { id: 'line-endings', label: 'Normalize Line-Endings' },
  ];

  const breadcrumbs = [
    { label: 'Home', onClick: onBackToUtilities },
    { label: 'Text', onClick: onBackToUtilities },
    { label: toolName },
  ];

  // Render contextual options bar above SplitEditor
  const renderToolbarOptions = () => {
    if (utilityId === 'case-conversion' || utilityId.startsWith('case-')) {
      return (
        <div className="segmented-chip-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {caseOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`segmented-chip-btn ${activeCaseOption === opt.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCaseOption(opt.id);
                runTransform(opt.id);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    if (
      utilityId === 'remove-spaces' ||
      utilityId === 'remove-blank-lines' ||
      utilityId === 'invisible-chars' ||
      utilityId === 'line-endings'
    ) {
      return (
        <div className="segmented-chip-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {cleanOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`segmented-chip-btn ${utilityId === opt.id ? 'active' : ''}`}
              onClick={() => runTransform(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    if (utilityId === 'text-extract-entities') {
      const filters: Array<{ id: typeof entityFilter; label: string }> = [
        { id: 'all', label: 'All Entities' },
        { id: 'emails', label: 'Emails' },
        { id: 'urls', label: 'URLs' },
        { id: 'phones', label: 'Phones' },
        { id: 'ipAddresses', label: 'IPs' },
        { id: 'dates', label: 'Dates' },
        { id: 'hashtags', label: 'Hashtags' },
      ];
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Filter:</span>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`segmented-chip-btn ${entityFilter === f.id ? 'active' : ''}`}
              onClick={() => setEntityFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      );
    }

    if (utilityId === 'text-slugify') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Separator:</span>
            {(['-', '_', '.'] as const).map((sep) => (
              <button
                key={sep}
                type="button"
                className={`segmented-chip-btn ${slugSep === sep ? 'active' : ''}`}
                onClick={() => setSlugSep(sep)}
              >
                `{sep}`
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Chars:</span>
            <input
              type="number"
              value={slugMaxLen}
              onChange={(e) => setSlugMaxLen(Math.max(10, parseInt(e.target.value) || 60))}
              style={{
                width: '60px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            />
          </div>
        </div>
      );
    }

    if (utilityId === 'text-natural-sort' || utilityId === 'sort-lines') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Order:</span>
          <button
            type="button"
            className={`segmented-chip-btn ${sortDir === 'asc' ? 'active' : ''}`}
            onClick={() => setSortDir('asc')}
          >
            Ascending (A → Z, 1 → 10)
          </button>
          <button
            type="button"
            className={`segmented-chip-btn ${sortDir === 'desc' ? 'active' : ''}`}
            onClick={() => setSortDir('desc')}
          >
            Descending (Z → A, 10 → 1)
          </button>
        </div>
      );
    }

    if (utilityId === 'text-to-table') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Delim:</span>
            {[
              { id: ',', label: 'Comma' },
              { id: '\t', label: 'Tab' },
              { id: ';', label: 'Semicolon' },
              { id: '|', label: 'Pipe' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                className={`segmented-chip-btn ${tableDelim === d.id ? 'active' : ''}`}
                onClick={() => setTableDelim(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Format:</span>
            {(['markdown', 'ascii', 'json'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                className={`segmented-chip-btn ${tableFormat === fmt ? 'active' : ''}`}
                onClick={() => setTableFormat(fmt)}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={tableHasHeader}
              onChange={(e) => setTableHasHeader(e.target.checked)}
            />
            Header Row
          </label>
        </div>
      );
    }

    if (utilityId === 'text-multi-file-regex') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 200px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pattern:</span>
            <input
              type="text"
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              placeholder="e.g. \b\d{4}\b"
              style={{
                flex: 1,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 200px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Replace:</span>
            <input
              type="text"
              value={regexReplacement}
              onChange={(e) => setRegexReplacement(e.target.value)}
              placeholder="replacement string"
              style={{
                flex: 1,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Flags:</span>
            <input
              type="text"
              value={regexFlags}
              onChange={(e) => setRegexFlags(e.target.value)}
              style={{
                width: '50px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
            />
          </div>
          {regexMatches !== null && (
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
              {regexMatches} match{regexMatches === 1 ? '' : 'es'}
            </span>
          )}
        </div>
      );
    }

    if (utilityId === 'text-word-frequency') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={freqExcludeStop}
              onChange={(e) => setFreqExcludeStop(e.target.checked)}
            />
            Exclude Common Stop Words
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={freqCaseSensitive}
              onChange={(e) => setFreqCaseSensitive(e.target.checked)}
            />
            Case Sensitive
          </label>
        </div>
      );
    }

    if (utilityId === 'text-lorem-ipsum') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Count:</span>
            <input
              type="number"
              min={1}
              max={50}
              value={loremCount}
              onChange={(e) => setLoremCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{
                width: '60px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(['paragraphs', 'sentences', 'words'] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                className={`segmented-chip-btn ${loremUnit === unit ? 'active' : ''}`}
                onClick={() => setLoremUnit(unit)}
              >
                {unit.charAt(0).toUpperCase() + unit.slice(1)}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <ToolLayout
      breadcrumbItems={breadcrumbs}
      title={toolName}
      description={toolDescription}
      badgeGradient="var(--badge-text)"
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onReset={handleClear}
    >
      <div className="text-tool-body">
        {utilityId === 'text-diff' ? (
          /* Compare Diff Tool */
          <div className="text-compare-container">
            <div className="compare-editors-grid">
              <div className="compare-pane">
                <span className="pane-header-label">Original Text (A)</span>
                <textarea
                  className="compare-textarea"
                  value={compareLeft}
                  onChange={(e) => setCompareLeft(e.target.value)}
                  placeholder="Paste original text here..."
                  spellCheck={false}
                />
              </div>
              <div className="compare-pane">
                <span className="pane-header-label">Modified Text (B)</span>
                <textarea
                  className="compare-textarea"
                  value={compareRight}
                  onChange={(e) => setCompareRight(e.target.value)}
                  placeholder="Paste modified text here..."
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="compare-actions-bar">
              <button
                type="button"
                className="toiloki-btn toiloki-btn-primary"
                onClick={handleRunDiff}
              >
                <GitCompare size={15} />
                <span>Compare Side-by-Side</span>
              </button>
            </div>

            {diffChanges && (
              <div className="diff-results-card">
                <div className="diff-card-header">
                  <h4 className="diff-card-title">Diff Comparison Output</h4>
                  <div className="diff-legend">
                    <span className="legend-chip added">+ Added</span>
                    <span className="legend-chip removed">− Removed</span>
                    <span className="legend-chip unchanged">Unchanged</span>
                  </div>
                </div>
                <div className="diff-pre-box">
                  {diffChanges.map((c, i) => (
                    <div
                      key={i}
                      className={`diff-line-row ${
                        c.added ? 'added' : c.removed ? 'removed' : 'unchanged'
                      }`}
                    >
                      <span className="diff-gutter-symbol">
                        {c.added ? '+' : c.removed ? '−' : ' '}
                      </span>
                      <span className="diff-line-content">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TEMPLATE B: Shared Split Editor */
          <SplitEditor
            toolbarOptions={renderToolbarOptions()}
            primaryAction={{
              label: 'Apply',
              onClick: () => runTransform(utilityId),
            }}
            onClear={handleClear}
            onCopy={handleCopyOutput}
            onSwap={handleSwap}
            onSave={handleSaveOutput}
            copied={copied}
            inputValue={inputText}
            onInputChange={setInputText}
            inputLabel={utilityId === 'text-lorem-ipsum' ? 'Configuration' : 'Input'}
            inputMeta={`${inputText.length} chars`}
            outputValue={outputText}
            onOutputChange={setOutputText}
            outputLabel="Output"
            outputMeta={`${outputText.length} chars`}
            stats={`${metrics.words} words • ${metrics.characters} chars • ${metrics.lines} lines`}
          />
        )}
      </div>
    </ToolLayout>
  );
};
