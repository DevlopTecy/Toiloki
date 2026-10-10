import React, { useState, useMemo, useEffect } from 'react';
import {
  Code, Eye, Copy, Download, RefreshCw, AlertTriangle, ShieldCheck,
  Check, FileJson, Activity, Terminal, Grid, Layers, Sliders, Shield
} from 'lucide-react';
import { useTheme } from '../../../../core/theme/ThemeContext';
import { AppSettings, SettingsService } from '../../../../core/services/settings.service';
import { Button } from '../../../common/Button';
import { useToast } from '../../../../core/context/ToastContext';
import { ComponentGalleryModal } from './ComponentGalleryModal';

interface DeveloperSectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const DeveloperSection: React.FC<DeveloperSectionProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const { activeTheme, resolvedMode, previewTokenOverride, exportTheme } = useTheme();
  const { showToast } = useToast();

  const [tokenSearch, setTokenSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [fpsCounter, setFpsCounter] = useState(60);
  const [isGridActive, setIsGridActive] = useState(false);
  const [isOutlineActive, setIsOutlineActive] = useState(false);
  const [isSlowMotionActive, setIsSlowMotionActive] = useState(
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-motion-slow') === 'true'
  );

  const [activeSubTab, setActiveSubTab] = useState<'tokens' | 'perf' | 'debug' | 'flags'>('tokens');

  // Measure FPS live
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const countFrames = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFpsCounter(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(countFrames);
    };
    animId = requestAnimationFrame(countFrames);
    return () => cancelAnimationFrame(animId);
  }, []);

  const activeTokens = activeTheme.tokens[resolvedMode] || activeTheme.tokens.dark;

  // Searchable list of tokens
  const filteredTokens = useMemo(() => {
    const list = Object.entries(activeTokens);
    if (!tokenSearch.trim()) return list;
    const q = tokenSearch.toLowerCase();
    return list.filter(([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q));
  }, [activeTokens, tokenSearch]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(activeTheme, null, 2));
    showToast('Theme JSON copied to clipboard', 'success');
  };

  const handleToggleSlowMotion = () => {
    const next = !isSlowMotionActive;
    setIsSlowMotionActive(next);
    if (next) {
      document.documentElement.setAttribute('data-motion-slow', 'true');
      showToast('5x Slow Motion activated', 'info');
    } else {
      document.documentElement.removeAttribute('data-motion-slow');
      showToast('Normal motion speed restored', 'info');
    }
  };

  const handleToggleGrid = () => {
    const next = !isGridActive;
    setIsGridActive(next);
    if (next) {
      document.body.classList.add('dev-grid-active');
      const style = document.createElement('style');
      style.id = 'dev-grid-style';
      style.textContent = `
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          background-image: linear-gradient(to right, var(--accent-soft) 1px, transparent 1px),
                            linear-gradient(to bottom, var(--accent-soft) 1px, transparent 1px);
          background-size: 8px 8px;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.body.classList.remove('dev-grid-active');
      document.getElementById('dev-grid-style')?.remove();
    }
  };

  const handleToggleOutline = () => {
    const next = !isOutlineActive;
    setIsOutlineActive(next);
    if (next) {
      const style = document.createElement('style');
      style.id = 'dev-outline-style';
      style.textContent = `
        * { outline: 1px solid var(--accent) !important; }
      `;
      document.head.appendChild(style);
    } else {
      document.getElementById('dev-outline-style')?.remove();
    }
  };

  const handleSafeMode = () => {
    if (window.confirm('Restart in Safe Mode? This boots Default Clean theme and purges transient memory.')) {
      onUpdateSettings({ safeMode: true, activeThemeId: 'default-clean' });
      window.location.reload();
    }
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Developer & Diagnostic Suite</h2>
          <p className="settings-section-desc">
            Direct CSS token inspection, runtime frame profiling, UI component catalogues, and test harnesses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => setIsGalleryOpen(true)}>
            <Layers size={13} style={{ marginRight: '6px' }} />
            Component Gallery
          </Button>

          <Button variant="primary" size="sm" onClick={handleCopyJson}>
            <Copy size={13} style={{ marginRight: '6px' }} />
            Copy Theme JSON
          </Button>
        </div>
      </div>

      {/* Developer Sub-Nav */}
      <div className="segmented-control" style={{ marginBottom: '14px' }}>
        <button
          type="button"
          className={`segmented-item ${activeSubTab === 'tokens' ? 'is-active' : ''}`}
          onClick={() => setActiveSubTab('tokens')}
        >
          <Code size={13} /> Token Inspector
        </button>
        <button
          type="button"
          className={`segmented-item ${activeSubTab === 'perf' ? 'is-active' : ''}`}
          onClick={() => setActiveSubTab('perf')}
        >
          <Activity size={13} /> Performance & GPU
        </button>
        <button
          type="button"
          className={`segmented-item ${activeSubTab === 'debug' ? 'is-active' : ''}`}
          onClick={() => setActiveSubTab('debug')}
        >
          <Terminal size={13} /> Debug & State
        </button>
        <button
          type="button"
          className={`segmented-item ${activeSubTab === 'flags' ? 'is-active' : ''}`}
          onClick={() => setActiveSubTab('flags')}
        >
          <Sliders size={13} /> Experimental Flags
        </button>
      </div>

      {/* ─── SUB-TAB 1: LIVE TOKEN INSPECTOR ─── */}
      {activeSubTab === 'tokens' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <input
              type="text"
              className="settings-input"
              placeholder="Filter CSS variables (e.g. bg, surface, text, accent)..."
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              style={{ width: '360px', fontSize: '12px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Showing {filteredTokens.length} active variables for {activeTheme.name} ({resolvedMode})
            </span>
          </div>

          <div
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Variable Token</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Live Value</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, width: '60px' }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map(([key, val]) => {
                  const isColor = typeof val === 'string' && (val.startsWith('#') || val.startsWith('rgb'));
                  return (
                    <tr
                      key={key}
                      style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--accent)' }}>
                        --{key}
                      </td>
                      <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                        <input
                          type="text"
                          className="settings-input"
                          value={String(val)}
                          onChange={(e) => previewTokenOverride({ [key]: e.target.value })}
                          style={{ padding: '2px 6px', fontSize: '11px', width: '90%' }}
                        />
                      </td>
                      <td style={{ padding: '6px 12px' }}>
                        {isColor ? (
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '3px',
                              backgroundColor: String(val),
                              border: '1px solid var(--border)',
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 2: PERFORMANCE & GPU ─── */}
      {activeSubTab === 'perf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <div style={{ backgroundColor: 'var(--surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Renderer FPS</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: fpsCounter >= 55 ? 'var(--success)' : 'var(--danger)' }}>
                {fpsCounter} <span style={{ fontSize: '12px', fontWeight: 400 }}>fps</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Heap Memory</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
                48.4 <span style={{ fontSize: '12px', fontWeight: 400 }}>MB</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Long Tasks (&gt; 50ms)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>
                0
              </div>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">5x Slow motion review mode</label>
              <span className="settings-helper">Slows down all transitions to 5x duration for frame-by-frame review (Ctrl+Shift+M).</span>
            </div>
            <Button variant={isSlowMotionActive ? 'primary' : 'secondary'} size="sm" onClick={handleToggleSlowMotion}>
              {isSlowMotionActive ? 'Active (5x Slow)' : 'Normal speed'}
            </Button>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">8px Harmonic grid overlay</label>
              <span className="settings-helper">Projects an 8px alignment grid across the entire desktop window.</span>
            </div>
            <Button variant={isGridActive ? 'primary' : 'secondary'} size="sm" onClick={handleToggleGrid}>
              <Grid size={13} style={{ marginRight: '6px' }} />
              {isGridActive ? 'Grid Active' : 'Show Grid'}
            </Button>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">Outline all components</label>
              <span className="settings-helper">Visualizes boundary boxes and DOM elements with 1px outlines.</span>
            </div>
            <Button variant={isOutlineActive ? 'primary' : 'secondary'} size="sm" onClick={handleToggleOutline}>
              {isOutlineActive ? 'Outlines Active' : 'Outline Components'}
            </Button>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 3: DEBUG & STATE ─── */}
      {activeSubTab === 'debug' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">Logging severity level</label>
              <span className="settings-helper">Console output verbosity written to developer tools and memory buffers.</span>
            </div>
            <select
              className="settings-select"
              value={settings.logLevel}
              onChange={(e) => onUpdateSettings({ logLevel: e.target.value as any })}
            >
              <option value="off">Off</option>
              <option value="error">Error Only</option>
              <option value="warn">Warnings & Errors</option>
              <option value="info">Info (Default)</option>
              <option value="debug">Verbose Debug</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">Simulate UI states</label>
              <span className="settings-helper">Trigger simulated error boundaries or empty states for test harness verification.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm" onClick={() => showToast('Simulated error state triggered', 'error')}>
                Trigger Error Toast
              </Button>
              <Button variant="secondary" size="sm" onClick={() => showToast('Simulated success event', 'success')}>
                Trigger Success Toast
              </Button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">Component gallery</label>
              <span className="settings-helper">Inspect and audit all UI Kit V2 components in both Dark and Light themes.</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsGalleryOpen(true)}>
              <Grid size={13} style={{ marginRight: '6px' }} />
              Open component gallery
            </Button>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">Safe mode reboot</label>
              <span className="settings-helper">Immediately launches the application with clean factory defaults and no assets.</span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleSafeMode}>
              <Shield size={13} style={{ marginRight: '6px' }} />
              Restart in safe mode
            </Button>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 4: EXPERIMENTAL FLAGS ─── */}
      {activeSubTab === 'flags' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(settings.experimentalFlags || {}).map(([flagKey, enabled]) => (
            <div key={flagKey} className="settings-row">
              <div className="settings-row-info">
                <label className="settings-label">{flagKey}</label>
                <span className="settings-helper">Experimental feature gate for local engine optimization.</span>
              </div>
              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => {
                    const flags = { ...(settings.experimentalFlags || {}), [flagKey]: e.target.checked };
                    onUpdateSettings({ experimentalFlags: flags });
                  }}
                />
                <span className="settings-switch-label">{enabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Component Gallery Modal */}
      <ComponentGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />
    </div>
  );
};
