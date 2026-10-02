import React, { useState, useMemo, useEffect } from 'react';

import {
  Palette, Sparkles, MousePointer, Image, FolderOpen, Cpu,
  Clock, ShieldCheck, Wrench, Code, Search
} from 'lucide-react';
import './SettingsLayout.css';
import { useTheme } from '../../../core/theme/ThemeContext';
import { SettingsService, AppSettings } from '../../../core/services/settings.service';
import { AppearanceSection } from './sections/AppearanceSection';
import { ThemesSection } from './sections/ThemesSection';
import { ButtonsSection } from './sections/ButtonsSection';
import { BackgroundSection } from './sections/BackgroundSection';
import { FilesSection } from './sections/FilesSection';
import { ProcessingSection } from './sections/ProcessingSection';
import { HistorySection } from './sections/HistorySection';
import { PrivacySection } from './sections/PrivacySection';
import { AdvancedSection } from './sections/AdvancedSection';
import { DeveloperSection } from './sections/DeveloperSection';
import { StickyFooterBar } from './components/StickyFooterBar';
import { useToast } from '../../../core/context/ToastContext';

type NavSectionId =
  | 'appearance'
  | 'themes'
  | 'buttons'
  | 'background'
  | 'files'
  | 'processing'
  | 'history'
  | 'privacy'
  | 'advanced'
  | 'developer';

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


  // Sections navigation definitions
  const NAV_ITEMS = [
    { id: 'appearance', label: 'Appearance', icon: Palette, keywords: ['theme', 'dark', 'light', 'mode', 'density', 'accent', 'font', 'corner', 'radius', 'motion'] },
    { id: 'themes', label: 'Themes & Presets', icon: Sparkles, keywords: ['preset', 'custom theme', 'export', 'import', 'storeframe', 'translucent', 'dense', 'blue', 'contrast'] },
    { id: 'buttons', label: 'Buttons & Artwork', icon: MousePointer, keywords: ['button', 'icon', 'skin', 'artwork', 'action', 'playground', 'shape'] },
    { id: 'background', label: 'Background', icon: Image, keywords: ['wallpaper', 'pattern', 'blur', 'dim', 'scrim', 'dots', 'grid'] },
    { id: 'files', label: 'Files & Storage', icon: FolderOpen, keywords: ['output', 'export directory', 'collision', 'timestamps'] },
    { id: 'processing', label: 'Processing & Engine', icon: Cpu, keywords: ['threads', 'workers', 'ram', 'memory', 'gpu', 'hardware'] },
    { id: 'history', label: 'Operation History', icon: Clock, keywords: ['logs', 'retention', 'purge', 'exit'] },
    { id: 'privacy', label: 'Privacy & Governance', icon: ShieldCheck, keywords: ['local', 'telemetry', 'analytics', 'offline', 'clear data'] },
    { id: 'advanced', label: 'Advanced', icon: Wrench, keywords: ['cache', 'reset', 'safe mode', 'diagnostics', 'developer toggle'] },
  ];

  if (effectiveSettings.showDeveloper) {
    NAV_ITEMS.push({
      id: 'developer',
      label: 'Developer Suite',
      icon: Code,
      keywords: ['tokens', 'inspect', 'fps', 'perf', 'grid', 'outlines', 'component gallery', 'json diff', 'flags'],
    });
  }

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
                onClick={() => setActiveSection(item.id as NavSectionId)}
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

          {activeSection === 'themes' && <ThemesSection />}

          {activeSection === 'buttons' && <ButtonsSection />}

          {activeSection === 'background' && <BackgroundSection />}

          {activeSection === 'files' && (
            <FilesSection
              settings={effectiveSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeSection === 'processing' && (
            <ProcessingSection
              settings={effectiveSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeSection === 'history' && (
            <HistorySection
              settings={effectiveSettings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeSection === 'privacy' && (
            <PrivacySection
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

          {activeSection === 'developer' && effectiveSettings.showDeveloper && (
            <DeveloperSection
              settings={effectiveSettings}
              onUpdateSettings={handleUpdateSettings}
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
