import React, { useState } from 'react';
import { ShieldCheck, RotateCcw, Trash2, Check } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '../../../../core/services/settings.service';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { Button } from '../../../common/Button';

interface HistoryPrivacySectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const HistoryPrivacySection: React.FC<HistoryPrivacySectionProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const handleReset = () => {
    onUpdateSettings({
      keepHistory: DEFAULT_SETTINGS.keepHistory,
      retentionDays: DEFAULT_SETTINGS.retentionDays,
      clearOnExit: DEFAULT_SETTINGS.clearOnExit,
      logLevel: DEFAULT_SETTINGS.logLevel,
      showSavingsSummary: DEFAULT_SETTINGS.showSavingsSummary,
    });
  };

  const handleConfirmClear = () => {
    try {
      localStorage.removeItem('toiloki_history_v2');
      localStorage.removeItem('toiloki_history_records');
      localStorage.removeItem('toiloki_recent_utilities');
      localStorage.removeItem('toiloki_favorites');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('toiloki_last_utility_') || k.startsWith('toiloki_temp_') || k.startsWith('toiloki_cache_'))) {
          localStorage.removeItem(k);
        }
      }
    } catch (err) {
      console.error('Failed to clear local data:', err);
    }
    setClearedNotice('Local cache, favorites, and task history have been cleared.');
    setIsConfirmingClear(false);
    setTimeout(() => setClearedNotice(null), 3000);
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">History & Privacy</h2>
          <p className="settings-section-desc">
            Manage local operation records, retention schedules, and local privacy governance.
          </p>
        </div>
        <button
          type="button"
          className="settings-ghost-reset-btn"
          onClick={handleReset}
          title="Reset history and privacy section"
        >
          <RotateCcw size={13} />
          <span>Reset section</span>
        </button>
      </div>

      {/* ─── 1. SHIELD LINE (No green guarantee box) ─── */}
      <div className="settings-shield-line">
        <ShieldCheck size={16} />
        <span>Everything runs on this device. No telemetry.</span>
      </div>

      {/* ─── 2. LOG COMPLETED OPERATIONS ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Log completed operations</label>
          <span className="settings-helper">Record tool names, file counts, and timestamps in local history.</span>
        </div>
        <ToggleSwitch
          checked={settings.keepHistory}
          onChange={(checked) => onUpdateSettings({ keepHistory: checked })}
          aria-label="Log completed operations"
        />
      </div>

      {/* ─── 3. RETENTION PERIOD ─── */}
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

      {/* ─── 4. PURGE ON EXIT ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Purge on application exit</label>
          <span className="settings-helper">Automatically wipe recent history and session files whenever Toiloki is closed.</span>
        </div>
        <ToggleSwitch
          checked={settings.clearOnExit}
          onChange={(checked) => onUpdateSettings({ clearOnExit: checked })}
          aria-label="Purge on application exit"
        />
      </div>

      {/* ─── 5. LOCAL ERROR DIAGNOSTICS ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Local error diagnostics</label>
          <span className="settings-helper">Save unhandled exception stack traces to local app data only.</span>
        </div>
        <ToggleSwitch
          checked={settings.logLevel !== 'off'}
          onChange={(checked) => onUpdateSettings({ logLevel: checked ? 'info' : 'off' })}
          aria-label="Local error diagnostics"
        />
      </div>

      {/* ─── 5B. STORAGE SAVINGS SUMMARY ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Storage savings summary</label>
          <span className="settings-helper">Display a local-only summary of disk space saved on the Home dashboard. Off by default.</span>
        </div>
        <ToggleSwitch
          checked={settings.showSavingsSummary ?? false}
          onChange={(checked) => onUpdateSettings({ showSavingsSummary: checked })}
          aria-label="Storage savings summary"
        />
      </div>

      {/* ─── 6. CLEAR LOCAL DATA & CACHE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Wipe local data & cache</label>
          <span className="settings-helper">Purge cached temporary files, recent activity records, and session history.</span>
        </div>

        <div>
          {!isConfirmingClear ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsConfirmingClear(true)}
            >
              <Trash2 size={13} style={{ marginRight: '6px' }} />
              Clear local data...
            </Button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--danger)' }}>
                Are you sure?
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmClear}
                style={{ backgroundColor: 'var(--danger)' }}
              >
                Confirm wipe
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmingClear(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {clearedNotice && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={14} color="var(--accent)" />
          <span>{clearedNotice}</span>
        </div>
      )}
    </div>
  );
};
