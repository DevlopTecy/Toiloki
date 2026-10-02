import React, { useRef, useState } from 'react';
import { Image, Upload, Trash2, Eye, ShieldCheck, Layers, RotateCcw } from 'lucide-react';
import { useTheme } from '../../../../core/theme/ThemeContext';
import { ThemeBackground, BackgroundType, PatternType, ImageFit, ApplyBackgroundTo } from '../../../../core/theme/theme.types';
import { Button } from '../../../common/Button';
import { ContrastBadge } from '../components/ContrastBadge';

export const BackgroundSection: React.FC = () => {
  const { activeTheme, saveCustomTheme, resolvedMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bgConfig: ThemeBackground = activeTheme.background || { type: 'solid' };

  const updateBackground = (patch: Partial<ThemeBackground>) => {
    const updatedBg: ThemeBackground = { ...bgConfig, ...patch };
    saveCustomTheme({
      ...activeTheme,
      background: updatedBg,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Background image must be smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateBackground({
        type: 'image',
        imageUrl: dataUrl,
        imageFit: 'cover',
        imagePosition: 'center',
        imageBlur: 0,
        imageDim: 40,
        applyTo: 'window',
        scrimOpacity: 85,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearImage = () => {
    updateBackground({
      type: 'solid',
      imageUrl: undefined,
    });
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Custom Background</h2>
          <p className="settings-section-desc">
            Configure application backdrop materials, geometric patterns, or local image wallpapers.
          </p>
        </div>
        <button
          type="button"
          className="settings-ghost-reset-btn"
          onClick={() => updateBackground({ type: 'solid', imageUrl: undefined })}
          title="Reset background to solid"
        >
          <RotateCcw size={13} />
          <span>Reset background</span>
        </button>
      </div>

      {/* ─── 1. BACKGROUND TYPE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Backdrop surface type</label>
          <span className="settings-helper">Choose between clean solid surface, generated low-contrast pattern, or local wallpaper.</span>
        </div>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-item ${bgConfig.type === 'solid' ? 'is-active' : ''}`}
            onClick={() => updateBackground({ type: 'solid' })}
          >
            <span>Solid</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${bgConfig.type === 'pattern' ? 'is-active' : ''}`}
            onClick={() => updateBackground({ type: 'pattern', patternType: bgConfig.patternType || 'dots' })}
          >
            <span>Subtle pattern</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${bgConfig.type === 'image' ? 'is-active' : ''}`}
            onClick={() => {
              if (!bgConfig.imageUrl && fileInputRef.current) {
                fileInputRef.current.click();
              } else {
                updateBackground({ type: 'image' });
              }
            }}
          >
            <span>Image wallpaper</span>
          </button>
        </div>
      </div>

      {/* ─── 2. PATTERN OPTIONS ─── */}
      {bgConfig.type === 'pattern' && (
        <div className="settings-row">
          <div className="settings-row-info">
            <label className="settings-label">Pattern style</label>
            <span className="settings-helper">Ultra low-contrast mathematically generated vectors.</span>
          </div>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-item ${bgConfig.patternType === 'dots' || !bgConfig.patternType ? 'is-active' : ''}`}
              onClick={() => updateBackground({ patternType: 'dots' })}
            >
              <span>Subtle dots</span>
            </button>
            <button
              type="button"
              className={`segmented-item ${bgConfig.patternType === 'grid' ? 'is-active' : ''}`}
              onClick={() => updateBackground({ patternType: 'grid' })}
            >
              <span>Technical grid</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── 3. IMAGE WALLPAPER OPTIONS ─── */}
      {bgConfig.type === 'image' && (
        <>
          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">Local image file</label>
              <span className="settings-helper">PNG, JPG, WebP up to 10MB. Stored purely locally on your device.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={13} style={{ marginRight: '6px' }} />
                {bgConfig.imageUrl ? 'Change image...' : 'Choose image...'}
              </Button>

              {bgConfig.imageUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearImage}
                  style={{ color: 'var(--color-danger)' }}
                >
                  <Trash2 size={13} style={{ marginRight: '6px' }} />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {bgConfig.imageUrl && (
            <>
              {/* Wallpaper adjustments */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <label className="settings-label">Fit & positioning</label>
                  <span className="settings-helper">Scaling mode and position of the backdrop.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    className="settings-select"
                    value={bgConfig.imageFit || 'cover'}
                    onChange={(e) => updateBackground({ imageFit: e.target.value as ImageFit })}
                  >
                    <option value="cover">Cover (Fill screen)</option>
                    <option value="contain">Contain (Fit aspect)</option>
                    <option value="tile">Tile (Repeat pattern)</option>
                  </select>

                  <select
                    className="settings-select"
                    value={bgConfig.applyTo || 'window'}
                    onChange={(e) => updateBackground({ applyTo: e.target.value as ApplyBackgroundTo })}
                  >
                    <option value="window">Whole window</option>
                    <option value="workspace">Workspace area only</option>
                    <option value="sidebar">Sidebar only</option>
                  </select>
                </div>
              </div>

              {/* Sliders for Blur & Dimming Overlay */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <label className="settings-label">Dim overlay & blur</label>
                  <span className="settings-helper">Darkens and softens the background so utility text remains razor sharp.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '55px' }}>Dim:</span>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={bgConfig.imageDim ?? 40}
                      onChange={(e) => updateBackground({ imageDim: parseInt(e.target.value, 10) })}
                      style={{ flex: 1, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '32px' }}>
                      {bgConfig.imageDim ?? 40}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '55px' }}>Blur:</span>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={bgConfig.imageBlur ?? 0}
                      onChange={(e) => updateBackground({ imageBlur: parseInt(e.target.value, 10) })}
                      style={{ flex: 1, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '32px' }}>
                      {bgConfig.imageBlur ?? 0}px
                    </span>
                  </div>
                </div>
              </div>

              {/* Mandatory Readability Scrim Notice */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(74, 222, 128, 0.08)',
                  border: '1px solid rgba(74, 222, 128, 0.22)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '12px',
                  color: 'var(--text-2)',
                }}
              >
                <ShieldCheck size={18} color="var(--color-success)" />
                <span>
                  <strong>Mandatory Readability Scrim active:</strong> UI surfaces above the image maintain at least 85% opacity to guarantee WCAG AA text contrast.
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
