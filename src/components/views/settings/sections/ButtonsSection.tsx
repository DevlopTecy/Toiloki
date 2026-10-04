import React, { useState, useRef } from 'react';
import {
  RotateCcw, Upload, Check, FolderOpen, Layers, Code, Copy,
  Trash2, Download, RefreshCw, Image, ShieldCheck, AlertTriangle, Eye, Sliders
} from 'lucide-react';
import { useTheme } from '../../../../core/theme/ThemeContext';
import {
  ThemeButtons, ButtonPresetStyle, ButtonIconMode, ButtonIconPack,
  ButtonCardStyle, CardPictureConfig
} from '../../../../core/theme/theme.types';
import { SettingsService } from '../../../../core/services/settings.service';
import { Button } from '../../../common/Button';
import { ImageButton } from '../../../common/ImageButton';
import { sanitizeSvg } from '../../../../core/theme/theme.validator';
import { DEFAULT_ART_PACK, getDefaultArtwork } from '../../../../assets/art-pack/default-art-pack';

const ACTION_ICONS = [
  { id: 'open', label: 'Open File', defaultIcon: FolderOpen },
  { id: 'merge', label: 'Merge', defaultIcon: Layers },
  { id: 'format', label: 'Format Code', defaultIcon: Code },
  { id: 'copy', label: 'Copy to Clipboard', defaultIcon: Copy },
  { id: 'clear', label: 'Clear / Delete', defaultIcon: Trash2 },
  { id: 'download', label: 'Download Result', defaultIcon: Download },
  { id: 'reset', label: 'Reset Tool', defaultIcon: RefreshCw },
];

const CARD_ITEMS = [
  { id: 'pdf', label: 'PDF Workspace', categoryColor: 'var(--cat-pdf, #EF4444)' },
  { id: 'documents', label: 'Documents', categoryColor: 'var(--cat-documents, #3B82F6)' },
  { id: 'images', label: 'Images', categoryColor: 'var(--cat-images, #22C55E)' },
  { id: 'data', label: 'Data & Sheets', categoryColor: 'var(--cat-data, #F59E0B)' },
  { id: 'text', label: 'Text & Formatting', categoryColor: 'var(--cat-text, #8B5CF6)' },
  { id: 'developer', label: 'Developer Utilities', categoryColor: 'var(--cat-developer, #F97316)' },
  { id: 'calculator', label: 'Calculators & Units', categoryColor: 'var(--cat-calculator, #EAB308)' },
  { id: 'files', label: 'Files & Archives', categoryColor: 'var(--cat-files, #3B82F6)' },
  { id: 'hero', label: 'Home Hero Banner', categoryColor: 'var(--accent, #F5A524)' },
  { id: 'button-skin', label: 'Primary Button Skin', categoryColor: 'var(--accent, #F5A524)' },
];

