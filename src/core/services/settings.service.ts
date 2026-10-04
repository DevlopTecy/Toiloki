export interface AppSettings {
  // Appearance & Theme
  theme: string; // 'light' | 'dark' | 'system'
  activeThemeId: string;
  density: 'compact' | 'default' | 'comfortable';
  fontSize: 'small' | 'medium' | 'large';
  fontSizeScale: '90%' | '100%' | '110%' | '125%';
  interfaceFont: string;
  monoFont: string;
  monoFontSize: string;
  accentColor: string; // 'orange' | 'blue' | 'teal' | 'green' | 'violet' | 'pink' | 'red' | 'neutral' | 'custom'
  customAccentHex?: string;
  cornerStyle: 'sharp' | 'default' | 'round';
  buttonCardStyle: 'flat' | 'image';
  windowEffect: 'none' | 'mica' | 'acrylic';
  windowOpacity: number;
  reduceMotion: 'auto' | 'on' | 'off';
  layout: 'workbench' | 'classic';

  // Workspace Visibility (Appearance)
  visibleWorkspaces: string[];

  // Advanced & Roadmap
  showUpcomingUtilities: boolean;

  // Processing
  threads: string;
  memoryLimit: string;
  hardwareAccel: boolean;
  performanceMode?: 'auto' | 'fast' | 'low-memory' | 'custom';

  // Files & Storage
  outputDir: string;
  namingTemplate: string;
  conflictBehavior: 'auto-rename' | 'overwrite' | 'ask' | 'prompt';
  preserveTimestamps: boolean;
  tempCleanupPolicy: 'manual' | 'daily' | 'on-exit';
  portableMode: boolean;
  fileAssociationsEnabled: boolean;

  // History & Privacy
  keepHistory: boolean;
  retentionDays: string;
  clearOnExit: boolean;

  // Developer & Diagnostics
  showDeveloper: boolean;
  logLevel: 'off' | 'error' | 'warn' | 'info' | 'debug';
  experimentalFlags: Record<string, boolean>;
  safeMode: boolean;
  consecutiveCrashes: number;
}

const STORAGE_KEY = 'toiloki_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  activeThemeId: 'default-clean',
  density: 'default',
  fontSize: 'medium',
  fontSizeScale: '100%',
  interfaceFont: 'Inter',
  monoFont: 'JetBrains Mono',
  monoFontSize: '13px',
  accentColor: 'orange',
  customAccentHex: '#F5A524',
  cornerStyle: 'default',
  buttonCardStyle: 'flat',
  windowEffect: 'none',
  windowOpacity: 100,
  reduceMotion: 'auto',
  layout: 'workbench',

  visibleWorkspaces: [
    'pdf',
    'documents',
    'images',
    'data',
    'text',
    'developer',
    'calculator',
    'files',
    'security',
    'media',
    'network',
    'design',
    'system',
  ],
  showUpcomingUtilities: false,

  threads: '4',
  memoryLimit: '1024',
  hardwareAccel: true,
  performanceMode: 'auto',

  outputDir: 'C:\\Users\\User\\Downloads\\Toiloki Output',
  namingTemplate: '{name}_{tool}_{date}',
  conflictBehavior: 'auto-rename',
  preserveTimestamps: true,
  tempCleanupPolicy: 'on-exit',
  portableMode: false,
  fileAssociationsEnabled: true,

  keepHistory: true,
  retentionDays: '30',
  clearOnExit: false,

  showDeveloper: false,
  logLevel: 'info',
  experimentalFlags: {
    'canvas-acceleration': true,
    'virtualized-data-table': true,
    'fast-pdf-render': true,
  },
  safeMode: false,
  consecutiveCrashes: 0,
};

export type SettingsListener = (settings: AppSettings) => void;
const listeners = new Set<SettingsListener>();

export class SettingsService {
  /**
   * Subscribe to settings updates
   */
  static subscribe(listener: SettingsListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  private static notifyListeners(settings: AppSettings): void {
    listeners.forEach((fn) => {
      try {
        fn(settings);
      } catch (err) {
        console.error('Settings listener error:', err);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toiloki-settings-changed', { detail: settings }));
    }
  }

  /**
   * Load stored settings or default settings
   */
  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          visibleWorkspaces: Array.isArray(parsed.visibleWorkspaces) && parsed.visibleWorkspaces.length > 0
            ? parsed.visibleWorkspaces
            : DEFAULT_SETTINGS.visibleWorkspaces,
          showUpcomingUtilities: typeof parsed.showUpcomingUtilities === 'boolean'
            ? parsed.showUpcomingUtilities
            : DEFAULT_SETTINGS.showUpcomingUtilities,
        };
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save partial or complete settings
   */
  static saveSettings(updates: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      this.applyDomSettings(updated);
      this.notifyListeners(updated);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }

    return updated;
  }

  /**
   * Reset settings to default
   */
  static resetDefaults(): AppSettings {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      this.applyDomSettings(DEFAULT_SETTINGS);
      this.notifyListeners(DEFAULT_SETTINGS);
    } catch (err) {
      console.error('Failed to reset settings:', err);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Apply settings to the DOM (for density, font scaling, motion, corner style)
   */
  static applyDomSettings(settings: AppSettings): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-density', settings.density);
    document.documentElement.setAttribute('data-fontsize', settings.fontSize);
    document.documentElement.setAttribute('data-fontscale', settings.fontSizeScale);
    document.documentElement.setAttribute('data-motion', settings.reduceMotion || 'auto');
    document.documentElement.setAttribute('data-corner', settings.cornerStyle || 'default');
    document.documentElement.setAttribute('data-card-style', settings.buttonCardStyle || 'flat');

    if (settings.fontSizeScale) {
      document.documentElement.style.fontSize = settings.fontSizeScale;
    }

    if (settings.safeMode) {
      document.documentElement.setAttribute('data-safe-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-safe-mode');
    }
  }
}

