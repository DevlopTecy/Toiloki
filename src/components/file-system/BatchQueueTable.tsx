import React from 'react';
import { Play, XSquare, RotateCcw, Trash2, File, CheckCircle2 } from 'lucide-react';
import { StatusBadge, StatusType } from '../common/StatusBadge';
import './BatchQueueTable.css';

export interface BatchItem {
  id: string;
  name: string;
  size: number;
  status: StatusType;
  progressPercent: number; // 0-100
  resultSummary?: string;
  error?: string;
}

interface BatchQueueTableProps {
  items: BatchItem[];
  isProcessing: boolean;
  onStart: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onClear: () => void;
  onRemoveItem: (id: string) => void;
}

export const BatchQueueTable: React.FC<BatchQueueTableProps> = ({
  items,
  isProcessing,
  onStart,
  onCancel,
  onRetry,
  onClear,
  onRemoveItem,
}) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;

  return (
    <div className="batch-queue-container">
      <div className="batch-queue-header">
        <div className="batch-header-left">
          <h4 className="batch-queue-title">Batch Processing Queue</h4>
          <span className="batch-counts">
            {items.length} items ({completedCount} completed{failedCount > 0 ? `, ${failedCount} failed` : ''})
          </span>
        </div>

        <div className="batch-controls-group">
          {!isProcessing ? (
            <button
              className="batch-btn primary"
              onClick={onStart}
              disabled={items.length === 0 || completedCount === items.length}
            >
              <Play size={13} />
              <span>Start Batch</span>
            </button>
          ) : (
            <button className="batch-btn danger" onClick={onCancel}>
              <XSquare size={13} />
              <span>Cancel</span>
            </button>
          )}

          {failedCount > 0 && !isProcessing && (
            <button className="batch-btn secondary" onClick={onRetry} title="Retry failed items">
              <RotateCcw size={13} />
              <span>Retry Failed</span>
            </button>
          )}

          <button
            className="batch-btn text"
            onClick={onClear}
            disabled={isProcessing || items.length === 0}
            title="Clear list"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="batch-table-wrapper">
        <table className="batch-table">
          <thead>
            <tr>
              <th className="col-file">File Name</th>
              <th className="col-size">Size</th>
              <th className="col-status">Status</th>
              <th className="col-progress">Progress</th>
              <th className="col-result">Result</th>
              <th className="col-action"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={`batch-row status-${item.status}`}>
                <td className="col-file">
                  <div className="file-cell">
                    <File size={15} className="file-icon" />
                    <span className="file-name" title={item.name}>{item.name}</span>
                  </div>
                </td>
                <td className="col-size">{formatSize(item.size)}</td>
                <td className="col-status">
                  <StatusBadge status={item.status} size="sm" />
                </td>
                <td className="col-progress">
                  <div className="progress-cell">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <span className="progress-num">{item.progressPercent}%</span>
                  </div>
                </td>
                <td className="col-result">
                  {item.status === 'completed' && (
                    <span className="result-text success">
                      <CheckCircle2 size={12} />
                      <span>{item.resultSummary || 'Ready'}</span>
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <span className="result-text error" title={item.error}>
                      {item.error || 'Failed'}
                    </span>
                  )}
                  {item.status === 'waiting' && <span className="result-text muted">Queued</span>}
                  {item.status === 'processing' && <span className="result-text active">Working...</span>}
                </td>
                <td className="col-action">
                  {!isProcessing && (
                    <button
                      className="row-remove-btn"
                      onClick={() => onRemoveItem(item.id)}
                      title="Remove from queue"
                    >
                      &times;
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
