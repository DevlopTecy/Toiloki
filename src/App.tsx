import React, { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { TabBar, UtilityTabItem } from './components/layout/TabBar';
import { Sidebar, ActiveNav } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardHome } from './workspaces/home/DashboardHome';
import { WorkspaceView } from './workspaces/WorkspaceView';
import { CommandPalette } from './components/search/CommandPalette';
import { SmartPasteModal } from './components/common/SmartPasteModal';
import { DropAnywhereOverlay, DropTargetUtility } from './components/common/DropAnywhereOverlay';
import { ChainsModal } from './components/common/ChainsModal';
import { ShortcutSheetModal } from './components/common/ShortcutSheetModal';
import { IntroModal } from './components/common/IntroModal';
import { FavoritesView } from './components/views/FavoritesView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { TrashView } from './components/views/TrashView';
import { ToastProvider, useToast } from './core/context/ToastContext';
import { ThemeProvider } from './core/theme/ThemeContext';
import { SettingsService } from './core/services/settings.service';
import { MigrationService } from './core/services/migration.service';
import { PipeService } from './core/services/pipe.service';
import { WORKSPACES, findUtilityByFeatureId } from './core/registry/app-registry';
import { WorkspaceId } from './core/types/workspace';
import './styles/global.css';

const AppContent: React.FC = () => {
  const [activeNav, setActiveNav] = useState<ActiveNav>('home');
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [selectedUtilityId, setSelectedUtilityId] = useState<string | undefined>();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | undefined>();

  // Modals & Overlays
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  const [isChainsOpen, setIsChainsOpen] = useState(false);
  const [isShortcutSheetOpen, setIsShortcutSheetOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(() => {
    return typeof window !== 'undefined' && !localStorage.getItem('toiloki_intro_completed');
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Drop Anywhere state
  const [isDragOverActive, setIsDragOverActive] = useState(false);
  const [draggedFileName, setDraggedFileName] = useState('file');
  const [draggedFileExt, setDraggedFileExt] = useState('');

  // Utility Tabs state
  const [tabs, setTabs] = useState<UtilityTabItem[]>([
    { id: 'tab-home', workspaceId: 'home', title: 'Home' },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-home');

  const { showToast } = useToast();

  const getUtilityName = (workspaceId: WorkspaceId, groupId: string, utilityId: string): string => {
    const ws = WORKSPACES.find((w) => w.id === workspaceId);
    const grp = ws?.groups.find((g) => g.id === groupId);
    const util = grp?.utilities.find((u) => u.id === utilityId);
    return util?.name || utilityId;
  };

  // Run one-time migration and initialize theme, density, and font scaling on boot
  useEffect(() => {
    MigrationService.runMigration();

    const params = new URLSearchParams(window.location.search);
    const navParam = params.get('nav');
    const groupParam = params.get('group') || params.get('util');
    const utilParam = params.get('utility') || params.get('feat');
    const featureParam = params.get('feature');
    const themeParam = params.get('theme');

    const settings = SettingsService.getSettings();
    if (themeParam) {
      settings.theme = themeParam;
      SettingsService.saveSettings({ theme: themeParam });
    } else {
      SettingsService.applyDomSettings(settings);
    }

    if (featureParam) {
      setSelectedFeatureId(featureParam);
      const matched = findUtilityByFeatureId(featureParam);
      if (matched) {
        handleSelectUtility(matched.workspace.id, matched.group.id, matched.utility.id, featureParam);
      }
    } else if (navParam) {
      if (groupParam && utilParam) {
        handleSelectUtility(navParam as WorkspaceId, groupParam, utilParam);
      } else {
        setActiveNav(navParam as ActiveNav);
      }
    }

    // Suppress initial flash: remove preload class after mount
    requestAnimationFrame(() => {
      document.body.classList.remove('preload');
    });
  }, []);

  // Listen to Send To custom events
  useEffect(() => {
    const handleNavigateUtility = (e: any) => {
      const { workspaceId, groupId, utilityId } = e.detail || {};
      if (workspaceId && groupId && utilityId) {
        handleSelectUtility(workspaceId, groupId, utilityId);
      }
    };

    window.addEventListener('toiloki-navigate-utility', handleNavigateUtility);
    return () => window.removeEventListener('toiloki-navigate-utility', handleNavigateUtility);
  }, []);

  // Listen to Electron appBridge events ("Open with Toiloki", Tray shortcuts, Global hotkey)
  useEffect(() => {
    const toiloki = (window as any).toiloki;
    if (!toiloki?.appBridge) return;

    // Handle "Open with Toiloki" file argument
    const unbindOpenFile = toiloki.appBridge.onOpenFile(async (filePath: string) => {
      const fileName = filePath.split(/[\\/]/).pop() || 'file';
      const ext = fileName.split('.').pop()?.toLowerCase() || '';

      // Determine matching workspace/tool
      let targetWs: WorkspaceId = 'files';
      let targetGroup = 'files-operations';
      let targetUtil = 'file-type-detection';

      if (ext === 'pdf') {
        targetWs = 'pdf';
        targetGroup = 'pdf-optimizer';
        targetUtil = 'compress-pdf';
      } else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
        targetWs = 'images';
        targetGroup = 'img-optimizer';
        targetUtil = 'compress-image';
      } else if (['csv', 'tsv'].includes(ext)) {
        targetWs = 'data';
        targetGroup = 'data-tabular';
        targetUtil = 'csv-viewer';
      } else if (ext === 'json') {
        targetWs = 'developer';
        targetGroup = 'dev-formatter';
        targetUtil = 'format-json-code';
      } else if (['zip', 'tar', 'gz', '7z'].includes(ext)) {
        targetWs = 'files';
        targetGroup = 'files-archives';
        targetUtil = 'inspect-zip-archive';
      }

      // Read file buffer and pipe to target tool
      try {
        const fileRes = await toiloki.fs.readFileBuffer(filePath);
        if (fileRes.success && fileRes.data) {
          PipeService.pipeToUtility(targetUtil, {
            buffer: fileRes.data,
            fileName,
            format: ext,
            sourceUtilityName: 'Open with Toiloki',
          });
        }
      } catch (err) {
        console.error('Failed to read external file:', err);
      }

      showToast(`Opened "${fileName}" in ${targetUtil}`, 'info');
      handleSelectUtility(targetWs, targetGroup, targetUtil);
    });

    const unbindCommandPalette = toiloki.appBridge.onTriggerCommandPalette(() => {
      setIsCommandPaletteOpen((prev) => !prev);
    });

    const unbindSmartPaste = toiloki.appBridge.onTriggerSmartPaste(() => {
      setIsSmartPasteOpen(true);
    });

    const unbindNavigate = toiloki.appBridge.onNavigateWorkspace((wsId: WorkspaceId) => {
      handleSelectWorkspace(wsId);
    });

    return () => {
      unbindOpenFile?.();
      unbindCommandPalette?.();
      unbindSmartPaste?.();
      unbindNavigate?.();
    };
  }, [showToast]);

  // Window-level Drag and Drop Listener for Drop Anywhere
  useEffect(() => {
    let dragCounter = 0;

    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            setDraggedFileName(file.name);
            setDraggedFileExt(file.name.split('.').pop() || '');
          }
          setIsDragOverActive(true);
        }
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragOverActive(false);
        dragCounter = 0;
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      dragCounter = 0;
      // DropAnywhereOverlay handles specific drops; if dropped outside, reset
      setIsDragOverActive(false);
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Global Keyboard Shortcuts (Ctrl+O, Ctrl+S, Ctrl+F, Ctrl+K, Ctrl+Shift+V, Ctrl+W, Ctrl+T, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;

      // Ctrl+Shift+V: Open Smart Paste
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setIsSmartPasteOpen(true);
      }
      // Ctrl+Shift+M: Dev toggle 5x slow motion for review
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
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
      // Ctrl+Shift+C: Copy active result
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toiloki-trigger-copy-result'));
      }
      // Ctrl+Enter: Run active utility
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toiloki-trigger-run'));
        showToast('Running active utility...', 'info');
      }
      // Ctrl+F or Ctrl+K: Open Search
      else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // ? (Shift+/): Open Keyboard Shortcuts Cheatsheet
      else if (!isEditable && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        setIsShortcutSheetOpen((prev) => !prev);
      }
      // Ctrl+W: Close active tab
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleCloseTab(activeTabId);
      }
      // Ctrl+T: New tab
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
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
      // Escape: Close modals
      else if (e.key === 'Escape') {
        if (isShortcutSheetOpen) setIsShortcutSheetOpen(false);
        if (isIntroOpen) setIsIntroOpen(false);
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        if (isSmartPasteOpen) setIsSmartPasteOpen(false);
        if (isChainsOpen) setIsChainsOpen(false);
        if (isDragOverActive) setIsDragOverActive(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCommandPaletteOpen, isSmartPasteOpen, isChainsOpen, isShortcutSheetOpen, isIntroOpen, isDragOverActive, activeTabId, showToast]);

  // Tab management
  const handleSelectTab = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    setActiveTabId(tabId);
    setActiveNav(tab.workspaceId);
    setSelectedGroupId(tab.groupId);
    setSelectedUtilityId(tab.utilityId);
    setSelectedFeatureId(tab.featureId);
  };

  const handleCloseTab = (tabIdToClose: string) => {
    if (tabs.length <= 1) return; // Keep at least one tab
    const closeIdx = tabs.findIndex((t) => t.id === tabIdToClose);
    const newTabs = tabs.filter((t) => t.id !== tabIdToClose);
    setTabs(newTabs);

    if (activeTabId === tabIdToClose) {
      const nextActiveIdx = Math.max(0, closeIdx - 1);
      const nextTab = newTabs[nextActiveIdx];
      setActiveTabId(nextTab.id);
      setActiveNav(nextTab.workspaceId);
      setSelectedGroupId(nextTab.groupId);
      setSelectedUtilityId(nextTab.utilityId);
      setSelectedFeatureId(nextTab.featureId);
    }
  };

  const handleNewTab = () => {
    const newId = `tab_${Date.now()}`;
    const newTab: UtilityTabItem = {
      id: newId,
      workspaceId: 'home',
      title: 'Home',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setActiveNav('home');
    setSelectedGroupId(undefined);
    setSelectedUtilityId(undefined);
    setSelectedFeatureId(undefined);
  };

  const handleSelectWorkspace = (id: WorkspaceId) => {
    setActiveNav(id);
    setSelectedGroupId(undefined);
    setSelectedUtilityId(undefined);

    // Update active tab title
    const ws = WORKSPACES.find((w) => w.id === id);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, workspaceId: id, groupId: undefined, utilityId: undefined, title: ws?.name || id }
          : t
      )
    );
  };

  const handleSelectUtility = (
    workspaceId: WorkspaceId,
    groupId: string,
    utilityId: string,
    featureId?: string
  ) => {
    setActiveNav(workspaceId);
    setSelectedGroupId(groupId);
    setSelectedUtilityId(utilityId);
    setSelectedFeatureId(featureId);

    const title = getUtilityName(workspaceId, groupId, utilityId);

    // Update active tab or convert home tab into utility tab
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              workspaceId,
              groupId,
              utilityId,
              featureId,
              title,
            }
          : t
      )
    );

    const url = new URL(window.location.href);
    url.searchParams.set('nav', workspaceId);
    url.searchParams.set('group', groupId);
    url.searchParams.set('utility', utilityId);
    if (featureId) {
      url.searchParams.set('feature', featureId);
    } else {
      url.searchParams.delete('feature');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Drop Anywhere handler
  const handleDropAccepted = async (target: DropTargetUtility, file: File) => {
    setIsDragOverActive(false);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      PipeService.pipeToUtility(target.utilityId, {
        buffer,
        fileName: file.name,
        format: file.name.split('.').pop() || '',
        sourceUtilityName: 'Drop Anywhere',
      });
      showToast(`Loaded "${file.name}" into ${target.name}`, 'success');
      handleSelectUtility(target.workspaceId, target.groupId, target.utilityId);
    } catch (err) {
      console.error('Failed to pipe dropped file:', err);
    }
  };

  const activeWorkspace = WORKSPACES.find((w) => w.id === activeNav);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <TitleBar
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
      />

      {/* Utility Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar activeNav={activeNav} onSelectNav={(nav) => {
          if (nav === 'workflows') {
            setIsChainsOpen(true);
            return;
          }
          setActiveNav(nav);
          setTabs((prev) =>
            prev.map((t) => (t.id === activeTabId ? { ...t, workspaceId: nav, title: String(nav).toUpperCase() } : t))
          );
        }} />

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
                onSelectUtility={handleSelectUtility}
              />
            </>
          )}

          {activeWorkspace && (
            <WorkspaceView
              workspace={activeWorkspace}
              initialGroupId={selectedGroupId}
              initialUtilityId={selectedUtilityId}
              initialFeatureId={selectedFeatureId}
              onBackToHome={() => setActiveNav('home')}
            />
          )}

          {activeNav === 'history' && (
            <HistoryView onOpenUtility={handleSelectUtility} />
          )}
          {activeNav === 'favorites' && (
            <FavoritesView onSelectUtility={handleSelectUtility} />
          )}
          {activeNav === 'trash' && <TrashView />}
          {activeNav === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Omnisearch Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectUtility={handleSelectUtility}
      />

      {/* Smart Paste Sniffer Modal */}
      <SmartPasteModal
        isOpen={isSmartPasteOpen}
        onClose={() => setIsSmartPasteOpen(false)}
        onSelectUtility={handleSelectUtility}
      />

      {/* Chains & Presets Modal */}
      <ChainsModal
        isOpen={isChainsOpen}
        onClose={() => setIsChainsOpen(false)}
        onLaunchUtility={handleSelectUtility}
      />

      {/* Drop Anywhere Interactive Overlay */}
      {isDragOverActive && (
        <DropAnywhereOverlay
          fileName={draggedFileName}
          fileExt={draggedFileExt}
          onDropAccepted={handleDropAccepted}
          onCancel={() => setIsDragOverActive(false)}
        />
      )}

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <ShortcutSheetModal
        isOpen={isShortcutSheetOpen}
        onClose={() => setIsShortcutSheetOpen(false)}
      />

      {/* First-Run Intro / Onboarding Tour Modal */}
      <IntroModal
        isOpen={isIntroOpen}
        onClose={() => setIsIntroOpen(false)}
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
