import React, { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { TabBar, UtilityTabItem } from './components/layout/TabBar';
import { Sidebar, ActiveNav } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardHome } from './workspaces/home/DashboardHome';
import { WorkspaceView } from './workspaces/WorkspaceView';
import { NewTabPage } from './components/views/NewTabPage';
import { DropAnywhereOverlay, DropTargetUtility } from './components/common/DropAnywhereOverlay';
import { ShortcutSheetModal } from './components/common/ShortcutSheetModal';
import { IntroModal } from './components/common/IntroModal';
import { FavoritesView } from './components/views/FavoritesView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { TrashView } from './components/views/TrashView';
import { ToastProvider, useToast } from './core/context/ToastContext';
import { ThemeProvider } from './core/theme/ThemeContext';
import { SettingsService } from './core/services/settings.service';
import { SessionStore } from './core/services/session.service';
import { MigrationService } from './core/services/migration.service';
import { PipeService } from './core/services/pipe.service';
import { WORKSPACES, findUtilityByFeatureId } from './core/registry/app-registry';
import { WorkspaceId } from './core/types/workspace';
import './styles/global.css';

const getWorkspaceSentenceName = (id: string): string => {
  const ws = WORKSPACES.find((w) => w.id === id);
  if (ws) return ws.name;
  switch (id) {
    case 'home': return 'Home';
    case 'new-tab': return 'New tab';
    case 'history': return 'History';
    case 'favorites': return 'Favorites';
    case 'settings': return 'Settings';
    case 'trash': return 'Trash';
    default: return id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
  }
};

