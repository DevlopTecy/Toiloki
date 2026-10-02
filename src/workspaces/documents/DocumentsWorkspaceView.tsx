import React, { useState } from 'react';
import { ToolLayout } from '../../components/common/ToolLayout';
import { FileDropzone, SelectedFile } from '../../components/file-system/FileDropzone';
import { ResultViewer } from '../../components/file-system/ResultViewer';
import { ErrorPanel } from '../../components/common/ErrorPanel';
import { DiffEngine, DiffChange } from '../../engines/diff/diff.engine';
import { TextEngine } from '../../engines/text/text.engine';
import { DocumentEngine } from '../../engines/documents/document.engine';
import { Download, RefreshCw, Copy, Check } from 'lucide-react';
import { HistoryService } from '../../core/services/history.service';
import './DocumentsWorkspaceView.css';

interface DocumentsWorkspaceViewProps {
  utilityId: string;
  featureId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const DocumentsWorkspaceView: React.FC<DocumentsWorkspaceViewProps> = ({
  utilityId,
  featureId,
  toolName,
  toolDescription,
  onBackToUtilities,
  isFavorite,
  onToggleFavorite,
}) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [editorText, setEditorText] = useState(
    '# Project Scope & Specifications\n\nToiloki is an offline, local-first utility suite designed for fast, everyday desktop tasks.\n\n## Core Principles\n- Zero cloud dependencies\n- Zero telemetry tracking\n- Complete document privacy\n'
  );
  const [findWord, setFindWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');
  const [replaceCount, setReplaceCount] = useState<number | null>(null);

  // Compare diff state
  const [docOriginal, setDocOriginal] = useState(
    '1. Introduction\nToiloki is a desktop utility application.\n2. Architecture\nModular Workspace -> Utility -> Feature -> Engine structure.\n3. Processing\nProcessed locally on the user machine.'
  );
  const [docModified, setDocModified] = useState(
    '1. Introduction\nToiloki is a high-performance Windows desktop utility application.\n2. Architecture\nModular Workspace -> Utility -> Feature -> Engine structure.\n3. Processing\nProcessed 100% locally with zero cloud dependencies.\n4. Distribution\nPackaged as standalone Windows portable executable.'
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

  const metrics = React.useMemo(() => {
    return TextEngine.analyzeText(editorText).data;
  }, [editorText]);

  const handleReset = () => {
    setFiles([]);
    setOutputResult(null);
    setErrorMsg(null);
    setDiffChanges(null);
    setReplaceCount(null);
  };

  const handleConvertOrExport = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      if (featureId.includes('export')) {
        let ext = 'txt';
        let content = editorText;
        if (featureId === 'export-html') {
          ext = 'html';
          const conv = DocumentEngine.markdownToHtml(editorText);
          if (conv.success && conv.data) content = conv.data;
        } else if (featureId === 'export-md') {
          ext = 'md';
        } else if (featureId === 'export-rtf') {
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
        // Converter feature
        if (files.length === 0) return;
        const f = files[0];
        let outText = '';
        let outExt = 'txt';
        const rawBuf = f.buffer || new Uint8Array();

        if (f.name.endsWith('.docx') && f.buffer) {
          if (featureId === 'docx-to-html') {
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
        utilityId,
        featureId,
        input: files[0]?.name || 'Document Editor Text',
        output: `Processed document (${featureId})`,
        status: 'completed',
      });
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
        {utilityId === 'doc-converter' && !outputResult && (
          <div className="doc-converter-pane">
            <FileDropzone
              accept={
                featureId === 'docx-to-pdf'
                  ? ['.docx', '.doc']
                  : featureId === 'pdf-to-docx'
                    ? ['.pdf']
                    : featureId === 'md-to-pdf-doc'
                      ? ['.md', '.markdown']
                      : featureId === 'html-to-pdf-doc'
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
                <span>{isProcessing ? 'Converting...' : `Convert to ${featureId === 'pdf-to-docx' ? 'DOCX' : 'PDF'}`}</span>
              </button>
            )}
          </div>
        )}

        {/* Document Editor Screen */}
        {(utilityId === 'doc-editor' || utilityId === 'doc-export') && !outputResult && (
          <div className="doc-editor-pane">
            {metrics && (
              <div className="doc-metrics-bar">
                <span className="doc-metric-item"><strong>{metrics.words}</strong> words</span>
                <span className="doc-metric-item"><strong>{metrics.characters}</strong> characters</span>
                <span className="doc-metric-item"><strong>{metrics.lines}</strong> lines</span>
                <span className="doc-metric-item"><strong>{metrics.paragraphs}</strong> paragraphs</span>
              </div>
            )}

            {featureId === 'find-replace' && (
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

            {utilityId === 'doc-export' && (
              <button
                className="tool-btn primary"
                onClick={handleConvertOrExport}
                style={{ alignSelf: 'flex-start' }}
              >
                <Download size={14} />
                <span>{toolName}</span>
              </button>
            )}
          </div>
        )}

        {/* Compare Screen */}
        {utilityId === 'doc-compare' && (
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
            title="Conversion Error"
            message={errorMsg}
            onRetry={handleConvertOrExport}
            onChooseAnother={handleReset}
          />
        )}
      </div>
    </ToolLayout>
  );
};
