import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  FolderOpen,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Eye,
  RefreshCw,
  FileText,
  Table,
  Image as ImageIcon,
  RotateCcw,
  Share2,
  ChevronDown,
} from 'lucide-react';
import { RenameDialog } from '../common/RenameDialog';
import { ConflictDialog } from '../common/ConflictDialog';
import { PipeService, PipeTargetOption } from '../../core/services/pipe.service';
import { WorkspaceId } from '../../core/types/workspace';
import './ResultViewer.css';

export interface BatchStats {
  total: number;
  completed: number;
  failed: number;
  failedItems?: Array<{ name: string; error?: string }>;
}

export interface DimensionStats {
  width: number;
  height: number;
}

export interface DataStats {
  rows?: number;
  columns?: number;
  format?: string;
}

interface ResultViewerProps {
  title?: string;
  outputName?: string;
  outputBuffer?: Uint8Array;
  outputText?: string;
  originalSize?: number;
  outputSize?: number;
  elapsedMs?: number;
  defaultExtension?: string;
  inputFormat?: string;
  outputFormat?: string;
  originalDimensions?: DimensionStats;
  newDimensions?: DimensionStats;
  dataStats?: DataStats;
  batchStats?: BatchStats;
  onPreview?: () => void;
  onReset?: () => void;
  onRetryFailed?: () => void;
  onViewErrors?: () => void;
  onSaveBatch?: () => void;
  onSendTo?: (workspaceId: WorkspaceId, groupId: string, utilityId: string) => void;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({
  title = 'Processing Complete',
  outputName = 'output_result',
  outputBuffer,
  outputText,
  originalSize,
  outputSize,
  defaultExtension = 'bin',
  elapsedMs,
  inputFormat,
  outputFormat,
  originalDimensions,
  newDimensions,
  dataStats,
  batchStats,
  onPreview,
  onReset,
  onRetryFailed,
  onViewErrors,
  onSaveBatch,
  onSendTo,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentFileName, setCurrentFileName] = useState(outputName);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [pendingSavePath, setPendingSavePath] = useState<string | null>(null);
  const [isSendToOpen, setIsSendToOpen] = useState(false);

  const compatibleTargets = PipeService.getCompatibleTargets({
    format: outputFormat || defaultExtension,
    hasBuffer: !!outputBuffer,
    hasText: !!outputText,
  });

  const handlePipeToTarget = (target: PipeTargetOption) => {
    setIsSendToOpen(false);
    PipeService.pipeToUtility(target.utilityId, {
      text: outputText,
      buffer: outputBuffer,
      fileName: currentFileName,
      format: outputFormat || defaultExtension,
      sourceUtilityName: title,
    });
    if (onSendTo) {
      onSendTo(target.workspaceId, target.groupId, target.utilityId);
    } else {
      window.dispatchEvent(
        new CustomEvent('toiloki-navigate-utility', {
          detail: {
            workspaceId: target.workspaceId,
            groupId: target.groupId,
            utilityId: target.utilityId,
          },
        })
      );
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isPartialSuccess = batchStats && batchStats.failed > 0 && batchStats.completed > 0;
  const isFullBatchSuccess = batchStats && batchStats.failed === 0;

  const handleCopyText = async () => {
    if (outputText) {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  React.useEffect(() => {
    const handleCopyEvent = () => {
      if (outputText) {
        handleCopyText();
      }
    };
    window.addEventListener('toiloki-trigger-copy-result', handleCopyEvent);
    return () => window.removeEventListener('toiloki-trigger-copy-result', handleCopyEvent);
  }, [outputText]);

  const executeSave = async (filePath: string) => {
    try {
      if (outputBuffer) {
        await window.toiloki?.fs.writeFileBuffer(filePath, outputBuffer);
      } else if (outputText) {
        await window.toiloki?.fs.writeFileText(filePath, outputText);
      }
      setSavedPath(filePath);
    } catch (err) {
      console.error('Failed to save file buffer:', err);
    }
  };

  const handleSaveAs = async () => {
    if (batchStats && onSaveBatch) {
      onSaveBatch();
      return;
    }

    setIsSaving(true);
    try {
      const ext = (outputFormat || defaultExtension).replace(/^\./, '');
      const defaultFilename = currentFileName.includes('.')
        ? currentFileName
        : `${currentFileName}.${ext}`;

      if (window.toiloki?.dialog) {
        const saveRes = await window.toiloki.dialog.saveFile({
          title: 'Save Processed File',
          defaultPath: defaultFilename,
          filters: [{ name: `${ext.toUpperCase()} File`, extensions: [ext] }],
        });

        if (!saveRes.canceled && saveRes.filePath) {
          // Check if file exists to demonstrate conflict dialog if needed
          const stats = await window.toiloki.fs.getStats(saveRes.filePath).catch(() => ({ exists: false }));
          if (stats && stats.exists) {
            setPendingSavePath(saveRes.filePath);
            setIsConflictOpen(true);
          } else {
            await executeSave(saveRes.filePath);
          }
        }
      } else {
        // Browser fallback download
        const blob = outputBuffer
          ? new Blob([outputBuffer])
          : new Blob([outputText || ''], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Conflict dialog resolution handlers
  const handleConflictReplace = async () => {
    setIsConflictOpen(false);
    if (pendingSavePath) {
      await executeSave(pendingSavePath);
      setPendingSavePath(null);
    }
  };

  const handleConflictCreateNewName = async () => {
    setIsConflictOpen(false);
    if (pendingSavePath) {
      const dotIdx = pendingSavePath.lastIndexOf('.');
      const newPath =
        dotIdx !== -1
          ? `${pendingSavePath.slice(0, dotIdx)} (1)${pendingSavePath.slice(dotIdx)}`
          : `${pendingSavePath} (1)`;
      await executeSave(newPath);
      setPendingSavePath(null);
    }
  };

  const handleConflictChooseLocation = () => {
    setIsConflictOpen(false);
    setPendingSavePath(null);
    handleSaveAs();
  };

  const handleShowInFolder = () => {
    if (savedPath && window.toiloki?.shell) {
      window.toiloki.shell.showInFolder(savedPath);
    }
  };

  const handleOpenPath = () => {
    if (savedPath && window.toiloki?.shell) {
      window.toiloki.shell.openPath(savedPath);
    }
  };

  const sizeDiff = originalSize && outputSize ? originalSize - outputSize : 0;
  const percentSaved =
    originalSize && originalSize > 0 && outputSize
      ? Math.round(((originalSize - outputSize) / originalSize) * 100)
      : 0;

  return (
    <div className="toiloki-result-panel" role="region" aria-label="Processing Result">
      {/* Header Row */}
      <div className="result-panel-header">
        <div className="result-header-status">
          {isPartialSuccess ? (
            <AlertTriangle size={24} className="icon-warning" />
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="self-drawing-check"
              aria-label="Success"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="var(--success)"
                strokeWidth="2"
                strokeDasharray="76"
                strokeDashoffset="76"
                className="draw-circle"
              />
              <path
                d="M8 12.5l2.5 2.5L16 9"
                stroke="var(--success)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="24"
                strokeDashoffset="24"
                className="draw-check"
              />
            </svg>
          )}
          <div>
            <h4 className="result-title">
              {batchStats
                ? `${batchStats.completed} of ${batchStats.total} files completed`
                : title}
            </h4>
            {elapsedMs && <span className="result-elapsed">{elapsedMs}ms elapsed</span>}
          </div>
        </div>

        {/* Batch Status Badges */}
        {batchStats && (
          <div className="result-batch-stats-badges">
            <span className="batch-pill success">
              <Check size={11} /> {batchStats.completed} Completed
            </span>
            {batchStats.failed > 0 && (
              <span className="batch-pill danger">
                <AlertTriangle size={11} /> {batchStats.failed} Failed
              </span>
            )}
          </div>
        )}
      </div>

      {/* File row & rename trigger (Single file mode) */}
      {!batchStats && (
        <div className="result-filename-bar">
          <div className="filename-info">
            <span className="meta-label">Output:</span>
            <span className="filename-text" title={currentFileName}>
              {currentFileName}
            </span>
            <button
              className="action-icon-btn"
              onClick={() => setIsRenameOpen(true)}
              title="Rename file"
              type="button"
            >
              <Edit2 size={12} />
            </button>
          </div>
          <span className="format-tag">
            {(outputFormat || defaultExtension).toUpperCase()}
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="result-metrics-row">
        {/* File sizes */}
        {originalSize !== undefined && (
          <div className="metric-cell">
            <span className="metric-tag">Original Size</span>
            <span className="metric-number">{formatFileSize(originalSize)}</span>
          </div>
        )}

        {outputSize !== undefined && (
          <div className="metric-cell">
            <span className="metric-tag">New Size</span>
            <span className="metric-number">{formatFileSize(outputSize)}</span>
          </div>
        )}

        {percentSaved !== 0 && (
          <div className={`metric-cell ${percentSaved > 0 ? 'highlight-save' : ''}`}>
            <span className="metric-tag">
              {percentSaved > 0 ? 'Size Reduction' : 'Size Increase'}
            </span>
            <span className="metric-number">
              {percentSaved > 0 ? `-${percentSaved}%` : `+${Math.abs(percentSaved)}%`}
              {sizeDiff !== 0 && ` (${formatFileSize(Math.abs(sizeDiff))})`}
            </span>
          </div>
        )}

        {/* Format Conversions */}
        {inputFormat && outputFormat && (
          <div className="metric-cell">
            <span className="metric-tag">Conversion</span>
            <span className="metric-number">
              {inputFormat.toUpperCase()} → {outputFormat.toUpperCase()}
            </span>
          </div>
        )}

        {/* Image Dimensions */}
        {originalDimensions && (
          <div className="metric-cell">
            <span className="metric-tag">Original Res</span>
            <span className="metric-number">
              {originalDimensions.width} × {originalDimensions.height}
            </span>
          </div>
        )}
        {newDimensions && (
          <div className="metric-cell">
            <span className="metric-tag">New Res</span>
            <span className="metric-number">
              {newDimensions.width} × {newDimensions.height}
            </span>
          </div>
        )}

        {/* Data Stats */}
        {dataStats && (
          <>
            {dataStats.rows !== undefined && (
              <div className="metric-cell">
                <span className="metric-tag">Rows</span>
                <span className="metric-number">{dataStats.rows}</span>
              </div>
            )}
            {dataStats.columns !== undefined && (
              <div className="metric-cell">
                <span className="metric-tag">Columns</span>
                <span className="metric-number">{dataStats.columns}</span>
              </div>
            )}
            {dataStats.format && (
              <div className="metric-cell">
                <span className="metric-tag">Format</span>
                <span className="metric-number">{dataStats.format.toUpperCase()}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Primary Actions Row */}
      <div className="result-action-controls">
        {/* Single File Save / Batch Save (with subtle attention nudge) */}
        <button
          className="tool-btn primary result-download-nudge"
          onClick={handleSaveAs}
          disabled={isSaving}
          type="button"
        >
          <Download size={13} />
          <span>{batchStats ? 'Save Results' : isSaving ? 'Saving...' : 'Save'}</span>
        </button>
        <span className="result-trust-note">Your original file isn't changed</span>

        {/* Preview action */}
        {onPreview && (
          <button className="tool-btn secondary" onClick={onPreview} type="button">
            <Eye size={13} />
            <span>Preview</span>
          </button>
        )}

        {/* Copy text if text exists */}
        {outputText && (
          <button className="tool-btn secondary" onClick={handleCopyText} type="button">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}

        {/* Use in... compatible utility button & menu */}
        {compatibleTargets.length > 0 && (
          <div className="send-to-container">
            <button
              className="tool-btn secondary"
              onClick={() => setIsSendToOpen(!isSendToOpen)}
              type="button"
              title="Pass output directly into another compatible utility"
              aria-label="Use in compatible utility"
            >
              <Share2 size={13} />
              <span>Use in...</span>
              <ChevronDown size={11} style={{ opacity: 0.7 }} />
            </button>

            {isSendToOpen && (
              <div className="send-to-menu">
                <div className="send-to-menu-header">Use Output In:</div>
                {compatibleTargets.map((target) => (
                  <button
                    key={`${target.workspaceId}-${target.utilityId}`}
                    type="button"
                    className="send-to-item-btn"
                    onClick={() => handlePipeToTarget(target)}
                  >
                    <span className="send-to-item-title">{target.name}</span>
                    <span className="send-to-item-desc">{target.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Partial Success actions: Retry Failed, View Errors */}
        {isPartialSuccess && (
          <>
            {onRetryFailed && (
              <button className="tool-btn secondary" onClick={onRetryFailed} type="button">
                <RotateCcw size={13} />
                <span>Retry Failed</span>
              </button>
            )}
            {onViewErrors && (
              <button className="tool-btn secondary" onClick={onViewErrors} type="button">
                <AlertTriangle size={13} />
                <span>View Errors</span>
              </button>
            )}
          </>
        )}

        {/* Open Location */}
        {savedPath && (
          <>
            <button className="tool-btn secondary" onClick={handleShowInFolder} type="button">
              <FolderOpen size={13} />
              <span>Open Location</span>
            </button>
            <button className="tool-btn secondary" onClick={handleOpenPath} type="button">
              <ExternalLink size={13} />
              <span>Open</span>
            </button>
          </>
        )}

        {/* Process Another */}
        {onReset && (
          <button className="tool-btn secondary" onClick={onReset} type="button">
            <RefreshCw size={13} />
            <span>Process Another</span>
          </button>
        )}
      </div>

      {/* Saved path footer indicator */}
      {savedPath && (
        <div className="saved-path-bar">
          <span className="saved-label">Saved to:</span>
          <span className="saved-text" title={savedPath}>
            {savedPath}
          </span>
        </div>
      )}

      {/* Rename Dialog Modal */}
      <RenameDialog
        isOpen={isRenameOpen}
        currentName={currentFileName}
        onSave={(name) => {
          setCurrentFileName(name);
          setIsRenameOpen(false);
        }}
        onCancel={() => setIsRenameOpen(false)}
      />

      {/* Output Conflict Dialog Modal */}
      <ConflictDialog
        isOpen={isConflictOpen}
        fileName={pendingSavePath ? pendingSavePath.split(/[\\/]/).pop() || '' : currentFileName}
        onReplace={handleConflictReplace}
        onCreateNewName={handleConflictCreateNewName}
        onChooseLocation={handleConflictChooseLocation}
        onCancel={() => {
          setIsConflictOpen(false);
          setPendingSavePath(null);
        }}
      />
    </div>
  );
};
