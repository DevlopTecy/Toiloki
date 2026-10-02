import React, { useState } from 'react';
import { Trash2, Clock, RotateCw, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { HistoryService, HistoryRecord } from '../../core/services/history.service';
import './HistoryView.css';

interface HistoryViewProps {
  onOpenUtility?: (workspaceId: any, groupId: string, utilityId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onOpenUtility }) => {
  const [filterText, setFilterText] = useState('');
  const [records, setRecords] = useState<HistoryRecord[]>(() => HistoryService.getRecords());

  React.useEffect(() => {
    HistoryService.verifyOutputExistence().then((verified) => {
      setRecords(verified);
    });
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem('toiloki_history_v2');
    setRecords([]);
  };

  const handleRemoveRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem('toiloki_history_v2', JSON.stringify(updated));
  };

  const handleRepeatOperation = (rec: HistoryRecord) => {
    onOpenUtility?.(rec.workspaceId, rec.groupId, rec.utilityId);
  };

  const filteredRecords = records.filter(
    (r) =>
      r.toolName.toLowerCase().includes(filterText.toLowerCase()) ||
      r.input.toLowerCase().includes(filterText.toLowerCase()) ||
      r.output.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="history-view-container">
      <div className="history-header">
        <div>
          <h2 className="section-title">Operation History</h2>
          <p className="history-subtitle">
            Local session records only. No file contents or documents are ever retained.
          </p>
        </div>

        {records.length > 0 && (
          <div className="history-header-actions">
            <div className="history-filter-box">
              <input
                type="text"
                placeholder="Filter history..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <button className="clear-history-btn" onClick={handleClearHistory}>
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {records.length === 0 ? (
        <div className="history-empty">
          <Clock size={32} color="var(--text-muted)" />
          <p>No recent operations recorded.</p>
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th className="col-status">Status</th>
                <th className="col-tool">Utility</th>
                <th className="col-input">Input</th>
                <th className="col-output">Output</th>
                <th className="col-date">Date / Time</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="history-table-row">
                  <td className="col-status">
                    <StatusBadge status={rec.status === 'idle' ? 'waiting' : rec.status} />
                  </td>
                  <td className="col-tool font-medium">
                    {rec.toolName}
                  </td>
                  <td className="col-input" title={rec.input}>
                    <span className="truncate-text">{rec.input}</span>
                  </td>
                  <td className="col-output" title={rec.output}>
                    <span className="truncate-text font-mono">{rec.output}</span>
                    {rec.outputExists === false && (
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--accent-warning)', marginTop: '2px' }}>
                        (Result no longer exists)
                      </span>
                    )}
                  </td>
                  <td className="col-date font-muted">
                    {rec.timestamp}
                  </td>
                  <td className="col-actions">
                    <div className="history-row-actions">
                      <button
                        className="hist-action-btn"
                        onClick={() => handleRepeatOperation(rec)}
                        title="Open Utility"
                      >
                        <ExternalLink size={13} />
                        <span>Open</span>
                      </button>
                      <button
                        className="hist-action-btn"
                        onClick={() => handleRepeatOperation(rec)}
                        title="Repeat Operation"
                      >
                        <RotateCw size={13} />
                        <span>Repeat</span>
                      </button>
                      <button
                        className="hist-action-btn delete"
                        onClick={() => handleRemoveRecord(rec.id)}
                        title="Remove Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
