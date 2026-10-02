import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar, ActiveNav } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardHome } from './workspaces/home/DashboardHome';
import { WorkspaceView } from './workspaces/WorkspaceView';
import { CommandPalette } from './components/search/CommandPalette';
import { FavoritesView } from './components/views/FavoritesView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { ToastProvider, useToast } from './core/context/ToastContext';
import { ThemeProvider } from './core/theme/ThemeContext';
import { SettingsService } from './core/services/settings.service';
import { WORKSPACES } from './core/registry/app-registry';
import { WorkspaceId } from './core/types/workspace';
import './styles/global.css';

const AppContent: React.FC = () => {
  const [activeNav, setActiveNav] = useState<ActiveNav>('home');
  const [selectedUtilityId, setSelectedUtilityId] = useState<string | undefined>();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | undefined>();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Initialize theme, density, and font scaling on boot (with optional URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const navParam = params.get('nav');
    const utilParam = params.get('util');
    const featParam = params.get('feat');
    const themeParam = params.get('theme');

    const settings = SettingsService.getSettings();
    if (themeParam) {
      settings.theme = themeParam;
      SettingsService.saveSettings({ theme: themeParam });
    } else {
      SettingsService.applyDomSettings(settings);
    }

    if (navParam) {
      setActiveNav(navParam as ActiveNav);
      if (utilParam) setSelectedUtilityId(utilParam);
      if (featParam) setSelectedFeatureId(featParam);
    }

    // Suppress initial flash: remove preload class after mount
    requestAnimationFrame(() => {
      document.body.classList.remove('preload');
    });
  }, []);

  // Global Keyboard Shortcuts (Ctrl+O, Ctrl+S, Ctrl+F, Ctrl+K, Ctrl+Shift+M, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+M: Dev toggle 5x slow motion for review
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const isSlow = document.documentElement.getAttribute('data-motion-slow') === 'true';
        if (isSlow) {
          document.documentElement.removeAttribute('data-motion-slow');
          showToast('Motion speed: Normal (1x)', 'info');
        } else {
          document.documentElement.setAttribute('data-motion-slow', 'true');
          showToast('Motion speed: 5x Slow Motion (Review Mode)', 'info');
        }
      }
      // Ctrl+F or Ctrl+K: Open Search
      else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Ctrl+O: Open file
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        showToast('Ready to accept files. Drag & drop or browse.', 'info');
      }
      // Ctrl+S: Save result notification
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        showToast('Use "Save Result" or "Save" button to export file.', 'info');
      }
      // Escape: Close search
      else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCommandPaletteOpen, showToast]);

  const handleSelectWorkspace = (id: WorkspaceId) => {
    setActiveNav(id);
    setSelectedUtilityId(undefined);
    setSelectedFeatureId(undefined);
  };

  const handleSelectUtility = (workspaceId: WorkspaceId, utilityId: string) => {
    setActiveNav(workspaceId);
    setSelectedUtilityId(utilityId);
    setSelectedFeatureId(undefined);
  };

  const handleSelectFeatureFromSearch = (
    workspaceId: WorkspaceId,
    utilityId: string,
    featureId: string
  ) => {
    setActiveNav(workspaceId);
    setSelectedUtilityId(utilityId);
    setSelectedFeatureId(featureId);
  };

  const activeWorkspace = WORKSPACES.find((w) => w.id === activeNav);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <TitleBar onOpenSearch={() => setIsCommandPaletteOpen(true)} />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar activeNav={activeNav} onSelectNav={setActiveNav} />

        <main
          key={activeNav}
          className="app-main-workspace motion-fade-in"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}
        >
          {activeNav === 'home' && (
            <>
              <Header
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenSearchModal={() => setIsCommandPaletteOpen(true)}
                showHeroBanner={true}
              />
              <DashboardHome
                onSelectWorkspace={handleSelectWorkspace}
                onSelectTool={handleSelectFeatureFromSearch}
              />
            </>
          )}

          {activeWorkspace && (
            <WorkspaceView
              workspace={activeWorkspace}
              initialUtilityId={selectedUtilityId}
              initialFeatureId={selectedFeatureId}
              onBackToHome={() => setActiveNav('home')}
            />
          )}

          {activeNav === 'history' && (
            <HistoryView onOpenTool={handleSelectFeatureFromSearch} />
          )}
          {activeNav === 'favorites' && (
            <FavoritesView onSelectFeature={handleSelectFeatureFromSearch} />
          )}
          {activeNav === 'settings' && <SettingsView />}
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectFeature={handleSelectFeatureFromSearch}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ToastProvider>
  );

};

export default App;
