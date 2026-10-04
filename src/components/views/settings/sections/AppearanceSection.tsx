import React, { useState, useRef } from 'react';
import {
  Check, Sun, Moon, Monitor, RotateCcw, Plus, Upload, Download,
  Copy, Trash2, Edit2, MoreHorizontal, ChevronDown, FolderOpen,
  Image as ImageIcon, RefreshCw, Sliders
} from 'lucide-react';
import { useTheme } from '../../../../core/theme/ThemeContext';
import { SettingsService, AppSettings } from '../../../../core/services/settings.service';
import { deriveAccentPalette } from '../../../../core/theme/wcag-contrast';
import { ACCENT_PRESETS, AppTheme, ThemeBackground, ThemeButtons, ButtonCardStyle, CardPictureConfig } from '../../../../core/theme/theme.types';
import { Button } from '../../../common/Button';
import { ThemeEditorModal } from './ThemeEditorModal';
import { sanitizeSvg } from '../../../../core/theme/theme.validator';
import { getDefaultArtwork } from '../../../../assets/art-pack/default-art-pack';

interface AppearanceSectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

const CARD_ITEMS = [
  { id: 'pdf', label: 'PDF Workspace' },
  { id: 'documents', label: 'Documents' },
  { id: 'images', label: 'Images' },
  { id: 'data', label: 'Data & Sheets' },
  { id: 'text', label: 'Text & Formatting' },
  { id: 'developer', label: 'Developer Utilities' },
  { id: 'calculator', label: 'Calculators & Units' },
  { id: 'files', label: 'Files & Archives' },
  { id: 'hero', label: 'Home Hero Banner' },
  { id: 'button-skin', label: 'Primary Button Skin' },
];

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
    allThemes,
    customThemes,
    activeTheme,
    previewTheme,
    selectTheme,
    createTheme,
    saveCustomTheme,
    duplicateTheme,
    deleteTheme,
    exportTheme,
    importTheme,
  } = useTheme();

  // Modals & Menu states
  const [editingTheme, setEditingTheme] = useState<AppTheme | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [openMenuThemeId, setOpenMenuThemeId] = useState<string | null>(null);

  // File input refs
  const themeFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const artworkFileInputRef = useRef<HTMLInputElement>(null);

  // Background states
  const bgConfig: ThemeBackground = activeTheme.background || { type: 'solid' };

  // Card picture manager states
  const [selectedCardId, setSelectedCardId] = useState<string>('pdf');
  const [cardStyle, setCardStyle] = useState<ButtonCardStyle>(
    (settings.buttonCardStyle as ButtonCardStyle) || activeTheme.buttons?.cardStyle || 'flat'
  );

  const buttonConfig: ThemeButtons = activeTheme.buttons || {
    preset: 'filled',
    cardStyle: 'flat',
    iconMode: 'both',
    iconPosition: 'left',
    iconSize: 16,
    iconPack: 'lucide',
    pictures: {},
  };

  const currentAccentId = settings.accentColor || 'orange';
  const customHex = settings.customAccentHex || (resolvedMode === 'dark' ? '#F5A524' : '#E8890C');
  const selectedThemeId = previewTheme ? previewTheme.id : activeTheme.id;

  // Accent handler
  const handleSelectAccent = (presetId: string, hex?: string) => {
    const chosenPreset = ACCENT_PRESETS.find((p) => p.id === presetId);
    const targetHex = hex || (chosenPreset ? (resolvedMode === 'dark' ? chosenPreset.darkHex : chosenPreset.lightHex) : customHex);

    onUpdateSettings({
      accentColor: presetId,
      customAccentHex: targetHex,
    });

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

  // Corner radius handler
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

  // Theme actions
  const handleCreateTheme = () => {
    const created = createTheme(selectedThemeId);
    setEditingTheme(created);
    setIsEditorOpen(true);
  };

  const handleEditTheme = (theme: AppTheme) => {
    setEditingTheme(theme);
    setIsEditorOpen(true);
    setOpenMenuThemeId(null);
  };

  const handleThemeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importTheme(file);
    if (themeFileInputRef.current) themeFileInputRef.current.value = '';
  };

  // Background actions
  const updateBackground = (patch: Partial<ThemeBackground>) => {
    saveCustomTheme({
      ...activeTheme,
      background: { ...bgConfig, ...patch },
    });
  };

  const handlePickBgImage = async () => {
    const toiloki = (window as any).toiloki;
    if (toiloki?.background?.pickImage) {
      try {
        const result = await toiloki.background.pickImage();
        if (!result.canceled && result.url) {
          updateBackground({
            type: 'image',
            imageUrl: result.url,
            imageFileName: result.fileName,
            imageFit: 'cover',
            imageBlur: 0,
            imageDim: 40,
            applyTo: 'window',
          });
        }
        return;
      } catch (err) {
        console.error('Pick image error:', err);
      }
    }
    bgFileInputRef.current?.click();
  };

  const handleBgFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateBackground({
        type: 'image',
        imageUrl: reader.result as string,
        imageFit: 'cover',
        imageBlur: 0,
        imageDim: 40,
        applyTo: 'window',
      });
    };
    reader.readAsDataURL(file);
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
  };

  const handleRemoveBgImage = async () => {
    const toiloki = (window as any).toiloki;
    const fileName = (bgConfig as any).imageFileName;
    if (toiloki?.background?.removeImage && fileName) {
      await toiloki.background.removeImage(fileName).catch(() => {});
    }
    updateBackground({ type: 'solid', imageUrl: undefined, imageFileName: undefined });
  };

  // Card & Button actions
  const updateButtons = (patch: Partial<ThemeButtons>) => {
    saveCustomTheme({
      ...activeTheme,
      buttons: { ...buttonConfig, ...patch },
    });
  };

  const handleCardStyleChange = (newStyle: ButtonCardStyle) => {
    setCardStyle(newStyle);
    document.body.classList.add('theme-switching');
    setTimeout(() => {
      document.body.classList.remove('theme-switching');
    }, 200);

    onUpdateSettings({ buttonCardStyle: newStyle });
    SettingsService.saveSettings({ buttonCardStyle: newStyle });
    updateButtons({ cardStyle: newStyle });
  };

  const getCardPictureConfig = (cardId: string): CardPictureConfig => {
    return buttonConfig.pictures?.[cardId] || {
      position: 'right',
      scale: 1.0,
      opacity: resolvedMode === 'light' ? 0.55 : 1.0,
      scrim: 0.85,
      tint: false,
    };
  };

  const updateCardPicture = (cardId: string, patch: Partial<CardPictureConfig>) => {
    const existing = getCardPictureConfig(cardId);
    const updatedConfig: CardPictureConfig = { ...existing, ...patch };
    const nextPictures = {
      ...(buttonConfig.pictures || {}),
      [cardId]: updatedConfig,
    };
    updateButtons({ pictures: nextPictures });
  };

  const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        const sanitized = sanitizeSvg(reader.result as string);
        const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(sanitized)}`;
        updateCardPicture(selectedCardId, { assetId: dataUri });
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const downscaled = canvas.toDataURL('image/webp', 0.88);
          updateCardPicture(selectedCardId, { assetId: downscaled });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    if (artworkFileInputRef.current) artworkFileInputRef.current.value = '';
  };

  const selectedCardConfig = getCardPictureConfig(selectedCardId);
  const activeArt = selectedCardConfig.assetId || getDefaultArtwork(selectedCardId, resolvedMode);

  return (
    <div className="settings-section" onClick={() => openMenuThemeId && setOpenMenuThemeId(null)}>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={themeFileInputRef}
        onChange={handleThemeFileUpload}
        accept=".json,.toiloki-theme.json"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={bgFileInputRef}
        onChange={handleBgFileFallback}
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={artworkFileInputRef}
        onChange={handleArtworkUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
      />

      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Appearance</h2>
          <p className="settings-section-desc">
            Customize color mode, accent colors, theme presets, background backdrop, typography, and card treatments.
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

      {/* ─── 1. COLOR MODE (VISUAL LIGHT / DARK / SYSTEM TILES) ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Color mode</label>
          <span className="settings-helper">Select visual theme mode or automatically match operating system setting.</span>
        </div>

        <div className="color-mode-tiles">
          <button
            type="button"
            className={`color-mode-tile ${themeMode === 'light' ? 'is-active' : ''}`}
            onClick={() => {
              setThemeMode('light');
              onUpdateSettings({ theme: 'light' });
            }}
          >
            <div className="color-mode-tile-preview tile-light">
              <div className="mini-sidebar" />
              <div className="mini-canvas">
                <div className="mini-bar" />
                <div className="mini-bar" style={{ width: '40%' }} />
              </div>
            </div>
            <div className="color-mode-tile-footer">
              <Sun size={13} />
              <span>Light</span>
            </div>
          </button>

          <button
            type="button"
            className={`color-mode-tile ${themeMode === 'dark' ? 'is-active' : ''}`}
            onClick={() => {
              setThemeMode('dark');
              onUpdateSettings({ theme: 'dark' });
            }}
          >
            <div className="color-mode-tile-preview tile-dark">
              <div className="mini-sidebar" />
              <div className="mini-canvas">
                <div className="mini-bar" />
                <div className="mini-bar" style={{ width: '40%' }} />
              </div>
            </div>
            <div className="color-mode-tile-footer">
              <Moon size={13} />
              <span>Dark</span>
            </div>
          </button>

          <button
            type="button"
            className={`color-mode-tile ${themeMode === 'system' ? 'is-active' : ''}`}
            onClick={() => {
              setThemeMode('system');
              onUpdateSettings({ theme: 'system' });
            }}
          >
            <div className="color-mode-tile-preview tile-system">
              <div className="split-left" />
              <div className="split-right" />
            </div>
            <div className="color-mode-tile-footer">
              <Monitor size={13} />
              <span>System</span>
            </div>
          </button>
        </div>
      </div>

      {/* ─── 2. ACCENT COLOR (8 SWATCHES + CUSTOM) ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Accent color</label>
          <span className="settings-helper">Primary brand accent used for active indicators, focus rings, and action buttons.</span>
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
              backgroundImage: currentAccentId === 'custom' ? 'none' : 'conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)',
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

      {/* ─── 3. INTERFACE DENSITY ─── */}
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
            onClick={() => onUpdateSettings({ density: 'default' })}
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

      {/* ─── 4. FONT SIZE & FAMILY ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Interface font & scaling</label>
          <span className="settings-helper">Application sans-serif font family and proportional text scaling.</span>
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
            <option value="Inter">Inter (Default)</option>
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

      {/* ─── 4B. CODE / MONOSPACE FONT ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Code / monospace font</label>
          <span className="settings-helper">Used in JSON viewer, data tables, split diffs, and cryptographic hash outputs.</span>
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
              padding: '5px 10px',
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

      {/* ─── 5. LAYOUT (WORKBENCH / CLASSIC) ─── */}
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
            <span>Classic</span>
          </button>
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
          <span className="settings-helper">Native Windows Mica / Acrylic material with desktop tinting.</span>
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
          <span className="settings-helper">Collapses spatial animations to pure opacity transitions.</span>
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

      {/* ─── 9. BACKGROUND (PHASE 1 WALLPAPER/PATTERN/DIM SCRIM) ─── */}
      <div className="settings-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div className="settings-row-info">
            <label className="settings-label">Backdrop background</label>
            <span className="settings-helper">Configure solid surface, subtle geometric pattern, or wallpaper image.</span>
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
              <span>Pattern</span>
            </button>
            <button
              type="button"
              className={`segmented-item ${bgConfig.type === 'image' ? 'is-active' : ''}`}
              onClick={() => {
                if (!bgConfig.imageUrl) {
                  handlePickBgImage();
                } else {
                  updateBackground({ type: 'image' });
                }
              }}
            >
              <span>Image</span>
            </button>
          </div>
        </div>

        {/* Pattern Controls */}
        {bgConfig.type === 'pattern' && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', width: '100%', padding: '10px 14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Pattern style:</span>
            <select
              className="settings-select"
              value={bgConfig.patternType || 'dots'}
              onChange={(e) => updateBackground({ patternType: e.target.value as any })}
              style={{ minWidth: '130px' }}
            >
              <option value="dots">Dot matrix</option>
              <option value="grid">Grid lines</option>
              <option value="noise">Subtle noise</option>
            </select>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Opacity:</span>
            <input
              type="range"
              min="5"
              max="40"
              value={Math.round((bgConfig.scrimOpacity ?? 0.15) * 100)}
              onChange={(e) => updateBackground({ scrimOpacity: parseInt(e.target.value, 10) / 100 })}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
          </div>
        )}

        {/* Image Controls */}
        {bgConfig.type === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', padding: '12px 14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="secondary" size="sm" onClick={handlePickBgImage}>
                <ImageIcon size={13} style={{ marginRight: '6px' }} />
                {bgConfig.imageUrl ? 'Change image...' : 'Pick local image...'}
              </Button>
              {bgConfig.imageUrl && (
                <Button variant="ghost" size="sm" onClick={handleRemoveBgImage} style={{ color: 'var(--color-danger, #ef4444)' }}>
                  <Trash2 size={13} style={{ marginRight: '4px' }} />
                  Remove wallpaper
                </Button>
              )}
            </div>

            {bgConfig.imageUrl && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '4px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fit:</span>
                  <select
                    className="settings-select"
                    value={bgConfig.imageFit || 'cover'}
                    onChange={(e) => updateBackground({ imageFit: e.target.value as any })}
                    style={{ width: '100%', marginTop: '3px' }}
                  >
                    <option value="cover">Fill window (Cover)</option>
                    <option value="contain">Fit inside (Contain)</option>
                    <option value="tile">Tile pattern</option>
                  </select>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Dim scrim:</span>
                    <span>{bgConfig.imageDim ?? 40}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={bgConfig.imageDim ?? 40}
                    onChange={(e) => updateBackground({ imageDim: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', marginTop: '6px', accentColor: 'var(--accent)' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Blur:</span>
                    <span>{bgConfig.imageBlur ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={bgConfig.imageBlur ?? 0}
                    onChange={(e) => updateBackground({ imageBlur: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', marginTop: '6px', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 10. THEME GALLERY (VISUAL PREVIEWS + "SELECT" + "..." MENU) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <label className="settings-label" style={{ fontSize: '14px' }}>Theme gallery</label>
            <div className="settings-helper">Curated presets and customized themes.</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => themeFileInputRef.current?.click()}
            >
              <Upload size={13} style={{ marginRight: '6px' }} />
              Import theme
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateTheme}
            >
              <Plus size={14} style={{ marginRight: '6px' }} />
              Create theme
            </Button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '14px',
          }}
        >
          {allThemes.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            const tokens = theme.tokens[resolvedMode] || theme.tokens.dark;
            const isMenuOpen = openMenuThemeId === theme.id;

            return (
              <div
                key={theme.id}
                style={{
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                {/* Visual Preview Window */}
                <div
                  style={{
                    height: '96px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: tokens.bg,
                    border: `1px solid ${tokens.border}`,
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr',
                    padding: '5px',
                    gap: '5px',
                  }}
                >
                  {/* Sidebar */}
                  <div
                    style={{
                      backgroundColor: tokens.sidebar,
                      borderRadius: '2px',
                      border: `1px solid ${tokens.border}`,
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ width: '80%', height: '3px', backgroundColor: tokens.text, borderRadius: '2px', opacity: 0.8 }} />
                    <div style={{ width: '100%', height: '7px', backgroundColor: tokens.accentSoft, borderRadius: '2px', borderLeft: `2px solid ${tokens.accent}` }} />
                    <div style={{ width: '60%', height: '3px', backgroundColor: tokens.text2, borderRadius: '2px', opacity: 0.5 }} />
                  </div>

                  {/* Canvas */}
                  <div
                    style={{
                      backgroundColor: tokens.surface,
                      borderRadius: '2px',
                      border: `1px solid ${tokens.border}`,
                      padding: '5px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ width: '65%', height: '4px', backgroundColor: tokens.text, borderRadius: '2px', marginBottom: '3px' }} />
                      <div style={{ width: '90%', height: '3px', backgroundColor: tokens.text2, borderRadius: '2px', opacity: 0.6 }} />
                    </div>
                    <div
                      style={{
                        backgroundColor: tokens.accent,
                        color: tokens.onAccent,
                        borderRadius: '2px',
                        padding: '1px 5px',
                        fontSize: '8.5px',
                        fontWeight: 600,
                        width: 'fit-content',
                      }}
                    >
                      Action
                    </div>
                  </div>
                </div>

                {/* Theme Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                    {theme.name}
                  </span>
                  {!theme.isPreset && (
                    <span style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Custom</span>
                  )}
                </div>

                {/* Actions: "Select" + "..." menu */}
                <div className="theme-action-bar">
                  {isSelected ? (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                        padding: '4px 0',
                      }}
                    >
                      <Check size={12} /> Active
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => selectTheme(theme.id)}
                      style={{ padding: '3px 10px', fontSize: '11.5px' }}
                    >
                      Select
                    </Button>
                  )}

                  {/* "..." Menu Button & Popover */}
                  <div className="theme-dropdown-container">
                    <button
                      type="button"
                      className="settings-ghost-reset-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuThemeId(isMenuOpen ? null : theme.id);
                      }}
                      title="More options"
                      style={{ padding: '4px' }}
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {isMenuOpen && (
                      <div className="theme-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="theme-dropdown-item"
                          onClick={() => {
                            duplicateTheme(theme.id);
                            setOpenMenuThemeId(null);
                          }}
                        >
                          <Copy size={12} /> Duplicate
                        </button>
                        <button
                          type="button"
                          className="theme-dropdown-item"
                          onClick={() => {
                            exportTheme(theme.id);
                            setOpenMenuThemeId(null);
                          }}
                        >
                          <Download size={12} /> Export JSON
                        </button>
                        {!theme.isPreset && (
                          <>
                            <button
                              type="button"
                              className="theme-dropdown-item"
                              onClick={() => handleEditTheme(theme)}
                            >
                              <Edit2 size={12} /> Edit tokens
                            </button>
                            <button
                              type="button"
                              className="theme-dropdown-item is-danger"
                              onClick={() => {
                                if (window.confirm(`Delete custom theme "${theme.name}"?`)) {
                                  deleteTheme(theme.id);
                                  setOpenMenuThemeId(null);
                                }
                              }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 11. COLLAPSED "CARD AND BUTTON STYLE" ─── */}
      <details className="settings-accordion" style={{ marginTop: '8px' }}>
        <summary className="settings-accordion-summary">
          <span>Card and button style</span>
          <ChevronDown size={14} color="var(--text-muted)" />
        </summary>
        <div className="settings-accordion-content">
          {/* Card Style: Flat vs Image */}
          <div className="settings-row" style={{ paddingTop: 0 }}>
            <div className="settings-row-info">
              <label className="settings-label">Launcher card style</label>
              <span className="settings-helper">Toggle between minimal flat surfaces and rich artwork banner cards.</span>
            </div>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-item ${cardStyle === 'flat' ? 'is-active' : ''}`}
                onClick={() => handleCardStyleChange('flat')}
              >
                <span>Flat minimalist</span>
              </button>
              <button
                type="button"
                className={`segmented-item ${cardStyle === 'image' ? 'is-active' : ''}`}
                onClick={() => handleCardStyleChange('image')}
              >
                <span>Artwork images</span>
              </button>
            </div>
          </div>

          {/* Button Preset Style */}
          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">Primary button style</label>
              <span className="settings-helper">Visual weight across action triggers and converter submission buttons.</span>
            </div>
            <div className="segmented-control">
              {['filled', 'outlined', 'soft', 'ghost'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`segmented-item ${buttonConfig.preset === preset ? 'is-active' : ''}`}
                  onClick={() => updateButtons({ preset: preset as any })}
                >
                  <span style={{ textTransform: 'capitalize' }}>{preset}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Iconography Rule */}
          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">Action iconography</label>
              <span className="settings-helper">Display rules for tool action buttons.</span>
            </div>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-item ${buttonConfig.iconMode === 'both' ? 'is-active' : ''}`}
                onClick={() => updateButtons({ iconMode: 'both' })}
              >
                <span>Icon & text</span>
              </button>
              <button
                type="button"
                className={`segmented-item ${buttonConfig.iconMode === 'icon-only' ? 'is-active' : ''}`}
                onClick={() => updateButtons({ iconMode: 'icon-only' })}
              >
                <span>Icon only</span>
              </button>
              <button
                type="button"
                className={`segmented-item ${buttonConfig.iconMode === 'label-only' ? 'is-active' : ''}`}
                onClick={() => updateButtons({ iconMode: 'label-only' })}
              >
                <span>Text only</span>
              </button>
            </div>
          </div>

          {/* Pictures Manager */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="settings-row-info">
              <label className="settings-label">Card artwork manager</label>
              <span className="settings-helper">Customize or upload SVG/raster artworks for individual workspace launcher cards.</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="settings-select"
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                style={{ flex: 1, minWidth: '180px' }}
              >
                {CARD_ITEMS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => artworkFileInputRef.current?.click()}
              >
                <Upload size={13} style={{ marginRight: '6px' }} />
                Upload artwork
              </Button>

              {selectedCardConfig.assetId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateCardPicture(selectedCardId, { assetId: undefined })}
                  style={{ color: 'var(--color-danger, #ef4444)' }}
                >
                  <RefreshCw size={13} style={{ marginRight: '4px' }} />
                  Reset to default
                </Button>
              )}
            </div>

            {/* Artwork Preview and Sliders */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Readability scrim:</span>
                  <span>{Math.round((selectedCardConfig.scrim ?? 0.85) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={Math.round((selectedCardConfig.scrim ?? 0.85) * 100)}
                  onChange={(e) => updateCardPicture(selectedCardId, { scrim: parseInt(e.target.value, 10) / 100 })}
                  style={{ width: '100%', marginTop: '6px', accentColor: 'var(--accent)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Scale:</span>
                  <span>{Math.round((selectedCardConfig.scale ?? 1.0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="140"
                  value={Math.round((selectedCardConfig.scale ?? 1.0) * 100)}
                  onChange={(e) => updateCardPicture(selectedCardId, { scale: parseInt(e.target.value, 10) / 100 })}
                  style={{ width: '100%', marginTop: '6px', accentColor: 'var(--accent)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Opacity:</span>
                  <span>{Math.round((selectedCardConfig.opacity ?? 1.0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={Math.round((selectedCardConfig.opacity ?? 1.0) * 100)}
                  onChange={(e) => updateCardPicture(selectedCardId, { opacity: parseInt(e.target.value, 10) / 100 })}
                  style={{ width: '100%', marginTop: '6px', accentColor: 'var(--accent)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* ─── 12. VISIBLE WORKSPACES TOGGLES ─── */}
      <div className="settings-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '12px' }}>
        <div className="settings-row-info">
          <label className="settings-label">Visible workspaces</label>
          <span className="settings-helper">
            Toggle which workspaces appear in the sidebar and navigation. Changes take effect immediately.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', width: '100%' }}>
          {/* Core Workspaces */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Core Workspaces
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
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Extended Workspaces
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

      {/* Theme Editor Modal */}
      {isEditorOpen && editingTheme && (
        <ThemeEditorModal
          theme={editingTheme}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTheme(null);
          }}
          onSave={(updated) => {
            saveCustomTheme(updated);
            setIsEditorOpen(false);
            setEditingTheme(null);
          }}
        />
      )}
    </div>
  );
};