const AppContent: React.FC = () => {
  const [activeNav, setActiveNav] = useState<ActiveNav>('home');
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [selectedUtilityId, setSelectedUtilityId] = useState<string | undefined>();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | undefined>();

  // Modals & Overlays
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

  // Confirmation modal for tabs holding files or unsaved changes
  const [confirmCloseTab, setConfirmCloseTab] = useState<UtilityTabItem | null>(null);

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
        handleSelectWorkspace(navParam as ActiveNav);
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

  // Listen to session updates to reflect dot indicator and file presence on tabs
  useEffect(() => {
    const handleSessionUpdated = (e: any) => {
      const { tabId, workspaceId, hasFiles, fileCount } = e.detail || {};
      setTabs((currentTabs) =>
        currentTabs.map((t) => {
          if (t.id === tabId || (workspaceId && t.workspaceId === workspaceId)) {
            return {
              ...t,
              hasFiles: Boolean(hasFiles),
              fileCount: typeof fileCount === 'number' ? fileCount : hasFiles ? 1 : 0,
            };
          }
          return t;
        })
      );
    };

    window.addEventListener('toiloki-session-updated', handleSessionUpdated);
    return () => window.removeEventListener('toiloki-session-updated', handleSessionUpdated);
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
        targetGroup = 'img-dimensions';
        targetUtil = 'img-resize';
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

    const unbindNavigate = toiloki.appBridge.onNavigateWorkspace((wsId: WorkspaceId) => {
      handleSelectWorkspace(wsId);
    });

    return () => {
      unbindOpenFile?.();
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;

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
      // Ctrl+Shift+C: Copy active result
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toiloki-trigger-copy-result'));
      }
      // Ctrl+Enter: Run active utility (when not in search or editable)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isEditable) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toiloki-trigger-run'));
        showToast('Running active utility...', 'info');
      }
      // ? (Shift+/): Open Keyboard Shortcuts Cheatsheet
      else if (!isEditable && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        setIsShortcutSheetOpen((prev) => !prev);
      }
      // Ctrl+W: Close active tab
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        requestCloseTab(activeTabId);
      }
      // Ctrl+T: New tab
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl+Tab & Ctrl+Shift+Tab: Switch tabs
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        setTabs((currentTabs) => {
          const idx = currentTabs.findIndex((t) => t.id === activeTabId);
          if (idx === -1) return currentTabs;
          const nextIdx = e.shiftKey
            ? (idx - 1 + currentTabs.length) % currentTabs.length
            : (idx + 1) % currentTabs.length;
          const nextTab = currentTabs[nextIdx];
          setActiveTabId(nextTab.id);
          setActiveNav(nextTab.workspaceId as ActiveNav);
          setSelectedGroupId(nextTab.groupId);
          setSelectedUtilityId(nextTab.utilityId);
          setSelectedFeatureId(nextTab.featureId);
          return currentTabs;
        });
      }
      // Ctrl+1 through Ctrl+9: Jump to specific tab
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key >= '1' && e.key <= '9') {
        const targetIdx = parseInt(e.key, 10) - 1;
        if (tabs[targetIdx]) {
          e.preventDefault();
          handleSelectTab(tabs[targetIdx].id);
        }
      }
      // Ctrl+O: Open file hint
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
        if (confirmCloseTab) setConfirmCloseTab(null);
        if (isShortcutSheetOpen) setIsShortcutSheetOpen(false);
        if (isIntroOpen) setIsIntroOpen(false);
        if (isDragOverActive) setIsDragOverActive(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [confirmCloseTab, isShortcutSheetOpen, isIntroOpen, isDragOverActive, activeTabId, tabs, showToast]);

  // Tab management
  const handleSelectTab = (tabId: string, customTabs?: UtilityTabItem[]) => {
    const list = customTabs || tabs;
    const tab = list.find((t) => t.id === tabId);
    if (!tab) return;
    setActiveTabId(tabId);
    setActiveNav(tab.workspaceId as ActiveNav);
    setSelectedGroupId(tab.groupId);
    setSelectedUtilityId(tab.utilityId);
    setSelectedFeatureId(tab.featureId);
  };

  const requestCloseTab = (tabIdToClose: string) => {
    const tab = tabs.find((t) => t.id === tabIdToClose);
    if (!tab) return;
    if (tab.hasFiles || tab.hasUnsaved) {
      setConfirmCloseTab(tab);
      return;
    }
    executeCloseTab(tabIdToClose);
  };

  const executeCloseTab = (tabIdToClose: string) => {
    const tabToClose = tabs.find((t) => t.id === tabIdToClose);
    if (!tabToClose) return;
    // Don't close if only home tab is open
    if (tabToClose.workspaceId === 'home' && tabs.length === 1) return;

    const closeIdx = tabs.findIndex((t) => t.id === tabIdToClose);
    const newTabs = tabs.filter((t) => t.id !== tabIdToClose);
    const resolvedTabs = newTabs.length > 0 ? newTabs : [{ id: 'tab-home', workspaceId: 'home' as const, title: 'Home' }];

    SessionStore.clearSession(tabIdToClose);
    setTabs(resolvedTabs);

    if (activeTabId === tabIdToClose) {
      const nextActiveIdx = Math.max(0, closeIdx - 1);
      const nextTab = resolvedTabs[nextActiveIdx] || resolvedTabs[0];
      handleSelectTab(nextTab.id, resolvedTabs);
    }

    // 10-second Undo toast
    showToast('Tab closed', 'info', 10000, {
      label: 'Undo',
      onClick: () => {
        setTabs((prev) => {
          const restored = [...prev];
          restored.splice(closeIdx, 0, tabToClose);
          return restored;
        });
        handleSelectTab(tabToClose.id);
      },
    });
  };

  const handleCloseOthers = (tabId: string) => {
    const targetTab = tabs.find((t) => t.id === tabId);
    if (!targetTab) return;

    const oldTabs = [...tabs];
    const homeTab = tabs.find((t) => t.workspaceId === 'home') || { id: 'tab-home', workspaceId: 'home' as const, title: 'Home' };
    const newTabs = targetTab.workspaceId === 'home' ? [targetTab] : [homeTab, targetTab];
    const removedCount = oldTabs.length - newTabs.length;
    if (removedCount <= 0) return;

    setTabs(newTabs);
    handleSelectTab(targetTab.id, newTabs);

    showToast(`${removedCount} ${removedCount === 1 ? 'tab' : 'tabs'} closed`, 'info', 10000, {
      label: 'Undo',
      onClick: () => {
        setTabs(oldTabs);
      },
    });
  };

  const handleCloseRight = (tabId: string) => {
    const idx = tabs.findIndex((t) => t.id === tabId);
    if (idx === -1 || idx >= tabs.length - 1) return;

    const oldTabs = [...tabs];
    const newTabs = tabs.slice(0, idx + 1);
    const removedCount = oldTabs.length - newTabs.length;

    setTabs(newTabs);
    if (!newTabs.some((t) => t.id === activeTabId)) {
      handleSelectTab(tabId, newTabs);
    }

    showToast(`${removedCount} ${removedCount === 1 ? 'tab' : 'tabs'} closed`, 'info', 10000, {
      label: 'Undo',
      onClick: () => {
        setTabs(oldTabs);
      },
    });
  };

  const handleCloseAll = () => {
    const homeTab = tabs.find((t) => t.workspaceId === 'home') || { id: 'tab-home', workspaceId: 'home' as const, title: 'Home' };
    const oldTabs = [...tabs];
    const removedCount = oldTabs.filter((t) => t.id !== homeTab.id).length;
    if (removedCount === 0) return;

    setTabs([homeTab]);
    handleSelectTab(homeTab.id, [homeTab]);

    showToast('All tabs closed', 'info', 10000, {
      label: 'Undo',
      onClick: () => {
        setTabs(oldTabs);
      },
    });
  };

  const handleNewTab = () => {
    const newId = `tab_${Date.now()}`;
    const newTab: UtilityTabItem = {
      id: newId,
      workspaceId: 'new-tab',
      title: 'New tab',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setActiveNav('new-tab');
    setSelectedGroupId(undefined);
    setSelectedUtilityId(undefined);
    setSelectedFeatureId(undefined);
  };

  const handleSelectWorkspace = (id: ActiveNav, openInNewTab = false) => {
    const title = getWorkspaceSentenceName(id);

    if (id === 'home') {
      const existingHome = tabs.find((t) => t.workspaceId === 'home');
      if (existingHome) {
        setActiveTabId(existingHome.id);
        setActiveNav('home');
        setSelectedGroupId(undefined);
        setSelectedUtilityId(undefined);
        setSelectedFeatureId(undefined);
      } else {
        const homeTab: UtilityTabItem = { id: 'tab-home', workspaceId: 'home', title: 'Home' };
        setTabs((prev) => [homeTab, ...prev]);
        setActiveTabId('tab-home');
        setActiveNav('home');
      }
      return;
    }

    if (openInNewTab) {
      const newId = `tab_${Date.now()}`;
      const newTab: UtilityTabItem = {
        id: newId,
        workspaceId: id,
        title,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newId);
      setActiveNav(id);
      setSelectedGroupId(undefined);
      setSelectedUtilityId(undefined);
      setSelectedFeatureId(undefined);
      return;
    }

    // Default: One tab per workspace. Check if active tab is 'new-tab'
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && activeTab.workspaceId === 'new-tab') {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, workspaceId: id, groupId: undefined, utilityId: undefined, featureId: undefined, title }
            : t
        )
      );
      setActiveNav(id);
      setSelectedGroupId(undefined);
      setSelectedUtilityId(undefined);
      setSelectedFeatureId(undefined);
      return;
    }

    // Check if a tab for this workspace already exists
    const existingWsTab = tabs.find((t) => t.workspaceId === id);
    if (existingWsTab) {
      setActiveTabId(existingWsTab.id);
      setActiveNav(id);
      setSelectedGroupId(existingWsTab.groupId);
      setSelectedUtilityId(existingWsTab.utilityId);
      setSelectedFeatureId(existingWsTab.featureId);
      return;
    }

    // Otherwise create a tab for this workspace
    const newId = `tab_${Date.now()}`;
    const newTab: UtilityTabItem = {
      id: newId,
      workspaceId: id,
      title,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setActiveNav(id);
    setSelectedGroupId(undefined);
    setSelectedUtilityId(undefined);
    setSelectedFeatureId(undefined);
  };

  const handleSelectUtility = (
    workspaceId: WorkspaceId,
    groupId: string,
    utilityId: string,
    featureId?: string,
    openInNewTab = false
  ) => {
    setActiveNav(workspaceId);
    setSelectedGroupId(groupId);
    setSelectedUtilityId(utilityId);
    setSelectedFeatureId(featureId);

    const title = getUtilityName(workspaceId, groupId, utilityId);

    if (openInNewTab) {
      const newId = `tab_${Date.now()}`;
      const newTab: UtilityTabItem = {
        id: newId,
        workspaceId,
        groupId,
        utilityId,
        featureId,
        title,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newId);
    } else {
      // If currently on new-tab, replace it
      const activeTab = tabs.find((t) => t.id === activeTabId);
      if (activeTab && activeTab.workspaceId === 'new-tab') {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId
              ? { ...t, workspaceId, groupId, utilityId, featureId, title }
              : t
          )
        );
      } else {
        // One tab per workspace: check if a tab for this workspace exists
        const existingWsTab = tabs.find((t) => t.workspaceId === workspaceId);
        if (existingWsTab) {
          setActiveTabId(existingWsTab.id);
          setTabs((prev) =>
            prev.map((t) =>
              t.id === existingWsTab.id
                ? { ...t, groupId, utilityId, featureId, title }
                : t
            )
          );
        } else {
          const newId = `tab_${Date.now()}`;
          const newTab: UtilityTabItem = {
            id: newId,
            workspaceId,
            groupId,
            utilityId,
            featureId,
            title,
          };
          setTabs((prev) => [...prev, newTab]);
          setActiveTabId(newId);
        }
      }
    }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* ─── 1. Title Bar: Logo + Toiloki, Centered E-commerce Search, Window Controls ─── */}
      <TitleBar
        onSelectUtility={(ws, grp, util, feat, inNewTab) => handleSelectUtility(ws, grp, util, feat, inNewTab)}
      />

      {/* ─── 2. Slim 34px Native Tab Row (Always Visible) ─── */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={requestCloseTab}
        onCloseOthers={handleCloseOthers}
        onCloseRight={handleCloseRight}
        onCloseAll={handleCloseAll}
        onNewTab={handleNewTab}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* ─── 3. Sidebar (Footer = Settings only, Workflows removed) ─── */}
        <Sidebar
          activeNav={activeNav}
          onSelectNav={(nav) => handleSelectWorkspace(nav)}
        />

        <main
          className="app-main-workspace"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', position: 'relative' }}
        >
          {tabs.map((tab) => {
            const isTabActive = tab.id === activeTabId;
            const containerStyle: React.CSSProperties = {
              display: isTabActive ? 'flex' : 'none',
              flex: 1,
              flexDirection: 'column',
              minWidth: 0,
              height: '100%',
              width: '100%',
              overflow: 'hidden',
            };

            if (tab.workspaceId === 'home') {
              return (
                <div key={tab.id} style={{ ...containerStyle, overflowY: 'auto' }}>
                  <Header
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenSearchModal={() => {
                      const input = document.querySelector<HTMLInputElement>('.ecommerce-search-input');
                      input?.focus();
                    }}
                    showHeroBanner={true}
                  />
                  <DashboardHome
                    onSelectWorkspace={(ws) => handleSelectWorkspace(ws)}
                    onSelectUtility={(ws, grp, util) => handleSelectUtility(ws, grp, util)}
                  />
                </div>
              );
            }

            if (tab.workspaceId === 'new-tab') {
              return (
                <div key={tab.id} style={{ ...containerStyle, overflowY: 'auto' }}>
                  <NewTabPage
                    onSelectWorkspace={(ws) => handleSelectWorkspace(ws)}
                    onSelectUtility={(ws, grp, util, feat) => handleSelectUtility(ws, grp, util, feat)}
                  />
                </div>
              );
            }

            if (tab.workspaceId === 'history') {
              return (
                <div key={tab.id} style={{ ...containerStyle, overflowY: 'auto' }}>
                  <HistoryView onOpenUtility={(ws, grp, util) => handleSelectUtility(ws, grp, util)} />
                </div>
              );
            }

            if (tab.workspaceId === 'favorites') {
              return (
                <div key={tab.id} style={{ ...containerStyle, overflowY: 'auto' }}>
                  <FavoritesView onSelectUtility={(ws, grp, util) => handleSelectUtility(ws, grp, util)} />
                </div>
              );
            }

            if (tab.workspaceId === 'trash') {
              return (
                <div key={tab.id} style={{ ...containerStyle, overflowY: 'auto' }}>
                  <TrashView />
                </div>
              );
            }

            if (tab.workspaceId === 'settings') {
              return (
                <div key={tab.id} style={{ ...containerStyle, overflowY: 'auto' }}>
                  <SettingsView />
                </div>
              );
            }

            const wsDef = WORKSPACES.find((w) => w.id === tab.workspaceId);
            if (!wsDef) return null;

            return (
              <div key={tab.id} style={containerStyle}>
                <WorkspaceView
                  tabId={tab.id}
                  workspace={wsDef}
                  initialGroupId={tab.groupId}
                  initialUtilityId={tab.utilityId}
                  initialFeatureId={tab.featureId}
                  onBackToHome={() => handleSelectWorkspace('home')}
                  onUtilityChange={(groupId, utilityId, featureId) => {
                    const uName = getUtilityName(wsDef.id, groupId, utilityId);
                    setTabs((currentTabs) =>
                      currentTabs.map((t) =>
                        t.id === tab.id
                          ? { ...t, groupId, utilityId, featureId, title: uName }
                          : t
                      )
                    );
                  }}
                />
              </div>
            );
          })}
        </main>
      </div>

      {/* ─── Tab Discard Confirmation Modal ─── */}
      {confirmCloseTab && (
        <div className="tab-discard-modal-backdrop" onClick={() => setConfirmCloseTab(null)}>
          <div className="tab-discard-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tab-discard-title">
              {confirmCloseTab.fileCount
                ? `Discard ${confirmCloseTab.fileCount} ${confirmCloseTab.fileCount === 1 ? 'file' : 'files'}?`
                : `Discard unsaved changes in ${confirmCloseTab.title}?`}
            </h3>
            <p className="tab-discard-desc">
              Closing this tab will discard your current progress in this workspace.
            </p>
            <div className="tab-discard-actions">
              <button
                type="button"
                className="tab-discard-btn secondary"
                onClick={() => setConfirmCloseTab(null)}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="tab-discard-btn primary-danger"
                onClick={() => {
                  const id = confirmCloseTab.id;
                  setConfirmCloseTab(null);
                  executeCloseTab(id);
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

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
