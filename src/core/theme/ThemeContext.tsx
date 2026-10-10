import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AppTheme, ThemeMode, ThemeTokens, ThemeBackground, ThemeButtons, ACCENT_PRESETS } from './theme.types';
import { BUILTIN_THEMES } from './theme-presets';
import { SettingsService, AppSettings } from '../services/settings.service';
import { validateThemeJson } from './theme.validator';
import { deriveAccentPalette } from './wcag-contrast';
import { useToast } from '../context/ToastContext';
import {
  CHIBIGI_MASCOT_BUNNY,
  CHIBIGI_MASCOT_KUMA,
  CHIBIGI_MASCOT_NEKO,
  CHIBIGI_WALLPAPER_LIGHT,
  CHIBIGI_WALLPAPER_DARK,
} from '../../assets/art-pack/default-art-pack';


interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  activeTheme: AppTheme;
  allThemes: AppTheme[];
  customThemes: AppTheme[];
  previewTheme: AppTheme | null;
  hasUnsavedChanges: boolean;
  isTranslucentSupported: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  selectTheme: (themeId: string) => void;
  previewThemeDraft: (theme: AppTheme) => void;
  previewTokenOverride: (patch: Partial<ThemeTokens>) => void;
  applyChanges: () => void;
  revertChanges: () => void;
  createTheme: (baseThemeId?: string) => AppTheme;
  saveCustomTheme: (theme: AppTheme) => void;
  duplicateTheme: (themeId: string) => AppTheme;
  renameTheme: (themeId: string, newName: string) => void;
  deleteTheme: (themeId: string) => void;
  exportTheme: (themeId: string) => void;
  importTheme: (file: File) => Promise<boolean>;
  resetAppearance: () => void;
  resetSectionAppearance: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const CUSTOM_THEMES_STORAGE_KEY = 'toiloki_custom_themes';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const initialSettings = SettingsService.getSettings();

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('theme');
      if (p === 'light' || p === 'dark' || p === 'system') return p as ThemeMode;
    }
    return (initialSettings.theme as ThemeMode) || 'system';
  });

  const [customThemes, setCustomThemes] = useState<AppTheme[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const fallback = BUILTIN_THEMES[0];
          return parsed.map((t) => ({
            ...t,
            tokens: t.tokens && t.tokens.dark && t.tokens.light ? t.tokens : fallback.tokens,
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load custom themes:', e);
    }
    return [];
  });

  const allThemes = useMemo(() => {
    const customMap = new Map(customThemes.map((t) => [t.id, t]));
    const list = BUILTIN_THEMES.map((b) => customMap.get(b.id) || b);
    for (const c of customThemes) {
      if (!BUILTIN_THEMES.some((b) => b.id === c.id)) {
        list.push(c);
      }
    }
    return list;
  }, [customThemes]);

  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    const found = allThemes.find((t) => t.id === initialSettings.activeThemeId);
    return found ? found.id : 'default-clean';
  });

  // Preview state for uncommitted changes
  const [draftTheme, setDraftTheme] = useState<AppTheme | null>(null);
  const [tokenPatch, setTokenPatch] = useState<Partial<ThemeTokens> | null>(null);

  // System dark mode listener
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Reduced transparency listener
  const [prefersReducedTransparency, setPrefersReducedTransparency] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorScheme = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    colorSchemeQuery.addEventListener('change', handleColorScheme);

    const transparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)');
    const handleTransparency = (e: MediaQueryListEvent) => setPrefersReducedTransparency(e.matches);
    transparencyQuery.addEventListener('change', handleTransparency);

    return () => {
      colorSchemeQuery.removeEventListener('change', handleColorScheme);
      transparencyQuery.removeEventListener('change', handleTransparency);
    };
  }, []);

  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'system') return systemIsDark ? 'dark' : 'light';
    return themeMode;
  }, [themeMode, systemIsDark]);

  const activeTheme = useMemo(() => {
    return allThemes.find((t) => t.id === activeThemeId) || BUILTIN_THEMES[0];
  }, [allThemes, activeThemeId]);

  const currentTheme = draftTheme || activeTheme;

  const hasUnsavedChanges = Boolean(
    (draftTheme && draftTheme.id !== activeThemeId) ||
    tokenPatch !== null
  );

  // Apply CSS variables dynamically to the document root
  const [appSettings, setAppSettings] = useState<AppSettings>(() => SettingsService.getSettings());

  useEffect(() => {
    return SettingsService.subscribe((updated) => {
      setAppSettings(updated);
    });
  }, []);

  // Apply CSS variables dynamically to the document root
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let styleEl = document.getElementById('toiloki-dynamic-theme-vars') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'toiloki-dynamic-theme-vars';
      document.head.appendChild(styleEl);
    }

    const rawTokens = currentTheme.tokens[resolvedMode] || currentTheme.tokens.dark;

    // Synthesize setting overrides (accent color, corners, fonts)
    const settingsOverrides: Partial<ThemeTokens> = {};

    // 1. Accent color override
    if (appSettings.accentColor) {
      const preset = ACCENT_PRESETS.find((p) => p.id === appSettings.accentColor);
      const targetHex = appSettings.accentColor === 'custom'
        ? (appSettings.customAccentHex || (resolvedMode === 'dark' ? '#F5A524' : '#E8890C'))
        : (preset ? (resolvedMode === 'dark' ? preset.darkHex : preset.lightHex) : appSettings.customAccentHex);

      if (targetHex) {
        const derived = deriveAccentPalette(targetHex, resolvedMode === 'dark');
        settingsOverrides.accent = derived.accent;
        settingsOverrides.accentHover = derived.accentHover;
        settingsOverrides.accentActive = derived.accentActive;
        settingsOverrides.accentSoft = derived.accentSoft;
        settingsOverrides.focusRing = `0 0 0 2px ${derived.accent}`;
        settingsOverrides.onAccent = derived.onAccent;
      }
    }

    // 2. Corner radius override
    if (appSettings.cornerStyle) {
      if (appSettings.cornerStyle === 'sharp') {
        settingsOverrides.radiusScale = 'sharp';
        settingsOverrides.radiusXs = '1px';
        settingsOverrides.radiusSm = '3px';
        settingsOverrides.radiusMd = '4px';
        settingsOverrides.radiusLg = '6px';
        settingsOverrides.radiusDropzone = '8px';
      } else if (appSettings.cornerStyle === 'round') {
        settingsOverrides.radiusScale = 'round';
        settingsOverrides.radiusXs = '6px';
        settingsOverrides.radiusSm = '10px';
        settingsOverrides.radiusMd = '14px';
        settingsOverrides.radiusLg = '18px';
        settingsOverrides.radiusDropzone = '22px';
      } else {
        settingsOverrides.radiusScale = 'default';
        settingsOverrides.radiusXs = '4px';
        settingsOverrides.radiusSm = '6px';
        settingsOverrides.radiusMd = '8px';
        settingsOverrides.radiusLg = '12px';
        settingsOverrides.radiusDropzone = '16px';
      }
    }

    // 3. Fonts override
    if (appSettings.interfaceFont) {
      settingsOverrides.fontSans = `${appSettings.interfaceFont}, system-ui, sans-serif`;
    }
    if (appSettings.monoFont) {
      settingsOverrides.fontMono = `${appSettings.monoFont}, monospace`;
    }

    const tokens: ThemeTokens = {
      ...rawTokens,
      ...settingsOverrides,
      ...(tokenPatch || {}),
    };

    // Translucent theme safety fallback: if user prefers reduced transparency, enforce opacity 1.0 and 0px blur
    const isTranslucent = currentTheme.id === 'translucent-11';
    const effectiveSurface = (isTranslucent && prefersReducedTransparency)
      ? (resolvedMode === 'dark' ? '#1A1A1A' : '#FFFFFF')
      : tokens.surface;
    const effectiveSidebar = (isTranslucent && prefersReducedTransparency)
      ? (resolvedMode === 'dark' ? '#151515' : '#F3F3F1')
      : tokens.sidebar;
    const effectiveBlur = (isTranslucent && prefersReducedTransparency)
      ? '0px'
      : (tokens.backdropBlur || '0px');

    const cssLines: string[] = [
      ':root {',
      `  --bg: ${tokens.bg};`,
      `  --sidebar: ${effectiveSidebar};`,
      `  --surface: ${effectiveSurface};`,
      `  --surface-hover: ${tokens.surfaceHover};`,
      `  --input: ${tokens.input};`,
      `  --overlay: ${tokens.overlay};`,
      `  --text: ${tokens.text};`,
      `  --text-2: ${tokens.text2};`,
      `  --text-muted: ${tokens.textMuted};`,
      `  --text: ${tokens.text};`,
      `  --text-2: ${tokens.text2};`,
      `  --text-muted: ${tokens.textMuted};`,
      `  --border: ${tokens.border};`,
      `  --border: ${tokens.border};`,
      `  --border: ${tokens.border};`,
      `  --border-strong: ${tokens.border};`,
      `  --border-strong: ${tokens.borderHover || tokens.border};`,
      `  --accent: ${tokens.accent};`,
      `  --accent: ${tokens.accent};`,
      `  --accent: ${tokens.accent};`,
      `  --accent: ${tokens.accent};`,
      `  --accent-soft: ${tokens.accentSoft};`,
      `  --accent-soft: ${tokens.accentSoft};`,
      `  --accent-soft: ${tokens.accentSoft};`,
      `  --success: ${tokens.success};`,
      `  --danger: ${tokens.danger};`,
      `  --warning: ${tokens.warning};`,
      `  --info: ${tokens.info};`,
      `  --radius-xs: ${tokens.radiusXs};`,
      `  --radius-sm: ${tokens.radiusSm};`,
      `  --radius-md: ${tokens.radiusMd};`,
      `  --radius-lg: ${tokens.radiusLg};`,
      `  --radius-dropzone: ${tokens.radiusDropzone};`,
      `  --backdrop-blur: ${effectiveBlur};`,
      `  --cat-pdf: #EF4444;`,
      `  --cat-documents: #3B82F6;`,
      `  --cat-images: #22C55E;`,
      `  --cat-data: #F59E0B;`,
      `  --cat-text: #8B5CF6;`,
      `  --cat-developer: #F97316;`,
      `  --cat-calculator: #EAB308;`,
      `  --cat-files: #3B82F6;`,
      `  --cat-system: #64748B;`,
      `  --image-art-opacity: ${resolvedMode === 'light' ? '0.55' : '1.0'};`,
      `  --surface-rgb: ${resolvedMode === 'light' ? '255, 255, 255' : '26, 26, 26'};`,
    ];

    if (tokens.fontSans) {
      cssLines.push(`  --font-sans: ${tokens.fontSans};`);
      cssLines.push(`  --font-display: ${tokens.fontSans};`);
    }
    if (tokens.fontMono) {
      cssLines.push(`  --font-mono: ${tokens.fontMono};`);
    }

    // Shadow strength
    if (tokens.shadowStrength === 'soft') {
      cssLines.push(`  --card-shadow: 0 4px 12px rgba(0, 0, 0, ${resolvedMode === 'dark' ? '0.25' : '0.06'});`);
    } else if (tokens.shadowStrength === 'medium') {
      cssLines.push(`  --card-shadow: 0 8px 24px rgba(0, 0, 0, ${resolvedMode === 'dark' ? '0.40' : '0.10'});`);
    } else {
      cssLines.push(`  --card-shadow: none;`);
    }

    cssLines.push('}');

    // Background handling (Image, Pattern, Material, Chibigi)
    const bgConfig: ThemeBackground = currentTheme.background || { type: 'solid' };
    if (currentTheme.id === 'chibigi') {
      const chibigiWallpaper = resolvedMode === 'dark' ? CHIBIGI_WALLPAPER_DARK : CHIBIGI_WALLPAPER_LIGHT;
      cssLines.push(`
        body {
          background-image: url('${chibigiWallpaper}') !important;
          background-size: 360px 360px !important;
          background-repeat: repeat !important;
          background-attachment: fixed !important;
        }
        body::before, body::after {
          display: none !important;
        }
        :root {
          --chibigi-mascot-bunny: url('${CHIBIGI_MASCOT_BUNNY}');
          --chibigi-mascot-kuma: url('${CHIBIGI_MASCOT_KUMA}');
          --chibigi-mascot-neko: url('${CHIBIGI_MASCOT_NEKO}');
        }
      `);
    } else if (bgConfig.type === 'pattern') {
      if (bgConfig.patternType === 'dots') {
        const dotColor = resolvedMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
        cssLines.push(`body { background-image: radial-gradient(${dotColor} 1px, transparent 1px); background-size: 16px 16px; }`);
      } else if (bgConfig.patternType === 'grid') {
        const gridColor = resolvedMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
        cssLines.push(`body { background-image: linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px); background-size: 20px 20px; }`);
      }
    } else if (bgConfig.type === 'image' && bgConfig.imageUrl) {
      const fit = bgConfig.imageFit || 'cover';
      const pos = bgConfig.imagePosition || 'center';
      const blur = bgConfig.imageBlur ? `blur(${bgConfig.imageBlur}px)` : 'none';
      const dim = (bgConfig.imageDim || 0) / 100;
      cssLines.push(`
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -2;
          background-image: url('${bgConfig.imageUrl}');
          background-size: ${fit};
          background-position: ${pos};
          filter: ${blur};
          pointer-events: none;
        }
        body::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          background-color: rgba(0, 0, 0, ${dim});
          pointer-events: none;
        }
      `);
    } else {
      cssLines.push(`body { background-image: none !important; } body::before, body::after { display: none !important; }`);
    }

    styleEl.textContent = cssLines.join('\n');
    document.documentElement.setAttribute('data-theme', themeMode === 'system' ? 'system' : resolvedMode);
    document.documentElement.setAttribute('data-theme-preset', currentTheme.id);

    const effectiveCardStyle = (currentTheme.id === 'high-contrast')
      ? 'flat'
      : (currentTheme.buttons?.cardStyle || appSettings.buttonCardStyle || 'flat');
    document.documentElement.setAttribute('data-card-style', effectiveCardStyle);
  }, [currentTheme, resolvedMode, themeMode, tokenPatch, prefersReducedTransparency, appSettings]);


  // Mode change applies instantly per requirements
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    SettingsService.saveSettings({ theme: mode });
  }, []);

  const selectTheme = useCallback((themeId: string) => {
    const found = allThemes.find((t) => t.id === themeId);
    if (!found) return;
    setActiveThemeId(found.id);
    setDraftTheme(null);
    setTokenPatch(null);
    SettingsService.saveSettings({ activeThemeId: found.id });
  }, [allThemes]);

  const previewThemeDraft = useCallback((theme: AppTheme) => {
    setDraftTheme(theme);
  }, []);

  const previewTokenOverride = useCallback((patch: Partial<ThemeTokens>) => {
    setTokenPatch((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyChanges = useCallback(() => {
    const finalTheme = draftTheme || activeTheme;
    setActiveThemeId(finalTheme.id);
    setDraftTheme(null);
    setTokenPatch(null);

    // Save to settings
    SettingsService.saveSettings({ activeThemeId: finalTheme.id });
    showToast(`Applied theme: ${finalTheme.name}`, 'success');
  }, [draftTheme, activeTheme, showToast]);

  const revertChanges = useCallback(() => {
    setDraftTheme(null);
    setTokenPatch(null);
    showToast('Reverted unsaved theme changes', 'info');
  }, [showToast]);

  const saveCustomTheme = useCallback((theme: AppTheme) => {
    setCustomThemes((prev) => {
      const idx = prev.findIndex((t) => t.id === theme.id);
      const updated = idx >= 0 ? [...prev.slice(0, idx), theme, ...prev.slice(idx + 1)] : [...prev, theme];
      try {
        localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist custom theme:', err);
      }
      return updated;
    });
    setDraftTheme(theme);
    setTokenPatch(null);
    showToast(`Saved theme "${theme.name}"`, 'success');
  }, [showToast]);

  const createTheme = useCallback((baseThemeId?: string): AppTheme => {
    const base = allThemes.find((t) => t.id === baseThemeId) || BUILTIN_THEMES[0];
    const newId = `custom-theme-${Date.now()}`;
    const newTheme: AppTheme = {
      ...base,
      id: newId,
      name: `${base.name} (Custom)`,
      version: 1,
      isPreset: false,
      assets: [],
    };
    saveCustomTheme(newTheme);
    return newTheme;
  }, [allThemes, saveCustomTheme]);

  const duplicateTheme = useCallback((themeId: string): AppTheme => {
    const target = allThemes.find((t) => t.id === themeId) || BUILTIN_THEMES[0];
    const newTheme: AppTheme = {
      ...target,
      id: `theme-copy-${Date.now()}`,
      name: `${target.name} Copy`,
      version: 1,
      isPreset: false,
    };
    saveCustomTheme(newTheme);
    return newTheme;
  }, [allThemes, saveCustomTheme]);

  const renameTheme = useCallback((themeId: string, newName: string) => {
    const target = customThemes.find((t) => t.id === themeId);
    if (!target) return;
    const updated = { ...target, name: newName.trim() || target.name };
    saveCustomTheme(updated);
  }, [customThemes, saveCustomTheme]);

  const deleteTheme = useCallback((themeId: string) => {
    setCustomThemes((prev) => {
      const filtered = prev.filter((t) => t.id !== themeId);
      try {
        localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) { }
      return filtered;
    });
    if (activeThemeId === themeId) {
      setActiveThemeId('default-clean');
      SettingsService.saveSettings({ activeThemeId: 'default-clean' });
    }
    setDraftTheme(null);
    setTokenPatch(null);
    showToast('Custom theme deleted', 'info');
  }, [activeThemeId, showToast]);

  const exportTheme = useCallback((themeId: string) => {
    const target = allThemes.find((t) => t.id === themeId);
    if (!target) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(target, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${target.id}.toiloki-theme.json`);
    dlAnchorElem.click();
    showToast(`Exported ${target.name} to file`, 'success');
  }, [allThemes, showToast]);

  const importTheme = useCallback(async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const validation = validateThemeJson(text);

      if (!validation.valid || !validation.theme) {
        showToast(validation.error || 'Failed to import theme', 'error');
        return false;
      }

      const imported = validation.theme;
      // Guarantee non-colliding ID
      if (allThemes.some((t) => t.id === imported.id)) {
        imported.id = `${imported.id}-${Date.now().toString().slice(-4)}`;
      }

      saveCustomTheme(imported);
      showToast(`Imported theme "${imported.name}"`, 'success');
      return true;
    } catch (err: any) {
      showToast(`Import error: ${err.message || 'Could not parse file'}`, 'error');
      return false;
    }
  }, [allThemes, saveCustomTheme, showToast]);

  const resetAppearance = useCallback(() => {
    setActiveThemeId('default-clean');
    setThemeModeState('system');
    setDraftTheme(null);
    setTokenPatch(null);
    SettingsService.saveSettings({
      activeThemeId: 'default-clean',
      theme: 'system',
      density: 'compact',
      fontSize: 'medium',
      fontSizeScale: '100%',
      interfaceFont: 'Inter',
      monoFont: 'JetBrains Mono',
      monoFontSize: '13px',
      reduceMotion: 'auto',
      accentColor: 'orange',
      customAccentHex: '#F5A524',
      cornerStyle: 'default',
    });
    showToast('Appearance restored to Default Clean', 'info');

  }, [showToast]);

  const resetSectionAppearance = useCallback(() => {
    resetAppearance();
  }, [resetAppearance]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        resolvedMode,
        activeTheme,
        allThemes,
        customThemes,
        previewTheme: draftTheme,
        hasUnsavedChanges,
        isTranslucentSupported: !prefersReducedTransparency,
        setThemeMode,
        selectTheme,
        previewThemeDraft,
        previewTokenOverride,
        applyChanges,
        revertChanges,
        createTheme,
        saveCustomTheme,
        duplicateTheme,
        renameTheme,
        deleteTheme,
        exportTheme,
        importTheme,
        resetAppearance,
        resetSectionAppearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
