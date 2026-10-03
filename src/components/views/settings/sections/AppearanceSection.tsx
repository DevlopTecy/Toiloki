import React from 'react';
import { Check, Sun, Moon, Monitor, RotateCcw } from 'lucide-react';
import { useTheme } from '../../../../core/theme/ThemeContext';
import { SettingsService, AppSettings } from '../../../../core/services/settings.service';
import { deriveAccentPalette } from '../../../../core/theme/wcag-contrast';
import { ACCENT_PRESETS } from '../../../../core/theme/theme.types';

interface AppearanceSectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({

  settings,
  onUpdateSettings,
}) => {
  const {
    themeMode,
    resolvedMode,
    setThemeMode,
    previewTokenOverride,
    resetSectionAppearance,
  } = useTheme();

  const currentAccentId = settings.accentColor || 'orange';
  const customHex = settings.customAccentHex || (resolvedMode === 'dark' ? '#F5A524' : '#E8890C');

  const handleSelectAccent = (presetId: string, hex?: string) => {
    const chosenPreset = ACCENT_PRESETS.find((p) => p.id === presetId);
    const targetHex = hex || (chosenPreset ? (resolvedMode === 'dark' ? chosenPreset.darkHex : chosenPreset.lightHex) : customHex);

    onUpdateSettings({
      accentColor: presetId,
      customAccentHex: targetHex,
    });

    // Derive and preview accent tokens
    const derived = deriveAccentPalette(targetHex, resolvedMode === 'dark');
    previewTokenOverride({
      accent: derived.accent,
      accentHover: derived.accentHover,
      accentActive: derived.accentActive,
      accentSoft: derived.accentSoft,
      focusRing: `0 0 0 2px ${derived.accent}`,
      onAccent: derived.onAccent,
    });
  };

  const handleCornerStyle = (style: 'sharp' | 'default' | 'round') => {
    onUpdateSettings({ cornerStyle: style });
    let xs = '4px', sm = '6px', md = '8px', lg = '12px', dropzone = '16px';
    if (style === 'sharp') {
      xs = '1px'; sm = '3px'; md = '4px'; lg = '6px'; dropzone = '8px';
    } else if (style === 'round') {
      xs = '6px'; sm = '10px'; md = '14px'; lg = '18px'; dropzone = '22px';
    }
    previewTokenOverride({
      radiusScale: style,
      radiusXs: xs,
      radiusSm: sm,
      radiusMd: md,
      radiusLg: lg,
      radiusDropzone: dropzone,
    });
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Appearance</h2>
          <p className="settings-section-desc">
            Customize interface theme, display density, typography, and accent colors.
          </p>
        </div>
        <button
          type="button"
          className="settings-ghost-reset-btn"
          onClick={resetSectionAppearance}
          title="Reset appearance to defaults"
        >
          <RotateCcw size={13} />
          <span>Reset section</span>
        </button>
      </div>

      {/* ─── 1. MODE (Light / Dark / System) ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Color mode</label>
          <span className="settings-helper">Select theme mode or automatically match operating system setting.</span>
        </div>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-item ${themeMode === 'light' ? 'is-active' : ''}`}
            onClick={() => {
              setThemeMode('light');
              onUpdateSettings({ theme: 'light' });
            }}
          >
            <Sun size={14} />
            <span>Light</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${themeMode === 'dark' ? 'is-active' : ''}`}
            onClick={() => {
              setThemeMode('dark');
              onUpdateSettings({ theme: 'dark' });
            }}
          >
            <Moon size={14} />
            <span>Dark</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${themeMode === 'system' ? 'is-active' : ''}`}
            onClick={() => {
              setThemeMode('system');
              onUpdateSettings({ theme: 'system' });
            }}
          >
            <Monitor size={14} />
            <span>System</span>
          </button>

        </div>
      </div>

      {/* ─── 1.5. LAYOUT ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Layout</label>
          <span className="settings-helper">Choose between the new 3-zone Workbench or the Classic tool list layout.</span>
        </div>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-item ${settings.layout === 'workbench' || !settings.layout ? 'is-active' : ''}`}
            onClick={() => onUpdateSettings({ layout: 'workbench' })}
          >
            <span>Workbench (Default)</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${settings.layout === 'classic' ? 'is-active' : ''}`}
            onClick={() => onUpdateSettings({ layout: 'classic' })}
          >
            <span>Classic (Fallback)</span>
          </button>
        </div>
      </div>

      {/* ─── 2. INTERFACE DENSITY ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Interface density</label>
          <span className="settings-helper">Controls row heights and spacing (Compact 28px · Default 32px · Comfortable 40px).</span>
        </div>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-item ${settings.density === 'compact' ? 'is-active' : ''}`}
            onClick={() => onUpdateSettings({ density: 'compact' })}
          >
            <span>Compact</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${
              !settings.density || settings.density === 'default' || (settings.density !== 'compact' && settings.density !== 'comfortable') ? 'is-active' : ''
            }`}
            onClick={() => onUpdateSettings({ density: 'default' as any })}
          >
            <span>Default</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${settings.density === 'comfortable' ? 'is-active' : ''}`}
            onClick={() => onUpdateSettings({ density: 'comfortable' })}
          >
            <span>Comfortable</span>
          </button>
        </div>
      </div>

      {/* ─── 3. ACCENT COLOR (Real 8 colors + Custom) ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Accent color</label>
          <span className="settings-helper">Primary brand color used for active indicators, focus outlines, and buttons.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {ACCENT_PRESETS.map((preset) => {
            const hex = resolvedMode === 'dark' ? preset.darkHex : preset.lightHex;
            const isSelected = currentAccentId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`accent-swatch-circle ${isSelected ? 'is-selected' : ''}`}
                style={{ backgroundColor: hex }}
                onClick={() => handleSelectAccent(preset.id, hex)}
                title={`${preset.name} (${hex})`}
              >
                {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
              </button>
            );
          })}

          {/* Custom color picker */}
          <label
            className={`accent-swatch-custom ${currentAccentId === 'custom' ? 'is-selected' : ''}`}
            style={{ 
              backgroundColor: currentAccentId === 'custom' ? customHex : 'transparent',
              backgroundImage: currentAccentId === 'custom' ? 'none' : 'conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)'
            }}
            title={currentAccentId === 'custom' ? `Custom Color (${customHex})` : 'Choose custom color...'}
          >
            <input
              type="color"
              value={customHex.length === 7 ? customHex : '#F5A524'}
              onChange={(e) => handleSelectAccent('custom', e.target.value)}
              style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            />
            {currentAccentId === 'custom' && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
          </label>
        </div>
      </div>

      {/* ─── 4. INTERFACE FONT & SCALE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Interface font family & scaling</label>
          <span className="settings-helper">Application sans-serif font and proportional text size scaling.</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="settings-select"
            value={settings.interfaceFont || 'Inter'}
            onChange={(e) => {
              onUpdateSettings({ interfaceFont: e.target.value });
              previewTokenOverride({ fontSans: `${e.target.value}, system-ui, sans-serif` });
            }}
          >
            <option value="Inter">Inter (Recommended)</option>
            <option value="System UI">System UI (Native)</option>
            <option value="Segoe UI">Segoe UI (Windows)</option>
            <option value="Roboto">Roboto</option>
            <option value="Outfit">Outfit</option>
          </select>

          <select
            className="settings-select"
            value={settings.fontSizeScale || '100%'}
            onChange={(e) => {
              const scale = e.target.value as any;
              onUpdateSettings({ fontSizeScale: scale });
              previewTokenOverride({ fontSizeScale: scale });
            }}
            style={{ width: '110px' }}
          >
            <option value="90%">90% Scale</option>
            <option value="100%">100% (Default)</option>
            <option value="110%">110% Scale</option>
            <option value="125%">125% Scale</option>
          </select>
        </div>
      </div>

      {/* ─── 5. CODE / MONOSPACE FONT ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Code / monospace font</label>
          <span className="settings-helper">Used in JSON viewer, data tables, diff split editors, and hash utilities.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '260px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              className="settings-select"
              value={settings.monoFont || 'JetBrains Mono'}
              onChange={(e) => {
                onUpdateSettings({ monoFont: e.target.value });
                previewTokenOverride({ fontMono: `${e.target.value}, monospace` });
              }}
              style={{ flex: 1 }}
            >
              <option value="JetBrains Mono">JetBrains Mono (Default)</option>
              <option value="Consolas">Consolas</option>
              <option value="Courier New">Courier New</option>
              <option value="Cascadia Code">Cascadia Code</option>
            </select>

            <select
              className="settings-select"
              value={settings.monoFontSize || '13px'}
              onChange={(e) => onUpdateSettings({ monoFontSize: e.target.value })}
              style={{ width: '90px' }}
            >
              <option value="12px">12px</option>
              <option value="13px">13px</option>
              <option value="14px">14px</option>
              <option value="15px">15px</option>
            </select>
          </div>

          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)',
              fontFamily: `${settings.monoFont || 'JetBrains Mono'}, monospace`,
              fontSize: settings.monoFontSize || '13px',
              color: 'var(--text-2)',
            }}
          >
            <code>const hash = crypto.createHash("sha256");</code>
          </div>
        </div>
      </div>

      {/* ─── 6. CORNER STYLE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Corner style (Radius)</label>
          <span className="settings-helper">Control radii across buttons, cards, dialogs, and dropzone borders.</span>
        </div>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-item ${settings.cornerStyle === 'sharp' ? 'is-active' : ''}`}
            onClick={() => handleCornerStyle('sharp')}
          >
            <span>Sharp (4px)</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${settings.cornerStyle === 'default' || !settings.cornerStyle ? 'is-active' : ''}`}
            onClick={() => handleCornerStyle('default')}
          >
            <span>Default (8px)</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${settings.cornerStyle === 'round' ? 'is-active' : ''}`}
            onClick={() => handleCornerStyle('round')}
          >
            <span>Round (16px)</span>
          </button>
        </div>
      </div>

      {/* ─── 7. WINDOW MATERIAL EFFECT ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Window material effect</label>
          <span className="settings-helper">Native Windows Mica / Acrylic material. Falls back to solid surface if unsupported.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
          <select
            className="settings-select"
            value={settings.windowEffect || 'none'}
            onChange={(e) => onUpdateSettings({ windowEffect: e.target.value as any })}
          >
            <option value="none">None (Solid Surface)</option>
            <option value="mica">Mica (Subtle desktop tint)</option>
            <option value="acrylic">Acrylic (Translucent material)</option>
          </select>

          {settings.windowEffect !== 'none' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Opacity:</span>
              <input
                type="range"
                min="60"
                max="100"
                value={settings.windowOpacity || 100}
                onChange={(e) => onUpdateSettings({ windowOpacity: parseInt(e.target.value, 10) })}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '32px' }}>
                {settings.windowOpacity || 100}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── 8. REDUCE MOTION ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Reduce motion</label>
          <span className="settings-helper">Collapses spatial animations to pure opacity transitions ≤ 100ms.</span>
        </div>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-item ${settings.reduceMotion === 'auto' ? 'is-active' : ''}`}
            onClick={() => onUpdateSettings({ reduceMotion: 'auto' })}
          >
            <span>Auto (System)</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${settings.reduceMotion === 'on' ? 'is-active' : ''}`}
            onClick={() => onUpdateSettings({ reduceMotion: 'on' })}
          >
            <span>On (Reduce)</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${settings.reduceMotion === 'off' ? 'is-active' : ''}`}
            onClick={() => onUpdateSettings({ reduceMotion: 'off' })}
          >
            <span>Off (Full)</span>
          </button>
        </div>
      </div>

      {/* ─── 9. VISIBLE WORKSPACES TOGGLES ─── */}
      <div className="settings-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '12px' }}>
        <div className="settings-row-info">
          <label className="settings-label">Visible workspaces</label>
          <span className="settings-helper">
            Toggle which workspaces appear in the sidebar and navigation. Changes take effect immediately.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', width: '100%' }}>
          {/* Core Workspaces */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: 0 }}>
              Workspaces
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'pdf', label: 'PDF' },
                { id: 'documents', label: 'Documents' },
                { id: 'images', label: 'Images' },
                { id: 'data', label: 'Data' },
                { id: 'text', label: 'Text' },
                { id: 'developer', label: 'Developer' },
                { id: 'calculator', label: 'Calculator' },
                { id: 'files', label: 'Files & Archives' },
              ].map((ws) => {
                const isVisible = (settings.visibleWorkspaces || []).includes(ws.id);
                return (
                  <label key={ws.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
                    <span>{ws.label}</span>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => {
                        const current = settings.visibleWorkspaces || [];
                        const next = e.target.checked
                          ? [...current, ws.id]
                          : current.filter((id) => id !== ws.id);
                        onUpdateSettings({ visibleWorkspaces: next });
                      }}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* More Workspaces */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: 0 }}>
              More workspaces
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'security', label: 'Security & Privacy' },
                { id: 'media', label: 'Audio & Video' },
                { id: 'network', label: 'Network & Web' },
                { id: 'design', label: 'Color & Design' },
                { id: 'system', label: 'System & Maintenance' },
              ].map((ws) => {
                const isVisible = (settings.visibleWorkspaces || []).includes(ws.id);
                return (
                  <label key={ws.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
                    <span>{ws.label}</span>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => {
                        const current = settings.visibleWorkspaces || [];
                        const next = e.target.checked
                          ? [...current, ws.id]
                          : current.filter((id) => id !== ws.id);
                        onUpdateSettings({ visibleWorkspaces: next });
                      }}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
