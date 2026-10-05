import React, { useState } from 'react';
import { ShieldCheck, Trash2, Check, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../../../../core/services/settings.service';
import { Button } from '../../../common/Button';

interface PrivacySectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const handleConfirmClear = () => {
    try {
      localStorage.removeItem('toiloki_history_v2');
      localStorage.removeItem('toiloki_recent_utilities');
      localStorage.removeItem('toiloki_favorites');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('toiloki_last_utility_') || k.startsWith('toiloki_temp_'))) {
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
          <h2 className="settings-section-title">Privacy & Local Governance</h2>
          <p className="settings-section-desc">
            Toiloki operates strictly on your local machine with zero external network transmission.
          </p>
        </div>
      </div>

      {/* ─── 1. PRIVACY GUARANTEE BANNER ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          backgroundColor: 'var(--success-bg)',
          border: '1px solid var(--success)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
        }}
      >
        <ShieldCheck size={26} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: 600, color: 'var(--success)' }}>
            100% Local Execution Guarantee
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            All operations — PDF manipulation, image conversions, code formatting, table transformations,
            and cryptographic hashing — execute entirely inside your device's memory. No telemetry,
            documents, or personal analytics ever leave your computer.
          </p>
        </div>
      </div>

      {/* ─── 2. TELEMETRY STATUS ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Telemetry & cloud analytics</label>
          <span className="settings-helper">Strictly zero remote beacons, pings, or event tracking.</span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '3px 8px',
            backgroundColor: 'var(--surface-hover)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-2)',
            border: '1px solid var(--border)',
          }}
        >
          Permanently Disabled
        </span>
      </div>

      {/* ─── 3. LOCAL CRASH LOGS ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Local error diagnostics</label>
          <span className="settings-helper">Save unhandled exception stack traces to your local app data directory only.</span>
        </div>
        <label className="settings-switch">
          <input
            type="checkbox"
            checked={settings.logLevel !== 'off'}
            onChange={(e) => onUpdateSettings({ logLevel: e.target.checked ? 'info' : 'off' })}
          />
          <span className="settings-switch-label">
            {settings.logLevel !== 'off' ? 'Store crash logs locally' : 'Disabled'}
          </span>
        </label>

      </div>

      {/* ─── 4. CLEAR LOCAL DATA & CACHE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Wipe local cache & history</label>
          <span className="settings-helper">Purge cached temporary files, recent activity records, and session cookies.</span>
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
                Yes, clear data
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

          {clearedNotice && (
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--success)', marginTop: '6px' }}>
              ✓ {clearedNotice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
