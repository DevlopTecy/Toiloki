import React, { useState, useMemo, useEffect } from 'react';
import {
  Palette, FolderOpen, Cpu, ShieldCheck, Wrench, Search
} from 'lucide-react';
import './SettingsLayout.css';
import { useTheme } from '../../../core/theme/ThemeContext';
import { SettingsService, AppSettings } from '../../../core/services/settings.service';
import { AppearanceSection } from './sections/AppearanceSection';
import { FilesSection } from './sections/FilesSection';
import { ProcessingSection } from './sections/ProcessingSection';
import { HistoryPrivacySection } from './sections/HistoryPrivacySection';
import { AdvancedSection } from './sections/AdvancedSection';
import { StickyFooterBar } from './components/StickyFooterBar';
import { useToast } from '../../../core/context/ToastContext';

export type NavSectionId =
  | 'appearance'
  | 'files'
  | 'performance'
  | 'privacy'
  | 'advanced';

export const SettingsLayout: React.FC = () => {
  const { hasUnsavedChanges, applyChanges, revertChanges } = useTheme();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<NavSectionId>('appearance');
  const [searchQuery, setSearchQuery] = useState('');

  // Local settings state
  const [settings, setSettings] = useState<AppSettings>(() => SettingsService.getSettings());
  const [pendingSettingsPatch, setPendingSettingsPatch] = useState<Partial<AppSettings>>({});

  useEffect(() => {
    return SettingsService.subscribe((updated) => {
      setSettings(updated);
    });
  }, []);

  const effectiveSettings = useMemo(() => {
    return { ...settings, ...pendingSettingsPatch };
  }, [settings, pendingSettingsPatch]);

  const hasPendingSettings = Object.keys(pendingSettingsPatch).length > 0;
  const showStickyFooter = hasUnsavedChanges || hasPendingSettings;

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setPendingSettingsPatch((prev) => ({ ...prev, ...patch }));
  };

  const handleApplyAll = () => {
    if (hasPendingSettings) {
      SettingsService.saveSettings(pendingSettingsPatch);
      setPendingSettingsPatch({});
    }
    if (hasUnsavedChanges) {
      applyChanges();
    }
    showToast('Preferences and theme saved successfully', 'success');
  };

  const handleRevertAll = () => {
    setPendingSettingsPatch({});
    if (hasUnsavedChanges) {
      revertChanges();
    }
    showToast('Reverted unsaved changes', 'info');
  };

  const handleResetAllDefaults = () => {
    const defaults = SettingsService.resetDefaults();
    setSettings(defaults);
    setPendingSettingsPatch({});
    showToast('All settings reset to defaults', 'info');
  };

  // Exactly 5 Locked Sections as per Master Plan Phase 11
  const NAV_ITEMS = [
    {
      id: 'appearance' as NavSectionId,
      label: 'Appearance',
      icon: Palette,
      keywords: ['theme', 'dark', 'light', 'mode', 'density', 'accent', 'font', 'corner', 'radius', 'motion', 'wallpaper', 'background', 'buttons', 'cards', 'gallery', 'workbench'],
    },
    {
      id: 'files' as NavSectionId,
      label: 'Files & Output',
      icon: FolderOpen,
      keywords: ['output', 'export directory', 'collision', 'timestamps', 'dates', 'associations', 'cache', 'naming template', 'preview'],
    },
    {
      id: 'performance' as NavSectionId,
      label: 'Performance',
      icon: Cpu,
      keywords: ['threads', 'workers', 'ram', 'memory', 'gpu', 'hardware', 'auto', 'fast', 'low memory'],
    },
    {
      id: 'privacy' as NavSectionId,
      label: 'History & Privacy',
      icon: ShieldCheck,
      keywords: ['logs', 'retention', 'purge', 'exit', 'telemetry', 'analytics', 'offline', 'clear data', 'privacy', 'shield'],
    },
    {
      id: 'advanced' as NavSectionId,
      label: 'Advanced',
      icon: Wrench,
      keywords: ['cache', 'reset', 'safe mode', 'diagnostics', 'developer', 'tokens', 'portable', 'upcoming', 'gallery'],
    },
  ];

  // Filter sections by search query
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return NAV_ITEMS;
    const q = searchQuery.toLowerCase();
    return NAV_ITEMS.filter((item) => {
      return (
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [NAV_ITEMS, searchQuery]);

  return (
    <div className="settings-shell">
      {/* ─── Settings Nav Sidebar (232px) ─── */}
      <aside className="settings-nav-panel">
        <div className="settings-nav-search-box">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={13}
              style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)', pointerEvents: 'none' }}
            />
            <input
              type="text"
              className="settings-nav-search-input"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '28px' }}
            />
          </div>
        </div>

        <nav className="settings-nav-list">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`settings-nav-item ${isActive ? 'is-active' : ''}`}
                data-settings-nav={item.id}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─── Settings Content Canvas (max-width 880px, padding 32px) ─── */}
      <main className="settings-content-canvas">
        <div className="settings-content-inner">
          {activeSection === 'appearance' && (
            <AppearanceSection
              settings={effectiveSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeSection === 'files' && (
            <FilesSection
              settings={effectiveSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeSection === 'performance' && (
            <ProcessingSection
              settings={effectiveSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeSection === 'privacy' && (
            <HistoryPrivacySection
              settings={effectiveSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeSection === 'advanced' && (
            <AdvancedSection
              settings={effectiveSettings}
              onUpdateSettings={handleUpdateSettings}
              onResetAllDefaults={handleResetAllDefaults}
            />
          )}
        </div>

        {/* Sticky Footer Bar for uncommitted changes */}
        <StickyFooterBar
          show={showStickyFooter}
          onRevert={handleRevertAll}
          onApply={handleApplyAll}
        />
      </main>
    </div>
  );
};
