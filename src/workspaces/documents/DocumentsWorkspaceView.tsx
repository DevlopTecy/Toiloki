import React, { useState, useEffect, useMemo } from 'react';
import { ToolLayout } from '../../components/common/ToolLayout';
import { FileDropzone, SelectedFile } from '../../components/file-system/FileDropzone';
import { ResultViewer } from '../../components/file-system/ResultViewer';
import { ErrorPanel } from '../../components/common/ErrorPanel';
import { DiffEngine, DiffChange } from '../../engines/diff/diff.engine';
import { TextEngine } from '../../engines/text/text.engine';
import { DocumentEngine } from '../../engines/documents/document.engine';
import {
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  FileCode,
  ListTree,
  Mail,
  Replace,
  FileSearch,
  Eye,
  FileText
} from 'lucide-react';
import { HistoryService } from '../../core/services/history.service';
import { pluralWord } from '../../core/utils/plural';
import './DocumentsWorkspaceView.css';

interface DocumentsWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

interface ReplaceRule {
  id: string;
  find: string;
  replace: string;
  matchCase: boolean;
  matchWholeWord: boolean;
  isRegex: boolean;
}

export const DocumentsWorkspaceView: React.FC<DocumentsWorkspaceViewProps> = ({
  groupId,
  utilityId,
  toolName,
  toolDescription,
  onBackToUtilities,
  isFavorite,
  onToggleFavorite,
}) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [editorText, setEditorText] = useState(
    '# Project Scope & Architecture\n\nToiloki is an offline, local-first utility suite designed for fast, everyday desktop tasks.\n\n## Core Principles\n- Zero cloud dependencies\n- Zero telemetry tracking\n- Complete document privacy\n\n### Security & Performance\nDeterministic execution ensures consistent results across runs.\nAll operations execute locally in-memory with maximum performance.\n'
  );

  // Single Find/Replace
  const [findWord, setFindWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');
  const [replaceCount, setReplaceCount] = useState<number | null>(null);

  // Batch Find/Replace Rules
  const [batchRules, setBatchRules] = useState<ReplaceRule[]>([
    { id: '1', find: 'cloud', replace: 'offline', matchCase: false, matchWholeWord: true, isRegex: false },
    { id: '2', find: 'telemetry', replace: 'tracking', matchCase: false, matchWholeWord: true, isRegex: false },
  ]);
  const [batchResultReport, setBatchResultReport] = useState<string | null>(null);

  // Markdown Editor state
  const [mdPreviewActive, setMdPreviewActive] = useState(true);

  // Table of Contents state
  const [tocFormat, setTocFormat] = useState<'markdown' | 'numbered' | 'bullets' | 'html'>('markdown');
  const [tocMaxDepth, setTocMaxDepth] = useState<number>(3);
  const [generatedToc, setGeneratedToc] = useState<string>('');

  // Mail Merge state
  const [mergeTemplate, setMergeTemplate] = useState(
    'Dear {{name}},\n\nWe are pleased to inform you that your workspace for {{company}} has been activated under subscription tier: {{tier}}.\nYour primary contact email is {{email}}.\n\nBest regards,\nToiloki Operations Team'
  );
  const [mergeCsvData, setMergeCsvData] = useState(
    'name,company,tier,email\nAlice Vance,Acme Robotics,Enterprise,alice@acme.org\nBob Miller,Global Logistics,Pro,bob@globallogistics.dev\nCharlie King,HyperScale,Standard,charlie@hyperscale.io'
  );
  const [mergedDocs, setMergedDocs] = useState<string[]>([]);
  const [activeMergedIndex, setActiveMergedIndex] = useState(0);

  // Office Metadata state
  const [officeMeta, setOfficeMeta] = useState<{
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
  const [scrubSuccess, setScrubSuccess] = useState(false);

  // Compare diff state
  const [docOriginal, setDocOriginal] = useState(
    '1. Introduction\nToiloki is a desktop utility application.\n2. Architecture\nModular Workspace -> Group -> Utility -> Feature -> Engine structure.\n3. Processing\nProcessed locally on the user machine.'
  );
  const [docModified, setDocModified] = useState(
    '1. Introduction\nToiloki is a high-performance Windows desktop utility application.\n2. Architecture\nModular Workspace -> Group -> Utility -> Feature -> Engine structure.\n3. Processing\nProcessed 100% locally with zero cloud dependencies.\n4. Distribution\nPackaged as standalone Windows portable executable.'
  );
  const [diffChanges, setDiffChanges] = useState<DiffChange[] | null>(null);

  const [outputResult, setOutputResult] = useState<{
    text?: string;
    buffer?: Uint8Array;
    ext: string;
    fileName: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const metrics = useMemo(() => {
    return TextEngine.analyzeText(editorText).data;
  }, [editorText]);

  const renderedHtmlPreview = useMemo(() => {
    return DocumentEngine.markdownToHtml(editorText).data || '';
  }, [editorText]);

  // Read metadata when file is loaded in doc-office-metadata
  useEffect(() => {
    if (utilityId === 'doc-office-metadata' && files.length > 0 && files[0].buffer) {
      DocumentEngine.inspectOfficeMetadata(files[0].buffer).then((res) => {
        if (res.success && res.data) {
          setOfficeMeta(res.data);
          setScrubSuccess(false);
        } else {
          setErrorMsg(res.error || 'Failed to inspect office file');
        }
      });
    }
  }, [utilityId, files]);

  // Generate TOC automatically when text or options change
  useEffect(() => {
    if (utilityId === 'doc-toc-generator') {
      const res = DocumentEngine.generateToc(editorText, { format: tocFormat, maxDepth: tocMaxDepth });
      if (res.success && res.data) {
        setGeneratedToc(res.data.toc);
      }
    }
  }, [utilityId, editorText, tocFormat, tocMaxDepth]);

  const handleReset = () => {
    setFiles([]);
    setOutputResult(null);
    setErrorMsg(null);
    setDiffChanges(null);
    setReplaceCount(null);
    setBatchResultReport(null);
    setOfficeMeta(null);
    setScrubSuccess(false);
  };

  const handleCopyText = async (textToCopy: string) => {
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleConvertOrExport = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      if (utilityId.includes('export') || utilityId === 'doc-markdown-editor') {
        let ext = 'txt';
        let content = editorText;
        if (utilityId === 'export-html') {
          ext = 'html';
          const conv = DocumentEngine.markdownToHtml(editorText);
          if (conv.success && conv.data) content = conv.data;
        } else if (utilityId === 'export-md' || utilityId === 'doc-markdown-editor') {
          ext = 'md';
        } else if (utilityId === 'export-rtf') {
          ext = 'rtf';
          const conv = DocumentEngine.textToRtf(editorText);
          if (conv.success && conv.data) content = conv.data;
        }

        const encoder = new TextEncoder();
        const buf = encoder.encode(content);
        setOutputResult({
          text: content,
          buffer: buf,
          ext,
          fileName: `document_export.${ext}`,
        });
      } else {
        if (files.length === 0) return;
        const f = files[0];
        let outText = '';
        let outExt = 'txt';
        const rawBuf = f.buffer || new Uint8Array();

        if ((utilityId === 'pdf-to-docx' || f.name.toLowerCase().endsWith('.pdf')) && f.buffer) {
          const res = await DocumentEngine.pdfToDocx(f.buffer);
          if (!res.success || !res.data) throw new Error(res.error || 'Failed to convert PDF to DOCX');
          setOutputResult({
            buffer: res.data,
            ext: 'docx',
            fileName: `${f.name.replace(/\.[^.]+$/, '')}.docx`,
          });
          HistoryService.record({
            toolName,
            workspaceId: 'documents',
            groupId,
            utilityId,
            input: f.name,
            output: `Converted to Word (.docx) Document`,
            status: 'completed',
          });
          return;
        }

        if (f.name.endsWith('.docx') && f.buffer) {
          if (utilityId === 'docx-to-html') {
            const res = await DocumentEngine.docxToHtml(f.buffer);
            outText = res.data || '';
            outExt = 'html';
          } else {
            const res = await DocumentEngine.docxToText(f.buffer);
            outText = res.data || '';
            outExt = 'txt';
          }
        } else if (f.name.endsWith('.md')) {
          const text = new TextDecoder().decode(rawBuf);
          const res = DocumentEngine.markdownToHtml(text);
          outText = res.data || '';
          outExt = 'html';
        } else if (f.name.endsWith('.html') || f.name.endsWith('.htm')) {
          const text = new TextDecoder().decode(rawBuf);
          const res = DocumentEngine.htmlToMarkdown(text);
          outText = res.data || '';
          outExt = 'md';
        } else if (f.name.endsWith('.rtf')) {
          const text = new TextDecoder().decode(rawBuf);
          const res = DocumentEngine.rtfToText(text);
          outText = res.data || '';
          outExt = 'txt';
        } else {
          outText = new TextDecoder().decode(rawBuf);
          outExt = 'txt';
        }

        const outBuf = new TextEncoder().encode(outText);
        setOutputResult({
          text: outText,
          buffer: outBuf,
          ext: outExt,
          fileName: `${f.name.replace(/\.[^.]+$/, '')}_converted.${outExt}`,
        });
      }

      HistoryService.record({
        toolName,
        workspaceId: 'documents',
        groupId,
        utilityId,
        input: files[0]?.name || 'Document Editor Text',
        output: `Processed document (${utilityId})`,
        status: 'completed',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportDocx = async () => {
    setIsProcessing(true);
    try {
      const res = await DocumentEngine.createDocxFromText(editorText, 'Exported Document');
      if (res.success && res.data) {
        setOutputResult({
          buffer: res.data,
          ext: 'docx',
          fileName: 'document_export.docx',
        });
      } else {
        throw new Error(res.error || 'Failed to generate Word document');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFindReplace = () => {
    if (!findWord) return;
    const occurrences = (editorText.match(new RegExp(findWord, 'g')) || []).length;
    const updated = editorText.replaceAll(findWord, replaceWord);
    setEditorText(updated);
    setReplaceCount(occurrences);
  };

  const handleExecuteBatchReplace = () => {
    const res = DocumentEngine.batchFindReplace(editorText, batchRules);
    if (res.success && res.data) {
      setEditorText(res.data.text);
      setBatchResultReport(
        `✓ Executed ${batchRules.length} rules with ${res.data.replacementsCount} total replacements applied.`
      );
    } else {
      setErrorMsg(res.error || 'Failed batch find and replace');
    }
  };

  const handleExecuteMailMerge = () => {
    try {
      const lines = mergeCsvData.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error('Data must contain at least a header row and 1 record');
      const headers = lines[0].split(',').map((h) => h.trim());
      const records = lines.slice(1).map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        const rec: Record<string, string> = {};
        headers.forEach((h, i) => {
          rec[h] = parts[i] || '';
        });
        return rec;
      });

      const res = DocumentEngine.mailMerge(mergeTemplate, records);
      if (res.success && res.data) {
        setMergedDocs(res.data.mergedDocs);
        setActiveMergedIndex(0);
      } else {
        throw new Error(res.error || 'Mail merge failed');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleScrubOfficeMetadata = async () => {
    if (!files[0]?.buffer) return;
    setIsProcessing(true);
    try {
      const res = await DocumentEngine.scrubOfficeMetadata(files[0].buffer);
      if (res.success && res.data) {
        setOutputResult({
          buffer: res.data,
          ext: files[0].name.split('.').pop() || 'docx',
          fileName: `${files[0].name.replace(/\.[^.]+$/, '')}_scrubbed.${files[0].name.split('.').pop()}`,
        });
        setScrubSuccess(true);
      } else {
        throw new Error(res.error || 'Failed to scrub metadata');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompareDiff = () => {
    const res = DiffEngine.compareLines(docOriginal, docModified);
    if (res.success && res.data) {
      setDiffChanges(res.data.changes);
    }
  };

  const breadcrumbs = [
    { label: 'Home', onClick: onBackToUtilities },
    { label: 'Documents', onClick: onBackToUtilities },
    { label: toolName },
  ];

  return (
    <ToolLayout
      breadcrumbItems={breadcrumbs}
      title={toolName}
      description={toolDescription}
      badgeGradient="var(--badge-doc)"
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onReset={handleReset}
    >
      <div className="documents-tool-body">
        {/* Converter Screens */}
        {groupId === 'doc-converter' && !outputResult && (
          <div className="doc-converter-pane">
            <FileDropzone
              accept={
                utilityId === 'docx-to-pdf'
                  ? ['.docx', '.doc']
                  : utilityId === 'pdf-to-docx'
                    ? ['.pdf']
                    : utilityId === 'md-to-pdf-doc'
                      ? ['.md', '.markdown']
                      : utilityId === 'html-to-pdf-doc'
                        ? ['.html', '.htm']
                        : ['.txt', '.rtf']
              }
              multiple={false}
              files={files}
              onFilesChanged={setFiles}
              label={`Select document to convert (${toolName})`}
            />

            {files.length > 0 && (
              <button
                className="tool-btn primary"
                onClick={handleConvertOrExport}
                disabled={isProcessing}
                style={{ alignSelf: 'flex-start' }}
              >
                <span>{isProcessing ? 'Converting...' : `Convert to ${utilityId === 'pdf-to-docx' ? 'DOCX' : 'PDF'}`}</span>
              </button>
            )}
          </div>
        )}

        {/* 1. Markdown Editor */}
        {utilityId === 'doc-markdown-editor' && !outputResult && (
          <div className="doc-editor-pane">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={`segmented-chip-btn ${mdPreviewActive ? 'active' : ''}`}
                  onClick={() => setMdPreviewActive(!mdPreviewActive)}
                >
                  <Eye size={12} />
                  <span>{mdPreviewActive ? 'Side-by-Side Preview' : 'Source Only'}</span>
                </button>
                <button
                  type="button"
                  className="segmented-chip-btn"
                  onClick={() => setEditorText(editorText + '\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Data A | Data B |')}
                >
                  + Add Table
                </button>
                <button
                  type="button"
                  className="segmented-chip-btn"
                  onClick={() => setEditorText(editorText + '\n\n```typescript\n// Code snippet\nconst local = true;\n```')}
                >
                  + Add Code
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="tool-btn secondary" onClick={() => handleCopyText(editorText)}>
                  {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy MD'}</span>
                </button>
                <button className="tool-btn primary" onClick={handleExportDocx}>
                  <Download size={13} />
                  <span>Export to DOCX</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: mdPreviewActive ? '1fr 1fr' : '1fr', gap: '12px', minHeight: '360px' }}>
              <textarea
                className="doc-text-editor"
                style={{ height: '360px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="Write your markdown here..."
              />
              {mdPreviewActive && (
                <div
                  className="doc-markdown-preview-box"
                  style={{
                    height: '360px',
                    overflowY: 'auto',
                    padding: '16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    lineHeight: 1.7,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderedHtmlPreview }}
                />
              )}
            </div>
          </div>
        )}

        {/* 2. Table of Contents Generator */}
        {utilityId === 'doc-toc-generator' && !outputResult && (
          <div className="doc-editor-pane">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Format:</span>
                {(['markdown', 'numbered', 'bullets', 'html'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className={`segmented-chip-btn ${tocFormat === fmt ? 'active' : ''}`}
                    onClick={() => setTocFormat(fmt)}
                  >
                    {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Depth:</span>
                {[2, 3, 4].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`segmented-chip-btn ${tocMaxDepth === d ? 'active' : ''}`}
                    onClick={() => setTocMaxDepth(d)}
                  >
                    H{d}
                  </button>
                ))}
              </div>
              <button
                className="tool-btn secondary"
                onClick={() => {
                  setEditorText(`${generatedToc}\n\n${editorText}`);
                }}
              >
                Insert at Document Top
              </button>
              <button className="tool-btn primary" onClick={() => handleCopyText(generatedToc)}>
                {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                <span>{copied ? 'Copied TOC' : 'Copy TOC'}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label className="editor-label" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Source Document Text:
                </label>
                <textarea
                  className="doc-text-editor"
                  style={{ height: '320px', fontFamily: 'var(--font-mono)' }}
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                />
              </div>
              <div>
                <label className="editor-label" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Generated Table of Contents:
                </label>
                <textarea
                  readOnly
                  className="doc-text-editor"
                  style={{ height: '320px', fontFamily: 'var(--font-mono)', background: 'var(--bg-canvas)' }}
                  value={generatedToc}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Mail Merge */}
        {utilityId === 'doc-mail-merge' && !outputResult && (
          <div className="doc-editor-pane">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="editor-label" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Document Template (Use {'{{field}}'} placeholders):
                </label>
                <textarea
                  className="doc-text-editor"
                  style={{ height: '220px', fontFamily: 'var(--font-mono)' }}
                  value={mergeTemplate}
                  onChange={(e) => setMergeTemplate(e.target.value)}
                />
              </div>
              <div>
                <label className="editor-label" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Recipient Records (CSV format with headers):
                </label>
                <textarea
                  className="doc-text-editor"
                  style={{ height: '220px', fontFamily: 'var(--font-mono)' }}
                  value={mergeCsvData}
                  onChange={(e) => setMergeCsvData(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button className="tool-btn primary" onClick={handleExecuteMailMerge}>
                <Mail size={14} />
                <span>Execute Mail Merge</span>
              </button>
              {mergedDocs.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Merged {mergedDocs.length} personalized documents
                </span>
              )}
            </div>

            {mergedDocs.length > 0 && (
              <div style={{ marginTop: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {mergedDocs.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`segmented-chip-btn ${activeMergedIndex === i ? 'active' : ''}`}
                        onClick={() => setActiveMergedIndex(i)}
                      >
                        Recipient #{i + 1}
                      </button>
                    ))}
                  </div>
                  <button className="tool-btn secondary" onClick={() => handleCopyText(mergedDocs[activeMergedIndex])}>
                    {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                    <span>Copy Document #{activeMergedIndex + 1}</span>
                  </button>
                </div>
                <pre
                  style={{
                    background: 'var(--bg-canvas)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text)',
                  }}
                >
                  {mergedDocs[activeMergedIndex]}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 4. Batch Find & Replace */}
        {utilityId === 'doc-batch-find-replace' && !outputResult && (
          <div className="doc-editor-pane">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Replacement Rules:</span>
                <button
                  type="button"
                  className="tool-btn secondary"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  onClick={() =>
                    setBatchRules([
                      ...batchRules,
                      { id: Date.now().toString(), find: '', replace: '', matchCase: false, matchWholeWord: false, isRegex: false },
                    ])
                  }
                >
                  <Plus size={12} />
                  <span>Add Rule</span>
                </button>
              </div>

              {batchRules.map((rule, idx) => (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '20px' }}>#{idx + 1}</span>
                  <input
                    type="text"
                    placeholder="Find pattern..."
                    value={rule.find}
                    onChange={(e) => {
                      const updated = [...batchRules];
                      updated[idx].find = e.target.value;
                      setBatchRules(updated);
                    }}
                    style={{
                      flex: '1 1 140px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>→</span>
                  <input
                    type="text"
                    placeholder="Replace with..."
                    value={rule.replace}
                    onChange={(e) => {
                      const updated = [...batchRules];
                      updated[idx].replace = e.target.value;
                      setBatchRules(updated);
                    }}
                    style={{
                      flex: '1 1 140px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                    }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rule.matchCase}
                      onChange={(e) => {
                        const updated = [...batchRules];
                        updated[idx].matchCase = e.target.checked;
                        setBatchRules(updated);
                      }}
                    />
                    Case
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rule.matchWholeWord}
                      onChange={(e) => {
                        const updated = [...batchRules];
                        updated[idx].matchWholeWord = e.target.checked;
                        setBatchRules(updated);
                      }}
                    />
                    Whole
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rule.isRegex}
                      onChange={(e) => {
                        const updated = [...batchRules];
                        updated[idx].isRegex = e.target.checked;
                        setBatchRules(updated);
                      }}
                    />
                    Regex
                  </label>
                  {batchRules.length > 1 && (
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '2px' }}
                      onClick={() => setBatchRules(batchRules.filter((r) => r.id !== rule.id))}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <button className="tool-btn primary" onClick={handleExecuteBatchReplace}>
                  <Replace size={14} />
                  <span>Execute All Rules</span>
                </button>
                {batchResultReport && (
                  <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>{batchResultReport}</span>
                )}
              </div>
            </div>

            <textarea
              className="doc-text-editor"
              style={{ height: '240px', fontFamily: 'var(--font-mono)' }}
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
            />
          </div>
        )}

        {/* 5. Office Metadata Inspector */}
        {utilityId === 'doc-office-metadata' && !outputResult && (
          <div className="doc-editor-pane">
            <FileDropzone
              accept={['.docx', '.xlsx', '.pptx']}
              multiple={false}
              files={files}
              onFilesChanged={setFiles}
              label="Drop Office document (.docx, .xlsx, .pptx) to inspect metadata"
            />

            {officeMeta && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '12px' }}>
                  Document Metadata Properties:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  <div className="doc-metric-item"><strong>Title:</strong> {officeMeta.title || '<Not specified>'}</div>
                  <div className="doc-metric-item"><strong>Author / Creator:</strong> {officeMeta.creator || '<Not specified>'}</div>
                  <div className="doc-metric-item"><strong>Last Modified By:</strong> {officeMeta.lastModifiedBy || '<Not specified>'}</div>
                  <div className="doc-metric-item"><strong>Revision Count:</strong> {officeMeta.revision || '<Not specified>'}</div>
                  <div className="doc-metric-item"><strong>Created Date:</strong> {officeMeta.created || '<Not specified>'}</div>
                  <div className="doc-metric-item"><strong>Modified Date:</strong> {officeMeta.modified || '<Not specified>'}</div>
                  <div className="doc-metric-item"><strong>Application:</strong> {officeMeta.application || '<Not specified>'}</div>
                  <div className="doc-metric-item"><strong>Company:</strong> {officeMeta.company || '<Not specified>'}</div>
                </div>

                <button
                  className="tool-btn primary"
                  onClick={handleScrubOfficeMetadata}
                  disabled={isProcessing}
                >
                  <ShieldCheck size={14} />
                  <span>{isProcessing ? 'Scrubbing...' : 'Scrub & Remove All Metadata'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Standard Document Editor & Exporter */}
        {(groupId === 'doc-editor' || groupId === 'doc-export') &&
          utilityId !== 'doc-markdown-editor' &&
          utilityId !== 'doc-toc-generator' &&
          utilityId !== 'doc-mail-merge' &&
          utilityId !== 'doc-batch-find-replace' &&
          !outputResult && (
            <div className="doc-editor-pane">
              {metrics && (
                <div className="doc-metrics-bar">
                  <span className="doc-metric-item"><strong>{metrics.words}</strong> {pluralWord(metrics.words, 'word')}</span>
                  <span className="doc-metric-item"><strong>{metrics.characters}</strong> {pluralWord(metrics.characters, 'character')}</span>
                  <span className="doc-metric-item"><strong>{metrics.lines}</strong> {pluralWord(metrics.lines, 'line')}</span>
                  <span className="doc-metric-item"><strong>{metrics.paragraphs}</strong> {pluralWord(metrics.paragraphs, 'paragraph')}</span>
                </div>
              )}

              {utilityId === 'find-replace' && (
                <div className="find-replace-bar">
                  <input
                    type="text"
                    className="option-input"
                    placeholder="Find text..."
                    value={findWord}
                    onChange={(e) => setFindWord(e.target.value)}
                  />
                  <input
                    type="text"
                    className="option-input"
                    placeholder="Replace with..."
                    value={replaceWord}
                    onChange={(e) => setReplaceWord(e.target.value)}
                  />
                  <button className="tool-btn secondary" onClick={handleFindReplace}>
                    Replace All
                  </button>
                  {replaceCount !== null && (
                    <span className="replace-count-badge">Replaced {replaceCount} matches</span>
                  )}
                </div>
              )}

              <textarea
                className="doc-text-editor"
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="Start drafting or editing your document here..."
              />

              {groupId === 'doc-export' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="tool-btn primary"
                    onClick={handleConvertOrExport}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Download size={14} />
                    <span>{toolName}</span>
                  </button>
                  <button
                    className="tool-btn secondary"
                    onClick={handleExportDocx}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <FileText size={14} />
                    <span>Export to Word (.docx)</span>
                  </button>
                </div>
              )}
            </div>
          )}

        {/* Compare Screen */}
        {groupId === 'doc-compare' && (
          <div className="doc-compare-pane">
            <div className="compare-grid">
              <div className="compare-col">
                <label className="editor-label">Original Document (Revision A):</label>
                <textarea
                  className="doc-text-editor compare-editor"
                  value={docOriginal}
                  onChange={(e) => setDocOriginal(e.target.value)}
                />
              </div>
              <div className="compare-col">
                <label className="editor-label">Modified Document (Revision B):</label>
                <textarea
                  className="doc-text-editor compare-editor"
                  value={docModified}
                  onChange={(e) => setDocModified(e.target.value)}
                />
              </div>
            </div>

            <button
              className="tool-btn primary"
              onClick={handleCompareDiff}
              style={{ alignSelf: 'flex-start' }}
            >
              Compare Documents
            </button>

            {diffChanges && (
              <div className="diff-results-card">
                <h4 className="diff-card-title">Document Difference (Red = Removed, Green = Added)</h4>
                <div className="diff-pre-box">
                  {diffChanges.map((c, i) => (
                    <span
                      key={i}
                      className={`diff-chunk ${c.added ? 'added' : c.removed ? 'removed' : 'unchanged'}`}
                    >
                      {c.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result Screen */}
        {outputResult && (
          <ResultViewer
            title={`${toolName} Complete`}
            outputName={outputResult.fileName}
            outputBuffer={outputResult.buffer}
            outputText={outputResult.text}
            defaultExtension={outputResult.ext}
            onReset={handleReset}
          />
        )}

        {errorMsg && (
          <ErrorPanel
            title="Operation Error"
            message={errorMsg}
            onRetry={handleConvertOrExport}
            onChooseAnother={handleReset}
          />
        )}
      </div>
    </ToolLayout>
  );
};
