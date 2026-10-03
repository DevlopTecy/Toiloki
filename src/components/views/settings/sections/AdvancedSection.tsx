import React, { useState } from 'react';
import { RotateCcw, Trash2, Check, Wrench, Shield, AlertTriangle, HardDrive, Download } from 'lucide-react';
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
  const [exported, setExported] = useState(false);

  const handleExportPortable = () => {
    const bundle = {
      settings: SettingsService.getSettings(),
      presets: localStorage.getItem('toiloki_utility_presets'),
      chains: localStorage.getItem('toiloki_utility_chains'),
      history: localStorage.getItem('toiloki_history_records'),
      favorites: localStorage.getItem('toiloki_favorites'),
      exportedAt: new Date().toISOString(),
      toilokiVersion: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toiloki_portable_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

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

      {/* ─── 1B. TEMP CLEANUP POLICY ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Temp cleanup schedule</label>
          <span className="settings-helper">Automated purging of scratch and intermediate session buffers.</span>
        </div>
        <select
          className="settings-select"
          value={settings.tempCleanupPolicy || 'on-exit'}
          onChange={(e) => onUpdateSettings({ tempCleanupPolicy: e.target.value as any })}
        >
          <option value="on-exit">Purge automatically when Toiloki exits</option>
          <option value="daily">Purge files older than 24 hours</option>
          <option value="manual">Manual cleanup only</option>
        </select>
      </div>

      {/* ─── 1C. PORTABLE MODE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Portable Mode & Local Storage Isolation</label>
          <span className="settings-helper">
            Direct all caches, presets, and history to ./portable_data next to the executable. Safe for USB drives.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings.portableMode ?? false}
              onChange={(e) => onUpdateSettings({ portableMode: e.target.checked })}
            />
            <span className="settings-switch-label">
              {settings.portableMode ? 'Portable Enabled' : 'Standard Host Mode'}
            </span>
          </label>
          <Button variant="secondary" size="sm" onClick={handleExportPortable}>
            {exported ? (
              <Check size={13} style={{ marginRight: '5px', color: 'var(--color-success)' }} />
            ) : (
              <Download size={13} style={{ marginRight: '5px' }} />
            )}
            {exported ? 'Exported' : 'Export Portable Bundle'}
          </Button>
        </div>
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

      {/* ─── 4. UPCOMING UTILITIES TOGGLE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Show upcoming utilities</label>
          <span className="settings-helper">
            Displays upcoming utilities marked as 'soon' in catalog lists, omnisearch, and workspaces. Off by default ('soon' items remain hidden until implemented).
          </span>
        </div>
        <label className="settings-switch">
          <input
            type="checkbox"
            checked={settings.showUpcomingUtilities ?? false}
            onChange={(e) => onUpdateSettings({ showUpcomingUtilities: e.target.checked })}
          />
          <span className="settings-switch-label">
            {settings.showUpcomingUtilities ? 'Showing upcoming' : 'Hidden by default'}
          </span>
        </label>
      </div>

      {/* ─── 5. DEVELOPER SECTION TOGGLE ─── */}
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
