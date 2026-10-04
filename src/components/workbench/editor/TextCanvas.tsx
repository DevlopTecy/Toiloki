import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  GitCompare,
  BarChart2,
  Search,
  WrapText,
  Type,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  AtSign,
  Globe,
  Phone,
  Calendar,
  Hash,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';
import { DiffEngine, DiffChange } from '../../../engines/diff/diff.engine';
import { TextEngine } from '../../../engines/text/text.engine';
import './TextCanvas.css';

export type TextViewMode = 'editor' | 'diff' | 'analysis';

export interface TextCanvasProps {
  text: string;
  onTextChange: (newText: string) => void;
  originalText?: string;
  viewMode: TextViewMode;
  onViewModeChange: (mode: TextViewMode) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  wordWrap?: boolean;
  onWordWrapChange?: (wrap: boolean) => void;
  onLoadSample?: () => void;
}

export const TextCanvas: React.FC<TextCanvasProps> = ({
  text,
  onTextChange,
  originalText = '',
  viewMode,
  onViewModeChange,
  fontSize = 13,
  onFontSizeChange,
  wordWrap = true,
  onWordWrapChange,
  onLoadSample,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [matchCase, setMatchCase] = useState<boolean>(false);
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [replaceNotice, setReplaceNotice] = useState<string | null>(null);

  // Selection / Cursor position
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number; selectedChars: number }>({
    line: 1,
    col: 1,
    selectedChars: 0,
  });

  // Copy notice
  const [copied, setCopied] = useState<boolean>(false);

  // Calculate lines
  const lines = useMemo(() => {
    return text.split('\n');
  }, [text]);

  const lineCount = lines.length;

  // Real-time Text Metrics
  const metrics = useMemo(() => {
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s+/g, '').length;
    const words = text.trim() ? (text.trim().match(/\S+/g) || []).length : 0;
    const readingTimeMin = Math.max(1, Math.ceil(words / 200));
    const speakingTimeMin = Math.max(1, Math.ceil(words / 130));
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0).length;

    return {
      chars,
      charsNoSpaces,
      words,
      lines: lineCount,
      paragraphs,
      readingTimeMin,
      speakingTimeMin,
    };
  }, [text, lineCount]);

  // Diff calculation
  const diffData = useMemo(() => {
    if (viewMode !== 'diff') return null;
    const base = originalText || text;
    const res = DiffEngine.compareLines(base, text);
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  }, [viewMode, originalText, text]);

  // Analysis: Entities & Word Frequency
  const entities = useMemo(() => {
    if (viewMode !== 'analysis' || !text.trim()) return null;
    const res = TextEngine.extractEntities(text);
    return res.success && res.data ? res.data : null;
  }, [viewMode, text]);

  const wordFreq = useMemo<Array<{ word: string; count: number; percent: number }>>(() => {
    if (viewMode !== 'analysis' || !text.trim()) return [];
    const res = TextEngine.wordFrequency(text, { minLength: 3, excludeStopWords: true });
    return res.success && res.data?.words ? res.data.words.slice(0, 15) : [];
  }, [viewMode, text]);

  // Find & Replace match count
  const matchCount = useMemo(() => {
    if (!findQuery) return 0;
    try {
      const flags = matchCase ? 'g' : 'gi';
      const regex = useRegex
        ? new RegExp(findQuery, flags)
        : new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const matches = text.match(regex);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [findQuery, matchCase, useRegex, text]);

  // Replace operations
  const handleReplaceNext = () => {
    if (!findQuery) return;
    try {
      const flags = matchCase ? '' : 'i';
      const regex = useRegex
        ? new RegExp(findQuery, flags)
        : new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const newText = text.replace(regex, replaceQuery);
      onTextChange(newText);
      setReplaceNotice('Replaced 1 occurrence');
      setTimeout(() => setReplaceNotice(null), 1500);
    } catch (e: any) {
      setReplaceNotice(`Regex error: ${e.message}`);
    }
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    try {
      const flags = matchCase ? 'g' : 'gi';
      const regex = useRegex
        ? new RegExp(findQuery, flags)
        : new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const count = (text.match(regex) || []).length;
      const newText = text.replace(regex, replaceQuery);
      onTextChange(newText);
      setReplaceNotice(`Replaced ${count} occurrences`);
      setTimeout(() => setReplaceNotice(null), 1800);
    } catch (e: any) {
      setReplaceNotice(`Regex error: ${e.message}`);
    }
  };

  // Synchronize gutter scroll with textarea scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Cursor and Selection tracking
  const updateCursorPos = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const beforeText = text.slice(0, start);
    const lineNum = beforeText.split('\n').length;
    const lastNewline = beforeText.lastIndexOf('\n');
    const colNum = lastNewline === -1 ? start + 1 : start - lastNewline;
    setCursorPos({
      line: lineNum,
      col: colNum,
      selectedChars: Math.abs(end - start),
    });
  };

  // Handle Tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      if (e.shiftKey) {
        // Dedent 2 spaces if possible
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);
        if (selected) {
          const unindented = selected.replace(/^ {1,2}/gm, '');
          onTextChange(before + unindented + after);
        }
      } else {
        // Indent 2 spaces
        const before = text.substring(0, start);
        const after = text.substring(end);
        onTextChange(before + '  ' + after);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
          }
        }, 0);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowFindReplace((prev) => !prev);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="text-canvas-root">
      {/* Canvas Top Bar */}
      <div className="text-canvas-header">
        <div className="canvas-header-left">
          <div className="view-mode-tabs" role="tablist">
            <button
              className={`view-mode-tab ${viewMode === 'editor' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('editor')}
              role="tab"
              aria-selected={viewMode === 'editor'}
            >
              <FileText size={14} />
              <span>Editor</span>
            </button>
            <button
              className={`view-mode-tab ${viewMode === 'diff' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('diff')}
              role="tab"
              aria-selected={viewMode === 'diff'}
            >
              <GitCompare size={14} />
              <span>Diff Compare</span>
            </button>
            <button
              className={`view-mode-tab ${viewMode === 'analysis' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('analysis')}
              role="tab"
              aria-selected={viewMode === 'analysis'}
            >
              <BarChart2 size={14} />
              <span>Analysis & Entities</span>
            </button>
          </div>

          <div className="text-meta-badge">
            <span className="text-metrics-pill">
              {metrics.lines} lines • {metrics.words} words • {metrics.chars} chars
            </span>
          </div>
        </div>

        <div className="canvas-header-right">
          {viewMode === 'editor' && (
            <>
              {/* Find & Replace Toggle Button */}
              <button
                className={`canvas-tool-btn ${showFindReplace ? 'is-active' : ''}`}
                title="Find & Replace (Ctrl+F)"
                onClick={() => setShowFindReplace(!showFindReplace)}
              >
                <Search size={13} />
                <span>Find</span>
              </button>

              {/* Word Wrap Toggle */}
              {onWordWrapChange && (
                <button
                  className={`canvas-tool-btn ${wordWrap ? 'is-active' : ''}`}
                  title="Toggle Word Wrap"
                  onClick={() => onWordWrapChange(!wordWrap)}
                >
                  <WrapText size={13} />
                  <span>Wrap</span>
                </button>
              )}

              {/* Font Size Selector */}
              {onFontSizeChange && (
                <div className="font-size-group">
                  {[12, 13, 14, 16].map((s) => (
                    <button
                      key={s}
                      className={`font-size-btn ${fontSize === s ? 'is-active' : ''}`}
                      onClick={() => onFontSizeChange(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button className="canvas-tool-btn" onClick={copyToClipboard} title="Copy all text">
            {copied ? <Check size={13} style={{ color: '#34d399' }} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onLoadSample && (!text || text.trim().length === 0) && (
            <button className="data-pill-btn is-gold" onClick={onLoadSample}>
              <Sparkles size={13} />
              <span>Load Sample Text</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Find & Replace Bar */}
      {showFindReplace && viewMode === 'editor' && (
        <div className="find-replace-bar">
          <div className="find-replace-inputs">
            <div className="find-input-group">
              <Search size={13} className="find-icon" />
              <input
                type="text"
                placeholder="Find text or regex..."
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                autoFocus
                className="find-input"
              />
              <span className="match-counter">{findQuery ? `${matchCount} matches` : ''}</span>
              <button
                className={`toggle-flag-btn ${matchCase ? 'is-active' : ''}`}
                title="Match Case"
                onClick={() => setMatchCase(!matchCase)}
              >
                Aa
              </button>
              <button
                className={`toggle-flag-btn ${useRegex ? 'is-active' : ''}`}
                title="Use Regular Expression"
                onClick={() => setUseRegex(!useRegex)}
              >
                .*
              </button>
            </div>

            <div className="replace-input-group">
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="find-input"
              />
              <button
                className="find-action-btn"
                disabled={!findQuery}
                onClick={handleReplaceNext}
              >
                Replace
              </button>
              <button
                className="find-action-btn"
                disabled={!findQuery}
                onClick={handleReplaceAll}
              >
                Replace All
              </button>
            </div>
          </div>

          <div className="find-replace-right">
            {replaceNotice && <span className="replace-notice-pill">{replaceNotice}</span>}
            <button
              className="find-close-btn"
              onClick={() => setShowFindReplace(false)}
              title="Close Find & Replace"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas Body */}
      <div className="text-canvas-body">
        {/* 1. EDITOR VIEW */}
        {viewMode === 'editor' && (
          <div className="editor-zone">
            {/* Gutter with line numbers */}
            <div
              ref={gutterRef}
              className="editor-gutter"
              style={{ fontSize: `${fontSize}px` }}
              aria-hidden="true"
            >
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={`gutter-line-num ${cursorPos.line === i + 1 ? 'is-active' : ''}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Monospace Text Area */}
            <textarea
              ref={textareaRef}
              className={`editor-textarea ${wordWrap ? 'is-wrapped' : 'is-nowrap'}`}
              style={{ fontSize: `${fontSize}px` }}
              value={text}
              onChange={(e) => {
                onTextChange(e.target.value);
                updateCursorPos();
              }}
              onScroll={handleScroll}
              onKeyUp={updateCursorPos}
              onClick={updateCursorPos}
              onSelect={updateCursorPos}
              onKeyDown={handleKeyDown}
              placeholder="Paste or type text here..."
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
        )}

        {/* 2. DIFF COMPARE VIEW */}
        {viewMode === 'diff' && (
          <div className="diff-zone">
            <div className="diff-header-bar">
              <div className="diff-stats">
                <span className="diff-tag diff-add">
                  +{diffData?.addedCount || 0} additions
                </span>
                <span className="diff-tag diff-del">
                  -{diffData?.removedCount || 0} deletions
                </span>
              </div>
              <span className="diff-notice">
                Comparing original baseline against current text state
              </span>
            </div>

            <div className="diff-lines-container">
              {diffData?.changes && diffData.changes.length > 0 ? (
                diffData.changes.map((part, idx) => {
                  const chunkLines = part.value.split('\n');
                  if (chunkLines[chunkLines.length - 1] === '') chunkLines.pop();
                  return chunkLines.map((line, lIdx) => (
                    <div
                      key={`${idx}-${lIdx}`}
                      className={`diff-line-row ${
                        part.added ? 'diff-is-add' : part.removed ? 'diff-is-del' : 'diff-is-same'
                      }`}
                    >
                      <span className="diff-gutter-indicator">
                        {part.added ? '+' : part.removed ? '-' : ' '}
                      </span>
                      <span className="diff-line-text">{line || ' '}</span>
                    </div>
                  ));
                })
              ) : (
                <div className="diff-no-changes">
                  <CheckCircle2 size={32} style={{ color: 'var(--accent, #D4B06A)' }} />
                  <h4>No Differences Detected</h4>
                  <p>The current text is identical to the baseline.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. ANALYSIS & ENTITIES VIEW */}
        {viewMode === 'analysis' && (
          <div className="analysis-zone">
            {/* Real-time Summary Cards */}
            <div className="analysis-cards-grid">
              <div className="analysis-card">
                <span className="card-label">Reading Time</span>
                <strong className="card-val">{metrics.readingTimeMin} min</strong>
                <span className="card-sub">@ 200 words / min</span>
              </div>
              <div className="analysis-card">
                <span className="card-label">Speaking Time</span>
                <strong className="card-val">{metrics.speakingTimeMin} min</strong>
                <span className="card-sub">@ 130 words / min</span>
              </div>
              <div className="analysis-card">
                <span className="card-label">Paragraphs</span>
                <strong className="card-val">{metrics.paragraphs}</strong>
                <span className="card-sub">Separated blocks</span>
              </div>
              <div className="analysis-card">
                <span className="card-label">Chars (No Spaces)</span>
                <strong className="card-val">{metrics.charsNoSpaces}</strong>
                <span className="card-sub">{metrics.chars} total chars</span>
              </div>
            </div>

            {/* Extracted Entities */}
            <div className="analysis-section">
              <h3 className="section-title">
                <AtSign size={15} /> Extracted Entities & Patterns
              </h3>
              <div className="entities-columns-grid">
                {/* Emails */}
                <div className="entity-box">
                  <div className="entity-box-hdr">
                    <span>Emails</span>
                    <span className="count-pill">{entities?.emails?.length || 0}</span>
                  </div>
                  <div className="entity-tags-list">
                    {entities?.emails && entities.emails.length > 0 ? (
                      entities.emails.map((em, i) => (
                        <span key={i} className="entity-pill">
                          {em}
                        </span>
                      ))
                    ) : (
                      <span className="entity-empty">No emails found</span>
                    )}
                  </div>
                </div>

                {/* URLs */}
                <div className="entity-box">
                  <div className="entity-box-hdr">
                    <span>URLs & Links</span>
                    <span className="count-pill">{entities?.urls?.length || 0}</span>
                  </div>
                  <div className="entity-tags-list">
                    {entities?.urls && entities.urls.length > 0 ? (
                      entities.urls.map((url, i) => (
                        <span key={i} className="entity-pill">
                          {url}
                        </span>
                      ))
                    ) : (
                      <span className="entity-empty">No web links found</span>
                    )}
                  </div>
                </div>

                {/* IP Addresses */}
                <div className="entity-box">
                  <div className="entity-box-hdr">
                    <span>IP Addresses</span>
                    <span className="count-pill">{entities?.ipAddresses?.length || 0}</span>
                  </div>
                  <div className="entity-tags-list">
                    {entities?.ipAddresses && entities.ipAddresses.length > 0 ? (
                      entities.ipAddresses.map((ip, i) => (
                        <span key={i} className="entity-pill">
                          {ip}
                        </span>
                      ))
                    ) : (
                      <span className="entity-empty">No IP addresses</span>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="entity-box">
                  <div className="entity-box-hdr">
                    <span>Dates</span>
                    <span className="count-pill">{entities?.dates?.length || 0}</span>
                  </div>
                  <div className="entity-tags-list">
                    {entities?.dates && entities.dates.length > 0 ? (
                      entities.dates.map((d, i) => (
                        <span key={i} className="entity-pill">
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="entity-empty">No dates found</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Word Frequency Ranking Table */}
            <div className="analysis-section">
              <h3 className="section-title">
                <Hash size={15} /> Top Word Frequency Rank
              </h3>
              <div className="word-freq-grid">
                {wordFreq.length > 0 ? (
                  wordFreq.map((item, idx) => {
                    const topCount = wordFreq[0]?.count || 1;
                    const pct = Math.round((item.count / topCount) * 100);
                    return (
                      <div key={idx} className="freq-bar-item">
                        <span className="freq-rank">#{idx + 1}</span>
                        <span className="freq-word">{item.word}</span>
                        <div className="freq-progress-bg">
                          <div className="freq-progress-bar" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="freq-count">{item.count}</span>
                      </div>
                    );
                  })
                ) : (
                  <span className="entity-empty">Type more text to see word frequencies.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Bottom Status Bar */}
      {viewMode === 'editor' && (
        <div className="editor-status-bar">
          <div className="status-left">
            <span>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            {cursorPos.selectedChars > 0 && (
              <span className="status-selected">
                ({cursorPos.selectedChars} characters selected)
              </span>
            )}
          </div>
          <div className="status-right">
            <span>UTF-8</span>
            <span>{wordWrap ? 'Wrap: On' : 'Wrap: Off'}</span>
            <span>{fontSize}px</span>
          </div>
        </div>
      )}
    </div>
  );
};
