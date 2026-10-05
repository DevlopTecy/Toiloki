import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Check, RotateCcw, Eye, Undo2, Redo2, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { AppTheme, ThemeTokens } from '../../../../core/theme/theme.types';
import { useTheme } from '../../../../core/theme/ThemeContext';
import { ContrastBadge } from '../components/ContrastBadge';
import {
  evaluateContrast, autoFixContrast, deriveAccentPalette, deriveNeutralPalette
} from '../../../../core/theme/wcag-contrast';
import { Button } from '../../../common/Button';

interface ThemeEditorModalProps {
  theme: AppTheme;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTheme: AppTheme) => void;
}

export const ThemeEditorModal: React.FC<ThemeEditorModalProps> = ({
  theme,
  isOpen,
  onClose,
  onSave,
}) => {
  const { resolvedMode } = useTheme();
  const [activeTabMode, setActiveTabMode] = useState<'light' | 'dark'>(
    theme.base === 'light' ? 'light' : 'dark'
  );

  // Editable theme state
  const [themeName, setThemeName] = useState(theme.name);
  const [tokensLight, setTokensLight] = useState<ThemeTokens>({ ...theme.tokens.light });
  const [tokensDark, setTokensDark] = useState<ThemeTokens>({ ...theme.tokens.dark });

  // History for undo / redo
  const [history, setHistory] = useState<Array<{ light: ThemeTokens; dark: ThemeTokens }>>([
    { light: { ...theme.tokens.light }, dark: { ...theme.tokens.dark } }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Auto-generate related colors toggle
  const [autoDerive, setAutoDerive] = useState(true);

  // Compare with saved (hold to peek)
  const [isComparingSaved, setIsComparingSaved] = useState(false);

  // Current active tokens
  const activeTokens = activeTabMode === 'light' ? tokensLight : tokensDark;
  const originalTokens = activeTabMode === 'light' ? theme.tokens.light : theme.tokens.dark;
  const displayedTokens = isComparingSaved ? originalTokens : activeTokens;

  // Push history on changes
  const updateTokens = useCallback((patch: Partial<ThemeTokens>) => {
    const updater = activeTabMode === 'light' ? setTokensLight : setTokensDark;
    updater((prev) => {
      const next = { ...prev, ...patch };
      const nextLight = activeTabMode === 'light' ? next : tokensLight;
      const nextDark = activeTabMode === 'dark' ? next : tokensDark;

      setHistory((h) => [...h.slice(0, historyIndex + 1), { light: nextLight, dark: nextDark }]);
      setHistoryIndex((i) => i + 1);
      return next;
    });
  }, [activeTabMode, historyIndex, tokensLight, tokensDark]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setTokensLight(target.light);
      setTokensDark(target.dark);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setTokensLight(target.light);
      setTokensDark(target.dark);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleRedo]);

  // Contrast guards
  const primaryContrast = useMemo(() => {
    return evaluateContrast(displayedTokens.text, displayedTokens.surface);
  }, [displayedTokens.text, displayedTokens.surface]);

  const secondaryContrast = useMemo(() => {
    return evaluateContrast(displayedTokens.text2, displayedTokens.surface);
  }, [displayedTokens.text2, displayedTokens.surface]);

  const onAccentContrast = useMemo(() => {
    return evaluateContrast(displayedTokens.onAccent, displayedTokens.accent);
  }, [displayedTokens.onAccent, displayedTokens.accent]);

  const sidebarContrast = useMemo(() => {
    return evaluateContrast(displayedTokens.text, displayedTokens.sidebar);
  }, [displayedTokens.text, displayedTokens.sidebar]);

  const hasFailingContrast = !primaryContrast.isAccessible || !onAccentContrast.isAccessible;

  // Handle color changes with auto-derive
  const handleBgChange = (newBg: string) => {
    if (autoDerive) {
      const derived = deriveNeutralPalette(newBg, activeTabMode === 'dark');
      updateTokens(derived);
    } else {
      updateTokens({ bg: newBg });
    }
  };

  const handleAccentChange = (newAccent: string) => {
    if (autoDerive) {
      const derived = deriveAccentPalette(newAccent, activeTabMode === 'dark');
      updateTokens({
        accent: derived.accent,
        accentHover: derived.accentHover,
        accentActive: derived.accentActive,
        accentSoft: derived.accentSoft,
        onAccent: derived.onAccent,
        focusRing: `0 0 0 2px ${derived.accent}`,
      });
    } else {
      updateTokens({ accent: newAccent });
    }
  };

  const handleSave = () => {
    if (hasFailingContrast) {
      const confirmSave = window.confirm(
        'Warning: Some text colors have insufficient WCAG contrast against their backgrounds. Save anyway?'
      );
      if (!confirmSave) return;
    }

    onSave({
      ...theme,
      name: themeName.trim() || theme.name,
      tokens: {
        light: tokensLight,
        dark: tokensDark,
      },
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.50)',
      }}
    >
      <div
        style={{
          width: '92vw',
          maxWidth: '1240px',
          height: '88vh',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalPanelEnter 180ms var(--ease-out)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              Theme Editor:
            </span>
            <input
              type="text"
              className="settings-input"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              style={{ width: '220px', padding: '4px 10px', fontSize: '13px' }}
            />

            <div className="segmented-control" style={{ marginLeft: '12px' }}>
              <button
                type="button"
                className={`segmented-item ${activeTabMode === 'dark' ? 'is-active' : ''}`}
                onClick={() => setActiveTabMode('dark')}
              >
                Dark tokens
              </button>
              <button
                type="button"
                className={`segmented-item ${activeTabMode === 'light' ? 'is-active' : ''}`}
                onClick={() => setActiveTabMode('light')}
              >
                Light tokens
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Auto-generate toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-2)' }}>
              <input
                type="checkbox"
                checked={autoDerive}
                onChange={(e) => setAutoDerive(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span>Auto-generate related colors</span>
            </label>

            {/* Undo / Redo */}
            <button
              type="button"
              className="settings-ghost-reset-btn"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={13} />
            </button>
            <button
              type="button"
              className="settings-ghost-reset-btn"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={13} />
            </button>

            {/* Hold to peek saved */}
            <button
              type="button"
              className="settings-ghost-reset-btn"
              onMouseDown={() => setIsComparingSaved(true)}
              onMouseUp={() => setIsComparingSaved(false)}
              onMouseLeave={() => setIsComparingSaved(false)}
              title="Hold to peek at original preset"
            >
              <Eye size={13} />
              <span>Hold to compare</span>
            </button>

            <button
              type="button"
              className="dialog-close-btn"
              onClick={onClose}
              title="Close editor"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Split View */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Controls Pane */}
          <div
            style={{
              width: '460px',
              borderRight: '1px solid var(--border)',
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              backgroundColor: 'var(--surface)',
            }}
          >
            {/* Contrast Overview Alert */}
            {hasFailingContrast && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--danger)',
                }}
              >
                <AlertTriangle size={15} />
                <span>Some text colors do not pass WCAG AA. Click "Auto-fix" on the badge to resolve.</span>
              </div>
            )}

            {/* 1. BACKGROUNDS */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                BACKGROUND SURFACES
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Application Background</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={activeTokens.bg.startsWith('#') ? activeTokens.bg : '#111111'}
                      onChange={(e) => handleBgChange(e.target.value)}
                      style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="settings-input"
                      value={activeTokens.bg}
                      onChange={(e) => handleBgChange(e.target.value)}
                      style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Surface (Cards & Panels)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={activeTokens.surface.startsWith('#') ? activeTokens.surface : '#1A1A1A'}
                      onChange={(e) => updateTokens({ surface: e.target.value })}
                      style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="settings-input"
                      value={activeTokens.surface}
                      onChange={(e) => updateTokens({ surface: e.target.value })}
                      style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Sidebar</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={activeTokens.sidebar.startsWith('#') ? activeTokens.sidebar : '#151515'}
                      onChange={(e) => updateTokens({ sidebar: e.target.value })}
                      style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="settings-input"
                      value={activeTokens.sidebar}
                      onChange={(e) => updateTokens({ sidebar: e.target.value })}
                      style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TEXT & CONTRAST */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                TYPOGRAPHY & CONTRAST GUARD
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Primary Text</span>
                    <ContrastBadge
                      textColor={activeTokens.text}
                      bgColor={activeTokens.surface}
                      onAutoFix={(fixed) => updateTokens({ text: fixed })}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={activeTokens.text.startsWith('#') ? activeTokens.text : '#EDEDED'}
                      onChange={(e) => updateTokens({ text: e.target.value })}
                      style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="settings-input"
                      value={activeTokens.text}
                      onChange={(e) => updateTokens({ text: e.target.value })}
                      style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Secondary Text</span>
                    <ContrastBadge
                      textColor={activeTokens.text2}
                      bgColor={activeTokens.surface}
                      onAutoFix={(fixed) => updateTokens({ text2: fixed })}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={activeTokens.text2.startsWith('#') ? activeTokens.text2 : '#A3A3A3'}
                      onChange={(e) => updateTokens({ text2: e.target.value })}
                      style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="settings-input"
                      value={activeTokens.text2}
                      onChange={(e) => updateTokens({ text2: e.target.value })}
                      style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>On-Accent Text</span>
                    <ContrastBadge
                      textColor={activeTokens.onAccent}
                      bgColor={activeTokens.accent}
                      onAutoFix={(fixed) => updateTokens({ onAccent: fixed })}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={activeTokens.onAccent.startsWith('#') ? activeTokens.onAccent : '#111111'}
                      onChange={(e) => updateTokens({ onAccent: e.target.value })}
                      style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="settings-input"
                      value={activeTokens.onAccent}
                      onChange={(e) => updateTokens({ onAccent: e.target.value })}
                      style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ACCENT & BORDERS */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                ACCENT & BORDERS
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Primary Accent</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={activeTokens.accent.startsWith('#') ? activeTokens.accent : '#F5A524'}
                      onChange={(e) => handleAccentChange(e.target.value)}
                      style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="settings-input"
                      value={activeTokens.accent}
                      onChange={(e) => handleAccentChange(e.target.value)}
                      style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Default Border</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={activeTokens.border.startsWith('#') ? activeTokens.border : '#2A2A2A'}
                      onChange={(e) => updateTokens({ border: e.target.value, divider: e.target.value })}
                      style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="settings-input"
                      value={activeTokens.border}
                      onChange={(e) => updateTokens({ border: e.target.value, divider: e.target.value })}
                      style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live UI Preview Pane */}
          <div
            style={{
              flex: 1,
              backgroundColor: displayedTokens.bg,
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: displayedTokens.text2 }}>
                LIVE THEME PREVIEW ({isComparingSaved ? 'ORIGINAL PRESET' : 'ACTIVE DRAFT'})
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <ContrastBadge
                  label="Card Body"
                  textColor={displayedTokens.text}
                  bgColor={displayedTokens.surface}
                />
                <ContrastBadge
                  label="Button"
                  textColor={displayedTokens.onAccent}
                  bgColor={displayedTokens.accent}
                />
              </div>
            </div>

            {/* Mini UI Layout Mirror */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                gap: '16px',
                height: '420px',
                border: `1px solid ${displayedTokens.border}`,
                borderRadius: displayedTokens.radiusMd,
                overflow: 'hidden',
                backgroundColor: displayedTokens.bg,
              }}
            >
              {/* Mini Sidebar */}
              <div
                style={{
                  backgroundColor: displayedTokens.sidebar,
                  borderRight: `1px solid ${displayedTokens.border}`,
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: displayedTokens.text, marginBottom: '8px' }}>
                  TOILOKI
                </div>
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: displayedTokens.radiusXs,
                    backgroundColor: displayedTokens.accentSoft,
                    color: displayedTokens.text,
                    fontSize: '11.5px',
                    fontWeight: 600,
                    borderLeft: `2px solid ${displayedTokens.accent}`,
                  }}
                >
                  PDF Workspace
                </div>
                <div style={{ padding: '6px 10px', color: displayedTokens.text2, fontSize: '11.5px' }}>
                  Images
                </div>
                <div style={{ padding: '6px 10px', color: displayedTokens.text2, fontSize: '11.5px' }}>
                  Data & Text
                </div>
              </div>

              {/* Mini Workspace Content */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
                <div
                  style={{
                    backgroundColor: displayedTokens.surface,
                    border: `1px solid ${displayedTokens.border}`,
                    borderRadius: displayedTokens.radiusMd,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: displayedTokens.text }}>
                    Merge PDF Utility
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: displayedTokens.text2 }}>
                    Combine multiple document pages into a single cohesive output.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      style={{
                        backgroundColor: displayedTokens.accent,
                        color: displayedTokens.onAccent,
                        border: 'none',
                        borderRadius: displayedTokens.radiusSm,
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Primary Action
                    </button>
                    <button
                      type="button"
                      style={{
                        backgroundColor: displayedTokens.surfaceHover,
                        color: displayedTokens.text,
                        border: `1px solid ${displayedTokens.border}`,
                        borderRadius: displayedTokens.radiusSm,
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Secondary
                    </button>
                    <button
                      type="button"
                      style={{
                        backgroundColor: 'transparent',
                        color: displayedTokens.text2,
                        border: 'none',
                        borderRadius: displayedTokens.radiusSm,
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Ghost
                    </button>
                  </div>
                </div>

                {/* Mini Data Table Row */}
                <div
                  style={{
                    backgroundColor: displayedTokens.surface,
                    border: `1px solid ${displayedTokens.border}`,
                    borderRadius: displayedTokens.radiusSm,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px', color: displayedTokens.text }}>Document_Annual_Report.pdf</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: displayedTokens.textMuted }}>
                    1.4 MB • 42 pages
                  </span>
                </div>

                {/* Mini Toast Notification */}
                <div
                  style={{
                    backgroundColor: displayedTokens.surface,
                    border: `1px solid ${displayedTokens.accent}`,
                    borderRadius: displayedTokens.radiusSm,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: 'fit-content',
                  }}
                >
                  <Check size={14} color={displayedTokens.accent} />
                  <span style={{ fontSize: '11.5px', color: displayedTokens.text }}>Batch merged successfully</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Keyboard shortcut: <kbd style={{ padding: '2px 5px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px' }}>Ctrl+Z</kbd> Undo, <kbd style={{ padding: '2px 5px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px' }}>Ctrl+Shift+Z</kbd> Redo
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save & Apply Theme
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
