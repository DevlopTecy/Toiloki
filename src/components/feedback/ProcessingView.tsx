import React from 'react';
import {
  Loader2,
  Clock,
  Cog,
  CheckCircle2,
  AlertTriangle,
  Ban,
  X,
} from 'lucide-react';
import './ProcessingView.css';

export type ProcessingState =
  | 'waiting'
  | 'preparing'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface ProcessingViewProps {
  state?: ProcessingState;
  title: string; // e.g. "Compressing PDF..."
  currentFile?: string; // e.g. "annual_report.pdf"
  currentStage?: string; // e.g. "Downsampling images page 3 of 12..."
  percent?: number; // 0 to 100
  batchCurrent?: number; // e.g. 3
  batchTotal?: number; // e.g. 8
  onCancel?: () => void;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  state = 'processing',
  title,
  currentFile,
  currentStage,
  percent = 0,
  batchCurrent,
  batchTotal,
  onCancel,
}) => {
  const roundedPercent = Math.min(100, Math.max(0, Math.round(percent)));

  const getStateIcon = () => {
    switch (state) {
      case 'waiting':
        return <Clock size={16} className="state-icon waiting" />;
      case 'preparing':
        return <Cog size={16} className="state-icon preparing spin-slow" />;
      case 'completed':
        return <CheckCircle2 size={16} className="state-icon completed" />;
      case 'failed':
        return <AlertTriangle size={16} className="state-icon failed" />;
      case 'cancelled':
        return <Ban size={16} className="state-icon cancelled" />;
      case 'processing':
      default:
        return <Loader2 size={16} className="state-icon processing spin" />;
    }
  };

  const getStateLabel = () => {
    switch (state) {
      case 'waiting':
        return 'Waiting in queue';
      case 'preparing':
        return 'Preparing buffers';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      case 'processing':
      default:
        return 'Processing locally';
    }
  };

  return (
    <div className="toiloki-processing-card" role="status" aria-live="polite">
      <div className="processing-header-row">
        <div className="processing-title-group">
          {getStateIcon()}
          <div>
            <h4 className="processing-operation-title">{title}</h4>
            <span className="processing-state-badge">{getStateLabel()}</span>
          </div>
        </div>

        {batchTotal && batchTotal > 1 && (
          <div className="processing-batch-badge">
            File {batchCurrent || 1} of {batchTotal}
          </div>
        )}
      </div>

      {currentFile && (
        <div className="processing-file-row">
          <span className="file-label">Current File:</span>
          <span className="file-name" title={currentFile}>{currentFile}</span>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="processing-progress-track">
        <div
          className={`processing-progress-fill state-${state}`}
          style={{ width: `${state === 'completed' ? 100 : roundedPercent}%` }}
        />
      </div>

      <div className="processing-footer-row">
        <span className="processing-stage-text">
          {currentStage || 'Calculating local transform...'}
        </span>
        <span className="processing-percent-text">{roundedPercent}%</span>
      </div>

      {onCancel && state === 'processing' && (
        <div className="processing-cancel-row">
          <button className="tool-btn secondary small-btn" onClick={onCancel} type="button">
            <X size={12} />
            <span>Cancel Operation</span>
          </button>
        </div>
      )}
    </div>
  );
};
