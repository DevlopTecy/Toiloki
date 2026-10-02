import React from 'react';
import { RotateCcw } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '../../../../core/services/settings.service';

interface HistorySectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const handleReset = () => {
    onUpdateSettings({
      keepHistory: DEFAULT_SETTINGS.keepHistory,
      retentionDays: DEFAULT_SETTINGS.retentionDays,
      clearOnExit: DEFAULT_SETTINGS.clearOnExit,
    });
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Operation History</h2>
          <p className="settings-section-desc">
            Manage operation logs, task tracking policies, and automated purge retention.
          </p>
        </div>
        <button
          type="button"
          className="settings-ghost-reset-btn"
          onClick={handleReset}
          title="Reset history section"
        >
          <RotateCcw size={13} />
          <span>Reset section</span>
        </button>
      </div>

      {/* ─── 1. LOG COMPLETED OPERATIONS ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Log completed operations</label>
          <span className="settings-helper">Record tool names, file counts, and timestamps in local history.</span>
        </div>
        <label className="settings-switch">
          <input
            type="checkbox"
            checked={settings.keepHistory}
            onChange={(e) => onUpdateSettings({ keepHistory: e.target.checked })}
          />
          <span className="settings-switch-label">
            {settings.keepHistory ? 'Active logging' : 'Logging disabled'}
          </span>
        </label>
      </div>

      {/* ─── 2. RETENTION PERIOD ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">History retention period</label>
          <span className="settings-helper">Automatically purge log records older than the selected threshold.</span>
        </div>
        <select
          className="settings-select"
          value={settings.retentionDays}
          onChange={(e) => onUpdateSettings({ retentionDays: e.target.value })}
          disabled={!settings.keepHistory}
        >
          <option value="7">7 Days</option>
          <option value="30">30 Days (Default)</option>
          <option value="90">90 Days</option>
          <option value="forever">Indefinite (Keep forever)</option>
        </select>
      </div>

      {/* ─── 3. CLEAR ON EXIT ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Purge on application exit</label>
          <span className="settings-helper">Automatically wipe recent history and session files whenever Toiloki is closed.</span>
        </div>
        <label className="settings-switch">
          <input
            type="checkbox"
            checked={settings.clearOnExit}
            onChange={(e) => onUpdateSettings({ clearOnExit: e.target.checked })}
          />
          <span className="settings-switch-label">
            {settings.clearOnExit ? 'Purge on exit' : 'Keep session history'}
          </span>
        </label>
      </div>
    </div>
  );
};
