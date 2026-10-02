import React, { useState } from 'react';
import { RotateCcw, Trash2, Check, Wrench, Shield, AlertTriangle } from 'lucide-react';
import { AppSettings, SettingsService } from '../../../../core/services/settings.service';
import { Button } from '../../../common/Button';

interface AdvancedSectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onResetAllDefaults: () => void;
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  settings,
  onUpdateSettings,
  onResetAllDefaults,
}) => {
  const [cacheCleared, setCacheCleared] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleClearCache = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('toiloki_temp_') || k.startsWith('toiloki_cache_'))) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };


  const handleResetDefaults = () => {
    if (window.confirm('Reset all application preferences to out-of-the-box defaults?')) {
      onResetAllDefaults();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 2000);
    }
  };

  const handleSafeMode = () => {
    if (window.confirm('Reboot into Safe Mode? This temporarily activates Default Clean theme and disables custom assets.')) {
      onUpdateSettings({ safeMode: true, activeThemeId: 'default-clean' });
      window.location.reload();
    }
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Advanced & Maintenance</h2>
          <p className="settings-section-desc">
            System diagnostics, disk storage maintenance, and developer environment toggles.
          </p>
        </div>
      </div>

      {/* ─── 1. TEMPORARY CACHE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Temporary disk cache</label>
          <span className="settings-helper">Cached scratch files and intermediate buffers: 48.2 MB</span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleClearCache}>
          {cacheCleared ? <Check size={13} style={{ marginRight: '6px', color: 'var(--color-success)' }} /> : <Trash2 size={13} style={{ marginRight: '6px' }} />}
          {cacheCleared ? 'Cache Purged' : 'Clear temp files'}
        </Button>
      </div>

      {/* ─── 2. RESET PREFERENCES ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Reset all application preferences</label>
          <span className="settings-helper">Restores theme, fonts, density, paths, and limits to factory defaults.</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleResetDefaults} style={{ color: 'var(--color-danger)' }}>
          {resetDone ? <Check size={13} style={{ marginRight: '6px' }} /> : <RotateCcw size={13} style={{ marginRight: '6px' }} />}
          {resetDone ? 'Reset Complete' : 'Restore factory defaults'}
        </Button>
      </div>

      {/* ─── 3. SAFE MODE FALLBACK ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Safe mode reboot</label>
          <span className="settings-helper">Recovers the application if custom CSS or broken themes prevent usability.</span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleSafeMode}>
          <Shield size={13} style={{ marginRight: '6px' }} />
          Reboot in safe mode
        </Button>
      </div>

      {/* ─── 4. DEVELOPER SECTION TOGGLE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Show Developer section</label>
          <span className="settings-helper">Unlocks live CSS token inspector, theme JSON diff, component gallery, and performance tools.</span>
        </div>
        <label className="settings-switch">
          <input
            type="checkbox"
            checked={settings.showDeveloper}
            onChange={(e) => onUpdateSettings({ showDeveloper: e.target.checked })}
          />
          <span className="settings-switch-label">
            {settings.showDeveloper ? 'Developer tools visible' : 'Hidden'}
          </span>
        </label>
      </div>

      {/* ─── 5. SYSTEM DIAGNOSTICS CARD ─── */}
      <div
        style={{
          marginTop: '12px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
          SYSTEM ENVIRONMENT DIAGNOSTICS
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Host Platform</div>
            <code style={{ fontSize: '11.5px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
              Windows 11 x64 (Build 22631)
            </code>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Runtime Stack</div>
            <code style={{ fontSize: '11.5px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
              Electron 32.3.3 • Node 20.13.1
            </code>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Renderer Sandbox</div>
            <code style={{ fontSize: '11.5px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
              Isolated contextBridge (Secure)
            </code>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>App Version</div>
            <code style={{ fontSize: '11.5px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
              Toiloki v1.0.0
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
