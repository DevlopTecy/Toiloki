import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  FileCode,
  Search,
  Replace,
  WrapText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  GitCompare,
  Download,
  Check
} from 'lucide-react';
import { SelectedFile } from '../../file-system/FileDropzone';
import { DocumentEngine } from '../../../engines/documents/document.engine';
import './DocumentCanvas.css';

interface DocumentCanvasProps {
  files: SelectedFile[];
  activeUtilityId: string;
  fontTheme?: 'sans' | 'serif' | 'mono';
  pageSize?: 'a4' | 'letter' | 'legal';
  onTextContentChange?: (text: string) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  files,
  activeUtilityId,
  fontTheme = 'sans',
  pageSize = 'a4',
  onTextContentChange,
}) => {
  const currentFile = files[0];
  const secondFile = files[1];

  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [wordWrap, setWordWrap] = useState<boolean>(true);

  // Editor states
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [showFindBar, setShowFindBar] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Diff states
  const isCompare = activeUtilityId === 'doc-diff' || activeUtilityId === 'doc-compare';
  const isEditor = activeUtilityId === 'edit-text' || activeUtilityId === 'find-replace' || activeUtilityId === 'doc-stats' || activeUtilityId === 'text-cleanup' || activeUtilityId === 'doc-markdown-editor';

  // Load document content whenever currentFile changes
  useEffect(() => {
    if (!currentFile) {
      setRenderedHtml('');
      setRawText('');
      return;
    }

    const loadContent = async () => {
      const buffer = currentFile.buffer;
      const name = currentFile.name.toLowerCase();

      if (buffer) {
        if (name.endsWith('.docx')) {
          try {
            const htmlRes = await DocumentEngine.docxToHtml(buffer);
            if (htmlRes.success && htmlRes.data) {
              setRenderedHtml(htmlRes.data);
            } else {
              const dec = new TextDecoder().decode(buffer);
              setRawText(dec);
              const mdRes = DocumentEngine.markdownToHtml(dec);
              setRenderedHtml(mdRes.success && mdRes.data ? mdRes.data : `<pre style="white-space: pre-wrap; font-family: inherit;">${dec}</pre>`);
              onTextContentChange?.(dec);
            }
            const textRes = await DocumentEngine.docxToText(buffer);
            if (textRes.success && textRes.data) {
              setRawText(textRes.data);
              onTextContentChange?.(textRes.data);
            }
          } catch {
            const dec = new TextDecoder().decode(buffer);
            setRawText(dec);
            const mdRes = DocumentEngine.markdownToHtml(dec);
            setRenderedHtml(mdRes.success && mdRes.data ? mdRes.data : `<pre style="white-space: pre-wrap; font-family: inherit;">${dec}</pre>`);
            onTextContentChange?.(dec);
          }
        } else if (name.endsWith('.md') || name.endsWith('.markdown')) {
          const dec = new TextDecoder().decode(buffer);
          setRawText(dec);
          onTextContentChange?.(dec);
          const htmlRes = DocumentEngine.markdownToHtml(dec);
          if (htmlRes.success && htmlRes.data) setRenderedHtml(htmlRes.data);
        } else if (name.endsWith('.html') || name.endsWith('.htm')) {
          const dec = new TextDecoder().decode(buffer);
          setRawText(dec);
          setRenderedHtml(dec);
          onTextContentChange?.(dec);
        } else if (name.endsWith('.rtf')) {
          const dec = new TextDecoder().decode(buffer);
          const textRes = DocumentEngine.rtfToText(dec);
          const txt = textRes.success && textRes.data ? textRes.data : dec;
          setRawText(txt);
          setRenderedHtml(`<p>${txt.replace(/\n/g, '<br/>')}</p>`);
          onTextContentChange?.(txt);
        } else {
          // Plain text / other
          const dec = new TextDecoder().decode(buffer);
          setRawText(dec);
          setRenderedHtml(`<pre style="white-space: pre-wrap; font-family: inherit;">${dec}</pre>`);
          onTextContentChange?.(dec);
        }
      } else if (currentFile.file) {
        const text = await currentFile.file.text();
        setRawText(text);
        setRenderedHtml(`<pre style="white-space: pre-wrap; font-family: inherit;">${text}</pre>`);
        onTextContentChange?.(text);
      }
    };

    loadContent();
  }, [currentFile]);

  // Document Statistics
  const stats = useMemo(() => {
    const text = rawText.trim();
    if (!text) return { words: 0, chars: 0, lines: 0, readingTime: 0 };
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const lines = text.split('\n').length;
    const readingTime = Math.ceil(words / 200); // 200 wpm
    return { words, chars, lines, readingTime };
  }, [rawText]);

  // Handle Find & Replace
  const handleReplaceAll = () => {
    if (!findQuery) return;
    const updated = rawText.split(findQuery).join(replaceQuery);
    setRawText(updated);
    onTextContentChange?.(updated);
  };

  // Copy text to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compare mode diff lines
  const diffLines = useMemo(() => {
    if (!isCompare || !secondFile) return null;
    const textA = rawText;
    const textB = secondFile.buffer
      ? new TextDecoder().decode(secondFile.buffer)
      : '';
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    const max = Math.max(linesA.length, linesB.length);
    const result: { a?: string; b?: string; status: 'same' | 'added' | 'removed' | 'changed' }[] = [];

    for (let i = 0; i < max; i++) {
      const lineA = linesA[i];
      const lineB = linesB[i];
      if (lineA === lineB) {
        result.push({ a: lineA, b: lineB, status: 'same' });
      } else if (lineA === undefined) {
        result.push({ b: lineB, status: 'added' });
      } else if (lineB === undefined) {
        result.push({ a: lineA, status: 'removed' });
      } else {
        result.push({ a: lineA, b: lineB, status: 'changed' });
      }
    }
    return result;
  }, [isCompare, secondFile, rawText]);

  return (
    <div className="document-canvas-container">
      {/* Top Floating Document Controls */}
      <div className="doc-canvas-toolbar">
        {isEditor ? (
          <>
            <button
              className={`doc-tool-btn ${showFindBar ? 'is-active' : ''}`}
              onClick={() => setShowFindBar(!showFindBar)}
              title="Find and replace"
            >
              <Search size={14} />
              <span>Find / Replace</span>
            </button>
            <button
              className={`doc-tool-btn ${wordWrap ? 'is-active' : ''}`}
              onClick={() => setWordWrap(!wordWrap)}
              title="Toggle word wrap"
            >
              <WrapText size={14} />
              <span>Word wrap</span>
            </button>
          </>
        ) : (
          <>
            <button className="doc-tool-btn" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} title="Zoom out">
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button className="doc-tool-btn" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} title="Zoom in">
              <ZoomIn size={14} />
            </button>
            <button className="doc-tool-btn" onClick={() => setZoom(1)} title="Reset zoom">
              <Maximize2 size={13} />
            </button>
          </>
        )}

        <button className="doc-tool-btn" onClick={handleCopy} title="Copy raw text">
          {copied ? <Check size={14} style={{ color: '#22C55E' }} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy text'}</span>
        </button>
      </div>

      {/* Main View Area */}
      {isCompare && secondFile ? (
        /* Compare Mode */
        <div className="doc-diff-surface">
          <div className="doc-diff-pane">
            <div className="doc-diff-pane-header">
              <span>{currentFile?.name || 'Document A'}</span>
              <span style={{ color: 'var(--text-muted)' }}>Original</span>
            </div>
            <div className="doc-diff-pane-body">
              {diffLines?.map((item, idx) => (
                <div
                  key={`diff-a-${idx}`}
                  className={item.status === 'removed' ? 'diff-line-removed' : item.status === 'changed' ? 'diff-line-removed' : ''}
                >
                  {item.a ?? ' '}
                </div>
              ))}
            </div>
          </div>
          <div className="doc-diff-pane">
            <div className="doc-diff-pane-header">
              <span>{secondFile?.name || 'Document B'}</span>
              <span style={{ color: 'var(--accent)' }}>Modified</span>
            </div>
            <div className="doc-diff-pane-body">
              {diffLines?.map((item, idx) => (
                <div
                  key={`diff-b-${idx}`}
                  className={item.status === 'added' ? 'diff-line-added' : item.status === 'changed' ? 'diff-line-added' : ''}
                >
                  {item.b ?? ' '}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : isEditor ? (
        /* Editor Mode */
        <div className="doc-editor-surface">
          {showFindBar && (
            <div className="doc-editor-findbar">
              <input
                type="text"
                className="doc-find-input"
                placeholder="Find..."
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
              />
              <input
                type="text"
                className="doc-find-input"
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
              />
              <button className="doc-tool-btn" onClick={handleReplaceAll} style={{ padding: '0 10px' }}>
                <Replace size={13} />
                <span>Replace all</span>
              </button>
            </div>
          )}

          <textarea
            className="doc-editor-textarea"
            value={rawText}
            style={{ whiteSpace: wordWrap ? 'pre-wrap' : 'pre' }}
            onChange={(e) => {
              setRawText(e.target.value);
              onTextContentChange?.(e.target.value);
            }}
            placeholder="Type or paste document text here..."
            spellCheck={false}
          />

          <div className="doc-editor-stats-bar">
            <span>Words: <strong>{stats.words}</strong></span>
            <span>Characters: <strong>{stats.chars}</strong></span>
            <span>Lines: <strong>{stats.lines}</strong></span>
            <span>Reading time: <strong>~{stats.readingTime} min</strong></span>
          </div>
        </div>
      ) : (
        /* Paper Sheet Preview Mode */
        <div className="doc-canvas-viewport">
          <div
            className={`doc-paper-sheet theme-${fontTheme}`}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              width: pageSize === 'legal' ? '760px' : pageSize === 'letter' ? '700px' : '720px',
            }}
          >
            {renderedHtml ? (
              <div
                className="doc-rendered-html"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            ) : (
              <div style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                No document loaded or preview unavailable.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
