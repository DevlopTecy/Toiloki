import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Check,
  Columns,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Hash,
  Upload,
  RefreshCw,
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
  onAddMoreFiles?: (files: File[]) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  files,
  activeUtilityId,
  fontTheme = 'sans',
  pageSize = 'a4',
  onTextContentChange,
  onAddMoreFiles,
}) => {
  const currentFile = files[0];
  const secondFile = files[1];

  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [wordWrap, setWordWrap] = useState<boolean>(true);

  // Markdown Editor view layout mode: 'split' | 'editor' | 'preview'
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');

  // Find & Replace states
  const [showFindBar, setShowFindBar] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [matchCase, setMatchCase] = useState<boolean>(false);
  const [matchWholeWord, setMatchWholeWord] = useState<boolean>(false);
  const [useRegex, setUseRegex] = useState<boolean>(false);

  // Diff states
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(true);

  // Mail merge states
  const [activeRecordIndex, setActiveRecordIndex] = useState<number>(0);
  const sampleRecords = useMemo(
    () => [
      { name: 'Sarah Connor', company: 'Cyberdyne Systems', date: 'October 12, 2026', amount: '$4,250.00', role: 'Security Architect' },
      { name: 'Miles Dyson', company: 'Neural Tech Labs', date: 'October 15, 2026', amount: '$8,900.00', role: 'Chief Scientist' },
      { name: 'John Matrix', company: 'Val Verde Logistics', date: 'October 18, 2026', amount: '$3,120.00', role: 'Operations Lead' },
    ],
    []
  );

  // Office Metadata Inspector state
  const [officeMetadata, setOfficeMetadata] = useState<{
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
  } | null>(null);
  const [isScrubbingMetadata, setIsScrubbingMetadata] = useState<boolean>(false);
  const [metadataScrubbed, setMetadataScrubbed] = useState<boolean>(false);

  // Copy feedback
  const [copied, setCopied] = useState<boolean>(false);

  // Synced scroll references for split Markdown editor
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingEditor = useRef<boolean>(false);
  const isSyncingPreview = useRef<boolean>(false);

  // Utility classifications
  const isCompare = activeUtilityId === 'doc-diff' || activeUtilityId === 'doc-compare';
  const isMarkdown =
    activeUtilityId === 'doc-markdown-editor' ||
    (currentFile && (currentFile.name.endsWith('.md') || currentFile.name.endsWith('.markdown')));
  const isMailMerge = activeUtilityId === 'doc-mail-merge';
  const isOfficeMetadata = activeUtilityId === 'doc-office-metadata';
  const isEditor =
    activeUtilityId === 'edit-text' ||
    activeUtilityId === 'find-replace' ||
    activeUtilityId === 'doc-stats' ||
    activeUtilityId === 'text-cleanup' ||
    isMarkdown;

  // Load document content whenever currentFile changes
  useEffect(() => {
    if (!currentFile) {
      setRenderedHtml('');
      setRawText('');
      setOfficeMetadata(null);
      setMetadataScrubbed(false);
      return;
    }

    const loadContent = async () => {
      const buffer = currentFile.buffer;
      const name = currentFile.name.toLowerCase();

      // Handle Office Metadata Inspection
      if (isOfficeMetadata && buffer) {
        try {
          const metaRes = await DocumentEngine.inspectOfficeMetadata(buffer);
          if (metaRes.success && metaRes.data) {
            setOfficeMetadata(metaRes.data);
          }
        } catch {
          setOfficeMetadata(null);
        }
      }

      if (buffer) {
        if (name.endsWith('.docx')) {
          try {
            const htmlRes = await DocumentEngine.docxToHtml(buffer);
            if (htmlRes.success && htmlRes.data) {
              setRenderedHtml(htmlRes.data);
            } else {
              const dec = DocumentEngine.decodeTextBuffer(buffer);
              setRawText(dec);
              const mdRes = DocumentEngine.markdownToHtml(dec);
              setRenderedHtml(
                mdRes.success && mdRes.data
                  ? mdRes.data
                  : `<pre style="white-space: pre-wrap; font-family: inherit;">${dec}</pre>`
              );
              onTextContentChange?.(dec);
            }
            const textRes = await DocumentEngine.docxToText(buffer);
            if (textRes.success && textRes.data) {
              setRawText(textRes.data);
              onTextContentChange?.(textRes.data);
            }
          } catch {
            const dec = DocumentEngine.decodeTextBuffer(buffer);
            setRawText(dec);
            const mdRes = DocumentEngine.markdownToHtml(dec);
            setRenderedHtml(
              mdRes.success && mdRes.data
                ? mdRes.data
                : `<pre style="white-space: pre-wrap; font-family: inherit;">${dec}</pre>`
            );
            onTextContentChange?.(dec);
          }
        } else if (name.endsWith('.md') || name.endsWith('.markdown')) {
          const dec = DocumentEngine.decodeTextBuffer(buffer);
          setRawText(dec);
          onTextContentChange?.(dec);
          const htmlRes = DocumentEngine.markdownToHtml(dec);
          if (htmlRes.success && htmlRes.data) setRenderedHtml(htmlRes.data);
        } else if (name.endsWith('.html') || name.endsWith('.htm')) {
          const dec = DocumentEngine.decodeTextBuffer(buffer);
          setRawText(dec);
          setRenderedHtml(dec);
          onTextContentChange?.(dec);
        } else if (name.endsWith('.rtf')) {
          const dec = DocumentEngine.decodeTextBuffer(buffer);
          const textRes = DocumentEngine.rtfToText(dec);
          const txt = textRes.success && textRes.data ? textRes.data : dec;
          setRawText(txt);
          setRenderedHtml(`<p>${txt.replace(/\n/g, '<br/>')}</p>`);
          onTextContentChange?.(txt);
        } else {
          // Plain text / CSV / other
          const dec = DocumentEngine.decodeTextBuffer(buffer);
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
  }, [currentFile, isOfficeMetadata]);

  // Update markdown preview when rawText changes
  useEffect(() => {
    if (isMarkdown && rawText) {
      const res = DocumentEngine.markdownToHtml(rawText);
      if (res.success && res.data) {
        setRenderedHtml(res.data);
      }
    }
  }, [rawText, isMarkdown]);

  // Synced Scrolling Handlers
  const handleEditorScroll = useCallback(() => {
    if (isSyncingPreview.current || !editorRef.current || !previewRef.current) return;
    isSyncingEditor.current = true;
    const { scrollTop, scrollHeight, clientHeight } = editorRef.current;
    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    const scrollRatio = scrollTop / maxScroll;

    const previewMaxScroll = Math.max(1, previewRef.current.scrollHeight - previewRef.current.clientHeight);
    previewRef.current.scrollTop = scrollRatio * previewMaxScroll;

    setTimeout(() => {
      isSyncingEditor.current = false;
    }, 40);
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (isSyncingEditor.current || !editorRef.current || !previewRef.current) return;
    isSyncingPreview.current = true;
    const { scrollTop, scrollHeight, clientHeight } = previewRef.current;
    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    const scrollRatio = scrollTop / maxScroll;

    const editorMaxScroll = Math.max(1, editorRef.current.scrollHeight - editorRef.current.clientHeight);
    editorRef.current.scrollTop = scrollRatio * editorMaxScroll;

    setTimeout(() => {
      isSyncingPreview.current = false;
    }, 40);
  }, []);

  // Document Statistics
  const stats = useMemo(() => {
    const text = rawText.trim();
    if (!text) return { words: 0, chars: 0, lines: 0, readingTime: 0 };
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const lines = text.split(/\r?\n/).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, lines, readingTime };
  }, [rawText]);

  // Find & Replace match count computation
  const matchCount = useMemo(() => {
    if (!findQuery) return 0;
    try {
      let pattern = useRegex ? findQuery : findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (matchWholeWord) pattern = `\\b${pattern}\\b`;
      const flags = matchCase ? 'g' : 'gi';
      const matches = rawText.match(new RegExp(pattern, flags));
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [rawText, findQuery, matchCase, matchWholeWord, useRegex]);

  // Replace Next
  const handleReplaceNext = () => {
    if (!findQuery) return;
    try {
      let pattern = useRegex ? findQuery : findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (matchWholeWord) pattern = `\\b${pattern}\\b`;
      const flags = matchCase ? '' : 'i';
      const regex = new RegExp(pattern, flags);
      const updated = rawText.replace(regex, replaceQuery);
      setRawText(updated);
      onTextContentChange?.(updated);
    } catch (e) {
      console.warn('Regex replace error:', e);
    }
  };

  // Replace All
  const handleReplaceAll = () => {
    if (!findQuery) return;
    try {
      let pattern = useRegex ? findQuery : findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (matchWholeWord) pattern = `\\b${pattern}\\b`;
      const flags = matchCase ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      const updated = rawText.replace(regex, replaceQuery);
      setRawText(updated);
      onTextContentChange?.(updated);
    } catch (e) {
      console.warn('Regex replace all error:', e);
    }
  };

  // Mail Merge Placeholders & Live Preview
  const detectedPlaceholders = useMemo(() => {
    return DocumentEngine.extractPlaceholders(rawText);
  }, [rawText]);

  const mergedPreviewText = useMemo(() => {
    if (!isMailMerge || !rawText) return rawText;
    const currentRecord = sampleRecords[activeRecordIndex] || sampleRecords[0];
    const res = DocumentEngine.mailMerge(rawText, [currentRecord]);
    return res.success && res.data && res.data.mergedDocs[0] ? res.data.mergedDocs[0] : rawText;
  }, [isMailMerge, rawText, activeRecordIndex, sampleRecords]);

  // Diff comparison using DocumentEngine.computeDiff
  const diffData = useMemo(() => {
    if (!isCompare || !secondFile) return null;
    const textA = rawText;
    const textB = secondFile.buffer ? DocumentEngine.decodeTextBuffer(secondFile.buffer) : '';
    const res = DocumentEngine.computeDiff(textA, textB, { ignoreWhitespace });
    return res.success && res.data ? res.data : null;
  }, [isCompare, secondFile, rawText, ignoreWhitespace]);

  // Handle Scrub Office Metadata
  const handleScrubOfficeMetadata = async () => {
    if (!currentFile?.buffer) return;
    setIsScrubbingMetadata(true);
    try {
      const res = await DocumentEngine.scrubOfficeMetadata(currentFile.buffer);
      if (res.success && res.data) {
        setMetadataScrubbed(true);
        // Trigger download
        const blob = new Blob([res.data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = currentFile.name.includes('.') ? currentFile.name.slice(currentFile.name.lastIndexOf('.')) : '.docx';
        const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_scrubbed${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Scrub metadata failed:', err);
    } finally {
      setIsScrubbingMetadata(false);
    }
  };

  // Copy text to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Line numbers array for editor
  const lineCount = Math.max(1, rawText.split(/\r?\n/).length);
  const lineNumbers = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

  return (
    <div className="document-canvas-container">
      {/* ─── Top Floating Document Toolbar ─── */}
      <div className="doc-canvas-toolbar">
        {isCompare ? (
          <>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', padding: '0 4px' }}>
              Dual Diff
            </span>
            <label className="doc-toolbar-checkbox" title="Ignore leading/trailing spaces">
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              />
              <span>Ignore whitespace</span>
            </label>
            {diffData && (
              <div className="doc-diff-stat-chips">
                <span className="diff-stat-chip add">+{diffData.additions}</span>
                <span className="diff-stat-chip del">-{diffData.deletions}</span>
                <span className="diff-stat-chip mod">~{diffData.modifications}</span>
              </div>
            )}
          </>
        ) : isMailMerge ? (
          <>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', padding: '0 4px' }}>
              Mail Merge
            </span>
            <div className="doc-record-nav">
              <button
                className="doc-tool-btn"
                disabled={activeRecordIndex === 0}
                onClick={() => setActiveRecordIndex((i) => Math.max(0, i - 1))}
                title="Previous record"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="doc-record-indicator">
                Record {activeRecordIndex + 1} of {sampleRecords.length}
              </span>
              <button
                className="doc-tool-btn"
                disabled={activeRecordIndex === sampleRecords.length - 1}
                onClick={() => setActiveRecordIndex((i) => Math.min(sampleRecords.length - 1, i + 1))}
                title="Next record"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            {detectedPlaceholders.length > 0 && (
              <span className="doc-placeholder-count">
                {detectedPlaceholders.length} field{detectedPlaceholders.length === 1 ? '' : 's'} mapped
              </span>
            )}
          </>
        ) : isMarkdown ? (
          <>
            <div className="doc-view-mode-group">
              <button
                className={`doc-tool-btn ${viewMode === 'split' ? 'is-active' : ''}`}
                onClick={() => setViewMode('split')}
                title="Split editor and live preview"
              >
                <Columns size={13} />
                <span>Split</span>
              </button>
              <button
                className={`doc-tool-btn ${viewMode === 'editor' ? 'is-active' : ''}`}
                onClick={() => setViewMode('editor')}
                title="Editor only"
              >
                <Edit3 size={13} />
                <span>Editor</span>
              </button>
              <button
                className={`doc-tool-btn ${viewMode === 'preview' ? 'is-active' : ''}`}
                onClick={() => setViewMode('preview')}
                title="Rendered preview only"
              >
                <Eye size={13} />
                <span>Preview</span>
              </button>
            </div>

            <button
              className={`doc-tool-btn ${showFindBar ? 'is-active' : ''}`}
              onClick={() => setShowFindBar(!showFindBar)}
              title="Find and replace"
            >
              <Search size={13} />
              <span>Find</span>
            </button>
            <button
              className={`doc-tool-btn ${wordWrap ? 'is-active' : ''}`}
              onClick={() => setWordWrap(!wordWrap)}
              title="Toggle word wrap"
            >
              <WrapText size={13} />
            </button>
          </>
        ) : isEditor ? (
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
        ) : isOfficeMetadata ? (
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', padding: '0 4px' }}>
            Office Properties Inspector
          </span>
        ) : (
          <>
            <button
              className="doc-tool-btn"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="doc-tool-btn"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <button className="doc-tool-btn" onClick={() => setZoom(1)} title="Reset zoom">
              <Maximize2 size={13} />
            </button>
          </>
        )}

        <button className="doc-tool-btn" onClick={handleCopy} title="Copy raw document text">
          {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* ─── Mode 1: Compare / Diff Surface ─── */}
      {isCompare ? (
        secondFile ? (
          <div className="doc-diff-surface">
            {/* Left Pane: Original */}
            <div className="doc-diff-pane">
              <div className="doc-diff-pane-header">
                <span className="diff-pane-title">{currentFile?.name || 'Document A'}</span>
                <span className="diff-pane-tag original">Original</span>
              </div>
              <div className="doc-diff-pane-body">
                {diffData?.lines.map((item, idx) => (
                  <div
                    key={`diff-a-${idx}`}
                    className={`diff-row ${
                      item.type === 'removed' ? 'is-removed' : item.type === 'modified' ? 'is-removed' : ''
                    }`}
                  >
                    <span className="diff-gutter-num">{item.lineA ?? ''}</span>
                    <span className="diff-gutter-sign">
                      {item.type === 'removed' ? '-' : item.type === 'modified' ? '~' : ' '}
                    </span>
                    <span className="diff-content">{item.textA ?? ' '}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Pane: Modified */}
            <div className="doc-diff-pane">
              <div className="doc-diff-pane-header">
                <span className="diff-pane-title">{secondFile?.name || 'Document B'}</span>
                <span className="diff-pane-tag modified">Modified</span>
              </div>
              <div className="doc-diff-pane-body">
                {diffData?.lines.map((item, idx) => (
                  <div
                    key={`diff-b-${idx}`}
                    className={`diff-row ${
                      item.type === 'added' ? 'is-added' : item.type === 'modified' ? 'is-added' : ''
                    }`}
                  >
                    <span className="diff-gutter-num">{item.lineB ?? ''}</span>
                    <span className="diff-gutter-sign">
                      {item.type === 'added' ? '+' : item.type === 'modified' ? '~' : ' '}
                    </span>
                    <span className="diff-content">{item.textB ?? ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="doc-diff-empty-container">
            <div className="doc-diff-empty-card">
              <div className="diff-empty-icon-wrap">
                <GitCompare size={28} />
              </div>
              <h3>Compare Revisions</h3>
              <p>
                Document A (<strong>{currentFile?.name || 'Primary'}</strong>) is ready. Drop or select Document B
                to inspect line-by-line differences, additions, and deletions side-by-side.
              </p>
              <label className="action-btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', gap: '8px' }}>
                <Upload size={14} />
                <span>Select Document B</span>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  accept=".txt,.md,.markdown,.html,.htm,.rtf,.docx"
                  onChange={(e) => {
                    const selected = e.target.files ? Array.from(e.target.files) : [];
                    if (selected.length > 0) onAddMoreFiles?.(selected);
                  }}
                />
              </label>
            </div>
          </div>
        )
      ) : isOfficeMetadata ? (
        /* ─── Mode 2: Office Metadata Inspector Surface ─── */
        <div className="doc-metadata-surface">
          <div className="doc-metadata-card">
            <div className="doc-metadata-header-row">
              <div className="doc-metadata-title-block">
                <h3>Office Document Metadata</h3>
                <p>Inspect authoring identity, revisions, and embedded application markers.</p>
              </div>
              <div className="doc-metadata-status-badge">
                {officeMetadata?.hasMetadata ? (
                  <span className="meta-badge-warning">
                    <AlertCircle size={13} />
                    <span>Embedded Metadata Found</span>
                  </span>
                ) : (
                  <span className="meta-badge-clean">
                    <ShieldCheck size={13} />
                    <span>Clean / Sanitized</span>
                  </span>
                )}
              </div>
            </div>

            <div className="doc-metadata-table-wrapper">
              <table className="doc-metadata-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Value in Document</th>
                    <th>Sanitization Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Title</td>
                    <td>{officeMetadata?.title || <span className="meta-empty">Not specified</span>}</td>
                    <td>{metadataScrubbed ? 'Stripped' : officeMetadata?.title ? 'Exposed' : 'Empty'}</td>
                  </tr>
                  <tr>
                    <td>Author / Creator</td>
                    <td>{officeMetadata?.creator || <span className="meta-empty">Not specified</span>}</td>
                    <td>{metadataScrubbed ? 'Stripped' : officeMetadata?.creator ? 'Exposed' : 'Empty'}</td>
                  </tr>
                  <tr>
                    <td>Last Modified By</td>
                    <td>{officeMetadata?.lastModifiedBy || <span className="meta-empty">Not specified</span>}</td>
                    <td>{metadataScrubbed ? 'Stripped' : officeMetadata?.lastModifiedBy ? 'Exposed' : 'Empty'}</td>
                  </tr>
                  <tr>
                    <td>Revision</td>
                    <td>{officeMetadata?.revision || <span className="meta-empty">1</span>}</td>
                    <td>{metadataScrubbed ? 'Reset to 1' : 'Preserved'}</td>
                  </tr>
                  <tr>
                    <td>Created Date</td>
                    <td>{officeMetadata?.created || <span className="meta-empty">Not recorded</span>}</td>
                    <td>{metadataScrubbed ? 'Sanitized' : 'Preserved'}</td>
                  </tr>
                  <tr>
                    <td>Last Modified Date</td>
                    <td>{officeMetadata?.modified || <span className="meta-empty">Not recorded</span>}</td>
                    <td>{metadataScrubbed ? 'Sanitized' : 'Preserved'}</td>
                  </tr>
                  <tr>
                    <td>Application</td>
                    <td>{officeMetadata?.application || <span className="meta-empty">Office Suite</span>}</td>
                    <td>{metadataScrubbed ? 'Replaced with Toiloki' : 'Preserved'}</td>
                  </tr>
                  <tr>
                    <td>Company / Organization</td>
                    <td>{officeMetadata?.company || <span className="meta-empty">Not specified</span>}</td>
                    <td>{metadataScrubbed ? 'Stripped' : officeMetadata?.company ? 'Exposed' : 'Empty'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="doc-metadata-actions-row">
              <button
                type="button"
                className="action-btn-primary"
                onClick={handleScrubOfficeMetadata}
                disabled={isScrubbingMetadata}
              >
                <ShieldCheck size={14} />
                <span>{isScrubbingMetadata ? 'Scrubbing...' : 'Scrub & Download Clean Document'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : isMarkdown ? (
        /* ─── Mode 3: Markdown Split View with Synced Scroll ─── */
        <div className="doc-editor-surface">
          {showFindBar && (
            <div className="doc-editor-findbar">
              <input
                type="text"
                className="doc-find-input"
                placeholder="Find in document..."
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
              <div className="find-modifiers-group">
                <button
                  type="button"
                  className={`find-toggle-btn ${matchCase ? 'is-active' : ''}`}
                  onClick={() => setMatchCase(!matchCase)}
                  title="Match case (Aa)"
                >
                  Aa
                </button>
                <button
                  type="button"
                  className={`find-toggle-btn ${matchWholeWord ? 'is-active' : ''}`}
                  onClick={() => setMatchWholeWord(!matchWholeWord)}
                  title="Match whole word (\b)"
                >
                  \b
                </button>
                <button
                  type="button"
                  className={`find-toggle-btn ${useRegex ? 'is-active' : ''}`}
                  onClick={() => setUseRegex(!useRegex)}
                  title="Use regular expression (.*)"
                >
                  .*
                </button>
              </div>
              <span className="find-count-badge">
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
              <button className="doc-tool-btn" onClick={handleReplaceNext} title="Replace next occurrence">
                <Replace size={13} />
                <span>Next</span>
              </button>
              <button className="doc-tool-btn" onClick={handleReplaceAll} title="Replace all occurrences">
                <Replace size={13} />
                <span>All</span>
              </button>
            </div>
          )}

          <div className="doc-markdown-split-container">
            {/* Left: Editor Pane */}
            {(viewMode === 'split' || viewMode === 'editor') && (
              <div className="doc-markdown-editor-pane">
                <div className="doc-editor-gutters">
                  {lineNumbers.map((num) => (
                    <div key={`line-${num}`} className="doc-editor-gutter-line">
                      {num}
                    </div>
                  ))}
                </div>
                <textarea
                  ref={editorRef}
                  className="doc-editor-textarea with-gutter"
                  value={rawText}
                  style={{ whiteSpace: wordWrap ? 'pre-wrap' : 'pre' }}
                  onScroll={handleEditorScroll}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    onTextContentChange?.(e.target.value);
                  }}
                  placeholder="Type or paste Markdown text here..."
                  spellCheck={false}
                />
              </div>
            )}

            {/* Right: Rendered HTML Preview Pane */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div
                ref={previewRef}
                className="doc-markdown-preview-pane"
                onScroll={handlePreviewScroll}
              >
                <div
                  className="doc-rendered-html markdown-body"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            )}
          </div>

          <div className="doc-editor-stats-bar">
            <span>Words: <strong>{stats.words}</strong></span>
            <span>Characters: <strong>{stats.chars}</strong></span>
            <span>Lines: <strong>{stats.lines}</strong></span>
            <span>Reading time: <strong>~{stats.readingTime} min</strong></span>
          </div>
        </div>
      ) : isEditor ? (
        /* ─── Mode 4: Plain Text Editor Surface ─── */
        <div className="doc-editor-surface">
          {showFindBar && (
            <div className="doc-editor-findbar">
              <input
                type="text"
                className="doc-find-input"
                placeholder="Find in document..."
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
              <div className="find-modifiers-group">
                <button
                  type="button"
                  className={`find-toggle-btn ${matchCase ? 'is-active' : ''}`}
                  onClick={() => setMatchCase(!matchCase)}
                  title="Match case (Aa)"
                >
                  Aa
                </button>
                <button
                  type="button"
                  className={`find-toggle-btn ${matchWholeWord ? 'is-active' : ''}`}
                  onClick={() => setMatchWholeWord(!matchWholeWord)}
                  title="Match whole word (\b)"
                >
                  \b
                </button>
                <button
                  type="button"
                  className={`find-toggle-btn ${useRegex ? 'is-active' : ''}`}
                  onClick={() => setUseRegex(!useRegex)}
                  title="Use regular expression (.*)"
                >
                  .*
                </button>
              </div>
              <span className="find-count-badge">
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
              <button className="doc-tool-btn" onClick={handleReplaceNext}>
                <Replace size={13} />
                <span>Next</span>
              </button>
              <button className="doc-tool-btn" onClick={handleReplaceAll}>
                <Replace size={13} />
                <span>All</span>
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
        /* ─── Mode 5: Paper Sheet Preview Surface (Mail Merge / Reader) ─── */
        <div className="doc-canvas-viewport">
          <div
            className={`doc-paper-sheet theme-${fontTheme}`}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              width: pageSize === 'legal' ? '760px' : pageSize === 'letter' ? '700px' : '720px',
            }}
          >
            {isMailMerge ? (
              <div className="doc-mailmerge-body">
                {detectedPlaceholders.length > 0 && (
                  <div className="doc-placeholders-strip">
                    <span className="strip-label">Placeholders detected:</span>
                    <div className="strip-chips">
                      {detectedPlaceholders.map((ph) => (
                        <span key={ph} className="placeholder-tag">
                          {`{{${ph}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div
                  className="doc-rendered-html"
                  dangerouslySetInnerHTML={{
                    __html: DocumentEngine.markdownToHtml(mergedPreviewText).data || mergedPreviewText,
                  }}
                />
              </div>
            ) : renderedHtml ? (
              <div className="doc-rendered-html" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No document loaded or preview unavailable.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
