import React from 'react';
import {
  Undo,
  Redo,
  RotateCcw,
  Download,
  Play,
  CheckCircle,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Button } from './Button';
import { SelectedFile } from '../file-system/FileDropzone';
import { plural } from '../../core/utils/plural';
import './ActionBar.css';

export interface ActionBarVersion {
  id: string;
  name: string;
  timestamp: number;
}

export interface ActionBarProps {
  files: SelectedFile[];
  versionStack?: ActionBarVersion[];
  versionIndex?: number;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset?: () => void;
  summaryText?: string;
  summaryTooltip?: string;
  isProcessing?: boolean;
  statusMessage?: string;
  progressPercent?: number;
  onCancelProcessing?: () => void;
  successResult?: boolean;
  successMessage?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  onDownload?: () => void;
  downloadLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  primaryActionIcon?: React.ReactNode;
  isPrimaryDisabled?: boolean;
  isPrimaryHidden?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  files,
  versionStack = [],
  versionIndex = -1,
  onUndo,
  onRedo,
  onReset,
  summaryText,
  summaryTooltip,
  isProcessing = false,
  statusMessage,
  progressPercent = 0,
  onCancelProcessing,
  successResult = false,
  successMessage,
  errorMessage = null,
  onRetry,
  onDownload,
  downloadLabel = 'Download result',
  onPrimaryAction,
  primaryActionLabel = 'Run',
  primaryActionIcon = <Play size={14} />,
  isPrimaryDisabled = false,
  isPrimaryHidden = false,
  className = '',
  children,
}) => {
  // Spec: Hidden when nothing is loaded (no "Merge 0 files")
  if (files.length === 0) {
    return null;
  }

  const hasMultipleVersions = versionStack.length > 1;
  const canUndo = versionIndex > 0;
  const canRedo = versionIndex < versionStack.length - 1;

  // Middle truncate helper for filename / summary text
  const truncateMiddle = (text: string, maxLength = 36): string => {
    if (!text || text.length <= maxLength) return text;
    const half = Math.floor((maxLength - 3) / 2);
    return `${text.slice(0, half)}...${text.slice(text.length - half)}`;
  };

  const defaultSummary = files[0]?.name ? truncateMiddle(files[0].name, 28) : '';
  const displaySummary = summaryText || defaultSummary;

  return (
    <footer className={`shared-action-bar ${className}`} role="toolbar" aria-label="Action bar">
      {/* ─── Zone 1: Left Controls (Undo, Redo, Reset, Summary, Version Chip) ─── */}
      <div className="action-bar-left">
        {onUndo && onRedo && (
          <div className="action-bar-history-group">
            <button
              type="button"
              className="action-bar-icon-btn"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo size={14} />
            </button>
            <button
              type="button"
              className="action-bar-icon-btn"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <Redo size={14} />
            </button>
          </div>
        )}

        {onReset && (
          <Button
            variant="ghost"
            size="compact"
            icon={<RotateCcw size={13} />}
            onClick={onReset}
            title="Reset workspace and clear files"
            className="action-bar-reset-btn"
          >
            Reset
          </Button>
        )}

        {/* Muted middle-truncated summary with tooltip */}
        {displaySummary && (
          <span
            className="action-bar-summary-text"
            title={summaryTooltip || summaryText || files[0]?.name || ''}
          >
            {displaySummary}
          </span>
        )}

        {/* Version chip: strictly only when more than one version exists */}
        {hasMultipleVersions && (
          <span
            className="action-bar-version-chip"
            title={`Version ${versionIndex + 1} of ${versionStack.length}: ${versionStack[versionIndex]?.name || ''}`}
          >
            v{versionIndex + 1}/{versionStack.length}
          </span>
        )}

        {children}
      </div>

      {/* ─── Zone 2: Center Status / Processing / Feedback ─── */}
      <div className="action-bar-center">
        {isProcessing && (
          <div className="action-bar-processing">
            <span className="action-bar-spinner" aria-label="Processing" />
            <span className="action-bar-status-msg">{statusMessage || 'Processing locally...'}</span>
            <div className="action-bar-progress-track">
              <div
                className="action-bar-progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
            {onCancelProcessing && (
              <button
                type="button"
                className="action-bar-cancel-btn"
                onClick={onCancelProcessing}
                title="Cancel processing"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {!isProcessing && successResult && (
          <div className="action-bar-toast action-bar-toast-success motion-fade-in">
            <CheckCircle size={14} className="action-bar-toast-icon" />
            <span>{successMessage || (hasMultipleVersions ? `${versionStack[versionIndex]?.name || 'Action'} applied.` : 'Ready.')}</span>
          </div>
        )}

        {!isProcessing && errorMessage && (
          <div className="action-bar-toast action-bar-toast-error motion-fade-in">
            <AlertTriangle size={14} className="action-bar-toast-icon" />
            <span>{errorMessage}</span>
            {onRetry && (
              <button type="button" className="action-bar-retry-btn" onClick={onRetry}>
                <RotateCw size={12} />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Zone 3: Right Actions (Download 36px, Primary Action 40px) ─── */}
      <div className="action-bar-right">
        {onDownload && (
          <Button
            variant="secondary"
            size="default"
            icon={<Download size={14} />}
            onClick={onDownload}
            title="Download result to disk. Your original file isn't changed."
            className="action-bar-download-btn"
          >
            {downloadLabel}
          </Button>
        )}

        {!isPrimaryHidden && onPrimaryAction && (
          <Button
            variant="primary"
            size="default"
            icon={primaryActionIcon}
            onClick={onPrimaryAction}
            disabled={isPrimaryDisabled || isProcessing}
            className="action-bar-primary-btn"
          >
            {primaryActionLabel}
          </Button>
        )}
      </div>
    </footer>
  );
};
