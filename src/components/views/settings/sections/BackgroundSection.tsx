import React, { useRef, useState } from 'react';
import { Upload, Trash2, RotateCcw, Image } from 'lucide-react';
import { useTheme } from '../../../../core/theme/ThemeContext';
import { ThemeBackground, ImageFit } from '../../../../core/theme/theme.types';
import { Button } from '../../../common/Button';

interface BackgroundSectionProps {
  onError?: (msg: string) => void;
}

export const BackgroundSection: React.FC<BackgroundSectionProps> = ({ onError }) => {
  const { activeTheme, saveCustomTheme } = useTheme();
  const [isPickingImage, setIsPickingImage] = useState(false);

  const bgConfig: ThemeBackground = activeTheme.background || { type: 'solid' };

  const updateBackground = (patch: Partial<ThemeBackground>) => {
    const updatedBg: ThemeBackground = { ...bgConfig, ...patch };
    saveCustomTheme({
      ...activeTheme,
      background: updatedBg,
    });
  };

  // Use Electron IPC to open native dialog, copy to appData, get toiloki-bg:// URL
  const handlePickImage = async () => {
    const toiloki = (window as any).toiloki;
    if (!toiloki?.background?.pickImage) {
      // Fallback: show a warning if not in Electron
      onError?.('Background images require the desktop app.');
      return;
    }
    setIsPickingImage(true);
    try {
      const result = await toiloki.background.pickImage();
      if (result.canceled) {
        setIsPickingImage(false);
        return;
      }
      updateBackground({
        type: 'image',
        imageUrl: result.url,           // e.g. "toiloki-bg://bg_abc123.jpg"
        imageFileName: result.fileName, // keep filename for removal
        imageFit: 'cover',
        imageBlur: 0,
        imageDim: 40,
        applyTo: 'window',
      });
    } catch (err: any) {
      onError?.(`Failed to load image: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    const toiloki = (window as any).toiloki;
    const fileName = (bgConfig as any).imageFileName;
    if (toiloki?.background?.removeImage && fileName) {
      await toiloki.background.removeImage(fileName).catch(() => {});
    }
    updateBackground({ type: 'solid', imageUrl: undefined, imageFileName: undefined });
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Background</h2>
          <p className="settings-section-desc">
            Configure backdrop type: solid surface, subtle pattern, or a local image.
          </p>
        </div>
        <button
          type="button"
          className="settings-ghost-reset-btn"
          onClick={() => updateBackground({ type: 'solid', imageUrl: undefined })}
          title="Reset background to solid"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* ─── 1. BACKGROUND TYPE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Backdrop type</label>
          <span className="settings-helper">Choose between solid, a subtle pattern, or a local image wallpaper.</span>
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
              if (!bgConfig.imageUrl) {
                handlePickImage();
              } else {
                updateBackground({ type: 'image' });
              }
            }}
          >
            <span>Image</span>
          </button>
        </div>
      </div>

      {/* ─── 2. PATTERN OPTIONS ─── */}
      {bgConfig.type === 'pattern' && (
        <div className="settings-row">
          <div className="settings-row-info">
            <label className="settings-label">Pattern style</label>
            <span className="settings-helper">Ultra low-contrast mathematically generated pattern.</span>
          </div>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-item ${bgConfig.patternType === 'dots' || !bgConfig.patternType ? 'is-active' : ''}`}
              onClick={() => updateBackground({ patternType: 'dots' })}
            >
              <span>Dots</span>
            </button>
            <button
              type="button"
              className={`segmented-item ${bgConfig.patternType === 'grid' ? 'is-active' : ''}`}
              onClick={() => updateBackground({ patternType: 'grid' })}
            >
              <span>Grid</span>
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
              <span className="settings-helper">PNG, JPG, or WebP. Copied to app data — stays on your device.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {bgConfig.imageUrl && (
                <div style={{
                  width: 48,
                  height: 32,
                  borderRadius: 'var(--radius-xs)',
                  background: `center/cover no-repeat url('${bgConfig.imageUrl}')`,
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                }} />
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePickImage}
                disabled={isPickingImage}
              >
                <Upload size={13} style={{ marginRight: 6 }} />
                {isPickingImage ? 'Picking…' : bgConfig.imageUrl ? 'Change image…' : 'Choose image…'}
              </Button>
              {bgConfig.imageUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={13} style={{ marginRight: 6 }} />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {bgConfig.imageUrl && (
            <>
              {/* Fit */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <label className="settings-label">Image fit</label>
                  <span className="settings-helper">How the image fills the window.</span>
                </div>
                <select
                  className="settings-select"
                  value={bgConfig.imageFit || 'cover'}
                  onChange={(e) => updateBackground({ imageFit: e.target.value as ImageFit })}
                >
                  <option value="cover">Cover (fill screen)</option>
                  <option value="contain">Contain (fit aspect ratio)</option>
                  <option value="tile">Tile (repeat)</option>
                </select>
              </div>

              {/* Blur */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <label className="settings-label">Blur</label>
                  <span className="settings-helper">Soften the background image (0–20px).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={bgConfig.imageBlur ?? 0}
                    onChange={(e) => updateBackground({ imageBlur: parseInt(e.target.value, 10) })}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 32, color: 'var(--text-2)' }}>
                    {bgConfig.imageBlur ?? 0}px
                  </span>
                </div>
              </div>

              {/* Dim */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <label className="settings-label">Dim overlay</label>
                  <span className="settings-helper">Darken the image so text stays readable (0–80%).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={bgConfig.imageDim ?? 40}
                    onChange={(e) => updateBackground({ imageDim: parseInt(e.target.value, 10) })}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 32, color: 'var(--text-2)' }}>
                    {bgConfig.imageDim ?? 40}%
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