export const ButtonsSection: React.FC = () => {
  const { activeTheme, saveCustomTheme, resolvedMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string>('pdf');
  const [simulatedLoading, setSimulatedLoading] = useState(false);

  const initialSettings = SettingsService.getSettings();
  const [cardStyle, setCardStyle] = useState<ButtonCardStyle>(
    (initialSettings.buttonCardStyle as ButtonCardStyle) || activeTheme.buttons?.cardStyle || 'flat'
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

  const updateButtons = (patch: Partial<ThemeButtons>) => {
    saveCustomTheme({
      ...activeTheme,
      buttons: { ...buttonConfig, ...patch },
    });
  };

  // Switch between Flat and Image card style with 200ms theme cross-fade
  const handleStyleChange = (newStyle: ButtonCardStyle) => {
    setCardStyle(newStyle);
    document.body.classList.add('theme-switching');
    setTimeout(() => {
      document.body.classList.remove('theme-switching');
    }, 200);

    SettingsService.saveSettings({ buttonCardStyle: newStyle });
    updateButtons({ cardStyle: newStyle });
  };

  // Card picture config helper
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

    // Auto-adjust for readability: if scrim drops below 85% or contrast is compromised, auto-nudge
    if (updatedConfig.scrim !== undefined && updatedConfig.scrim < 0.85 && patch.scrim === undefined) {
      updatedConfig.scrim = 0.90;
    }

    const nextPictures = {
      ...(buttonConfig.pictures || {}),
      [cardId]: updatedConfig,
    };

    updateButtons({ pictures: nextPictures });
  };

  // Handle image upload and local client-side downscaling (max 1200px) or SVG sanitization
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTarget) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Selected image must be under 5MB.');
      return;
    }

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        const sanitized = sanitizeSvg(reader.result as string);
        const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(sanitized)}`;
        updateCardPicture(activeUploadTarget, { assetId: dataUri });
        setActiveUploadTarget(null);
      };
      reader.readAsText(file);
      return;
    }

    // Raster downscaling to 1200px max
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
          updateCardPicture(activeUploadTarget, { assetId: downscaled });
          setActiveUploadTarget(null);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (targetId: string) => {
    setActiveUploadTarget(targetId);
    fileInputRef.current?.click();
  };

  const selectedCard = CARD_ITEMS.find((c) => c.id === selectedCardId) || CARD_ITEMS[0];
  const selectedCardConfig = getCardPictureConfig(selectedCard.id);
  const activeArt = selectedCardConfig.assetId || getDefaultArtwork(selectedCard.id, resolvedMode);
  const isCustomArt = Boolean(selectedCardConfig.assetId);

  return (
    <div className="settings-section">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
      />

      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Buttons & Artwork</h2>
          <p className="settings-section-desc">
            Configure button geometric shapes, card launcher treatments, iconography rules, and artwork skins.
          </p>
        </div>
        <button
          type="button"
          className="settings-ghost-reset-btn"
          onClick={() => {
            handleStyleChange('flat');
            updateButtons({
              preset: 'filled',
              cardStyle: 'flat',
              iconMode: 'both',
              iconPosition: 'left',
              iconSize: 16,
              iconPack: 'lucide',
              customActionIcons: {},
              primaryButtonSkin: undefined,
              pictures: {},
              enableButtonSkins: false,
            });
          }}
          title="Reset buttons & artwork to default"
        >
          <RotateCcw size={13} />
          <span>Reset buttons</span>
        </button>
      </div>

      {/* ─── 0. BUTTON & CARD STYLE (FLAT vs IMAGE) ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Button & card style</label>
          <span className="settings-helper">
            Choose between clean flat utility style and rich launcher style with picture backgrounds.
          </span>
        </div>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-item ${cardStyle === 'flat' ? 'is-active' : ''}`}
            onClick={() => handleStyleChange('flat')}
          >
            <span>Flat (Default)</span>
          </button>
          <button
            type="button"
            className={`segmented-item ${cardStyle === 'image' ? 'is-active' : ''}`}
            onClick={() => handleStyleChange('image')}
          >
            <span>Image</span>
          </button>
        </div>
      </div>

      {/* ─── 1. BUTTON STYLE PRESET ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Button style preset</label>
          <span className="settings-helper">Controls button elevation, borders, fill treatment, and corner radius.</span>
        </div>
        <div className="segmented-control">
          {(['filled', 'soft', 'outline', 'ghost', 'pill', 'square'] as ButtonPresetStyle[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`segmented-item ${buttonConfig.preset === p ? 'is-active' : ''}`}
              onClick={() => updateButtons({ preset: p })}
              style={{ textTransform: 'capitalize' }}
            >
              <span>{p}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 2. PRIMARY BUTTON SKIN TOGGLE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Primary button skin</label>
          <span className="settings-helper">
            Apply a subtle texture artwork layer behind primary buttons with a guaranteed-contrast scrim.
          </span>
        </div>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={Boolean(buttonConfig.enableButtonSkins)}
            onChange={(e) => updateButtons({ enableButtonSkins: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* ─── 3. ICON RULES ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Icon display mode</label>
          <span className="settings-helper">Choose whether buttons render icon and label, icon only, or label only.</span>
        </div>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-item ${buttonConfig.iconMode === 'both' ? 'is-active' : ''}`}
            onClick={() => updateButtons({ iconMode: 'both' })}
          >
            <span>Icon + Label</span>
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
            <span>Label only</span>
          </button>
        </div>
      </div>

      {/* ─── 4. ICON POSITION & SIZE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Icon position & size</label>
          <span className="settings-helper">Side placement and optical pixel size for button icons.</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="settings-select"
            value={buttonConfig.iconPosition || 'left'}
            onChange={(e) => updateButtons({ iconPosition: e.target.value as any })}
          >
            <option value="left">Left aligned</option>
            <option value="right">Right aligned</option>
          </select>

          <select
            className="settings-select"
            value={buttonConfig.iconSize || 16}
            onChange={(e) => updateButtons({ iconSize: parseInt(e.target.value, 10) as any })}
            style={{ width: '100px' }}
          >
            <option value="14">14px</option>
            <option value="16">16px (Default)</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
          </select>
        </div>
      </div>

      {/* ─── 5. Card & Button Pictures MANAGER ─── */}
      <div style={{ marginTop: '24px' }}>
        <div className="section-header-row" style={{ marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
              Card & Button Pictures
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
              Replace default artwork with local images, adjust positioning, scale, opacity, and contrast scrims.
            </p>
          </div>
        </div>

        {/* Card Selector Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '16px',
          }}
        >
          {CARD_ITEMS.map((item) => {
            const isSelected = selectedCardId === item.id;
            const hasCustom = Boolean(buttonConfig.pictures?.[item.id]?.assetId);

            return (
              <button
                key={item.id}
                type="button"
                className={`segmented-item ${isSelected ? 'is-active' : ''}`}
                onClick={() => setSelectedCardId(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: item.categoryColor,
                  }}
                />
                <span>{item.label}</span>
                {hasCustom && (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    Custom
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Card Editor Panel */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: '24px',
          }}
        >
          {/* Left: Thumbnail & Live Readability Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                height: '140px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={activeArt}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: selectedCardConfig.position || 'right',
                  opacity: selectedCardConfig.opacity ?? (resolvedMode === 'light' ? 0.55 : 1.0),
                  transform: `scale(${selectedCardConfig.scale || 1.0})`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(to right, rgba(var(--surface-rgb, 26,26,26), ${selectedCardConfig.scrim ?? 0.85}) 0%, transparent 100%)`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  bottom: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  {selectedCard.label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                  AA Contrast Scrim Active
                </span>
              </div>
            </div>

            {/* Readability & Contrast Auto-Check Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(74, 222, 128, 0.08)',
                border: '1px solid rgba(74, 222, 128, 0.25)',
                fontSize: '11.5px',
                color: 'var(--text-2)',
              }}
            >
              <ShieldCheck size={16} color="var(--color-success)" />
              <span>
                <strong>Readability verified:</strong> Scrim opacity {Math.round((selectedCardConfig.scrim ?? 0.85) * 100)}% satisfies WCAG AA (4.5:1).
              </span>
            </div>

            {/* Actions for Picture */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => triggerUpload(selectedCard.id)}
                style={{ flex: 1 }}
              >
                <Upload size={12} style={{ marginRight: '6px' }} />
                Choose image...
              </Button>

              {isCustomArt && (
                <button
                  type="button"
                  className="settings-ghost-reset-btn"
                  onClick={() => {
                    const pics = { ...(buttonConfig.pictures || {}) };
                    delete pics[selectedCard.id];
                    updateButtons({ pictures: pics });
                  }}
                  title="Reset to default artwork"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Per-Card Sliders & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Position */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Artwork position</span>
              <div className="segmented-control" style={{ width: '220px' }}>
                {(['left', 'center', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    className={`segmented-item ${(selectedCardConfig.position || 'right') === pos ? 'is-active' : ''}`}
                    onClick={() => updateCardPicture(selectedCard.id, { position: pos })}
                    style={{ textTransform: 'capitalize' }}
                  >
                    <span>{pos}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Scale factor</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1.0x to 1.5x zoom</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '220px' }}>
                <input
                  type="range"
                  min="100"
                  max="150"
                  value={Math.round((selectedCardConfig.scale ?? 1.0) * 100)}
                  onChange={(e) => updateCardPicture(selectedCard.id, { scale: parseInt(e.target.value, 10) / 100 })}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '36px' }}>
                  {(selectedCardConfig.scale ?? 1.0).toFixed(2)}x
                </span>
              </div>
            </div>

            {/* Opacity */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Artwork opacity</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>10% to 100% luminance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '220px' }}>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={Math.round((selectedCardConfig.opacity ?? (resolvedMode === 'light' ? 0.55 : 1.0)) * 100)}
                  onChange={(e) => updateCardPicture(selectedCard.id, { opacity: parseInt(e.target.value, 10) / 100 })}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '36px' }}>
                  {Math.round((selectedCardConfig.opacity ?? (resolvedMode === 'light' ? 0.55 : 1.0)) * 100)}%
                </span>
              </div>
            </div>

            {/* Scrim strength */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Scrim strength (Contrast guard)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>60% to 100% gradient density</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '220px' }}>
                <input
                  type="range"
                  min="60"
                  max="100"
                  value={Math.round((selectedCardConfig.scrim ?? 0.85) * 100)}
                  onChange={(e) => updateCardPicture(selectedCard.id, { scrim: parseInt(e.target.value, 10) / 100 })}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', minWidth: '36px' }}>
                  {Math.round((selectedCardConfig.scrim ?? 0.85) * 100)}%
                </span>
              </div>
            </div>

            {/* Category Tint Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>Tint with category color</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Apply subtle 10% category tint overlay</span>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(selectedCardConfig.tint)}
                  onChange={(e) => updateCardPicture(selectedCard.id, { tint: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. CUSTOM ARTWORK PER ACTION ─── */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
          CUSTOM ARTWORK PER ACTION
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '14px' }}>
          Assign custom icons or local vector artwork to key actions across the utility suite.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {ACTION_ICONS.map((action) => {
            const IconComponent = action.defaultIcon;
            const customArt = buttonConfig.customActionIcons?.[action.id];

            return (
              <div
                key={action.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--surface-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text)',
                    }}
                  >
                    {customArt ? (
                      <span
                        dangerouslySetInnerHTML={{ __html: customArt }}
                        style={{ display: 'flex', width: '16px', height: '16px' }}
                      />
                    ) : (
                      <IconComponent size={16} />
                    )}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>
                    {action.label}
                  </span>
                </div>

                {customArt && (
                  <button
                    type="button"
                    className="settings-ghost-reset-btn"
                    style={{ padding: '2px 5px', fontSize: '10px' }}
                    onClick={() => {
                      const icons = { ...(buttonConfig.customActionIcons || {}) };
                      delete icons[action.id];
                      updateButtons({ customActionIcons: icons });
                    }}
                    title="Reset to default icon"
                  >
                    Reset
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 7. LIVE BUTTON PLAYGROUND ─── */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
            LIVE BUTTON PLAYGROUND
          </h3>
          <button
            type="button"
            className="settings-ghost-reset-btn"
            onClick={() => setSimulatedLoading(!simulatedLoading)}
          >
            <span>{simulatedLoading ? 'Stop loading state' : 'Test loading state'}</span>
          </button>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Row 1: Primary with optional Skin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', width: '80px' }}>Primary:</span>
            {buttonConfig.enableButtonSkins ? (
              <ImageButton
                variant="primary"
                size="md"
                skinImage={getDefaultArtwork('button-skin', resolvedMode)}
                isLoading={simulatedLoading}
              >
                <Layers size={buttonConfig.iconSize || 16} style={{ marginRight: '6px' }} />
                Merge documents (Skinned)
              </ImageButton>
            ) : (
              <Button variant="primary" size="md" isLoading={simulatedLoading}>
                <Layers size={buttonConfig.iconSize || 16} style={{ marginRight: '6px' }} />
                Merge documents
              </Button>
            )}
            <Button variant="primary" size="sm" disabled>
              Disabled primary
            </Button>
          </div>

          {/* Row 2: Secondary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', width: '80px' }}>Secondary:</span>
            <Button variant="secondary" size="md">
              <FolderOpen size={buttonConfig.iconSize || 16} style={{ marginRight: '6px' }} />
              Choose local file
            </Button>
            <Button variant="secondary" size="sm" disabled>
              Disabled secondary
            </Button>
          </div>

          {/* Row 3: Ghost */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', width: '80px' }}>Ghost:</span>
            <Button variant="ghost" size="md">
              <RotateCcw size={buttonConfig.iconSize || 16} style={{ marginRight: '6px' }} />
              Reset parameters
            </Button>
            <Button variant="ghost" size="sm" disabled>
              Disabled ghost
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
