import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Database,
  Type,
  Code2,
  Calculator,
  FolderArchive,
  Shield,
  Film,
  Globe,
  Palette,
  Cpu,
  Star,
  Clock,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { WorkspaceId } from '../../core/types/workspace';
import { WORKSPACES } from '../../core/registry/app-registry';
import { SettingsService, AppSettings } from '../../core/services/settings.service';
import './Sidebar.css';

export type ActiveNav = 'home' | WorkspaceId | 'favorites' | 'history' | 'settings' | 'trash';

interface SidebarProps {
  activeNav: ActiveNav;
  onSelectNav: (nav: ActiveNav) => void;
  favoritesCount?: number;
}

const CORE_CATEGORIES = [
  { id: 'pdf', label: 'PDF', icon: FileText, badgeClass: 'badge-pdf' },
  { id: 'documents', label: 'Documents', icon: FileSpreadsheet, badgeClass: 'badge-doc' },
  { id: 'images', label: 'Images', icon: ImageIcon, badgeClass: 'badge-img' },
  { id: 'data', label: 'Data', icon: Database, badgeClass: 'badge-data' },
  { id: 'text', label: 'Text', icon: Type, badgeClass: 'badge-text' },
  { id: 'developer', label: 'Developer', icon: Code2, badgeClass: 'badge-dev' },
  { id: 'calculator', label: 'Calculator', icon: Calculator, badgeClass: 'badge-calc' },
  { id: 'files', label: 'Files & Archives', icon: FolderArchive, badgeClass: 'badge-files' },
] as const;

const MORE_CATEGORIES = [
  { id: 'security', label: 'Security & Privacy', icon: Shield, badgeClass: 'badge-security' },
  { id: 'media', label: 'Audio & Video', icon: Film, badgeClass: 'badge-media' },
  { id: 'network', label: 'Network & Web', icon: Globe, badgeClass: 'badge-network' },
  { id: 'design', label: 'Color & Design', icon: Palette, badgeClass: 'badge-design' },
  { id: 'system', label: 'System & Maintenance', icon: Cpu, badgeClass: 'badge-system' },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  favoritesCount = 0,
}) => {
  const [settings, setSettings] = useState<AppSettings>(() => SettingsService.getSettings());

  useEffect(() => {
    return SettingsService.subscribe((updated) => setSettings(updated));
  }, []);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('toiloki_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    } catch {}
    return typeof window !== 'undefined' ? window.innerWidth < 1100 : false;
  });

  const [isCoreExpanded, setIsCoreExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('toiloki_sidebar_core_expanded');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [isMoreExpanded, setIsMoreExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('toiloki_sidebar_more_expanded');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('toiloki_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const toggleCoreExpanded = () => {
    setIsCoreExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('toiloki_sidebar_core_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const toggleMoreExpanded = () => {
    setIsMoreExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('toiloki_sidebar_more_expanded', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate utility statistics per workspace from WORKSPACES, respecting showUpcomingUtilities
  const workspaceUtilityData: Record<string, { total: number; ready: number; beta: number; soon: number }> = useMemo(() => {
    const data: Record<string, { total: number; ready: number; beta: number; soon: number }> = {};
    for (const ws of WORKSPACES) {
      const allUtils = ws.groups.flatMap((g) => g.utilities);
      const uniqueUtils = Array.from(new Map(allUtils.map((u) => [u.id, u])).values());
      const ready = uniqueUtils.filter((u) => u.status === 'ready' || !u.status).length;
      const beta = uniqueUtils.filter((u) => u.status === 'beta').length;
      const soon = uniqueUtils.filter((u) => u.status === 'soon').length;
      const total = settings.showUpcomingUtilities ? uniqueUtils.length : (ready + beta);
      data[ws.id] = { total, ready, beta, soon };
    }
    return data;
  }, [settings.showUpcomingUtilities]);

  const visibleCoreCategories = useMemo(() => {
    const visibleIds = new Set(settings.visibleWorkspaces);
    return CORE_CATEGORIES.filter((cat) => visibleIds.has(cat.id));
  }, [settings.visibleWorkspaces]);

  const visibleMoreCategories = useMemo(() => {
    const visibleIds = new Set(settings.visibleWorkspaces);
    return MORE_CATEGORIES.filter((cat) => visibleIds.has(cat.id));
  }, [settings.visibleWorkspaces]);

  const totalVisibleUtilities = useMemo(() => {
    const allVisibleCats = [...visibleCoreCategories, ...visibleMoreCategories];
    return allVisibleCats.reduce((acc, cat) => acc + (workspaceUtilityData[cat.id]?.total || 0), 0);
  }, [visibleCoreCategories, visibleMoreCategories, workspaceUtilityData]);


  return (
    <aside className={`app-sidebar no-drag ${isCollapsed ? 'collapsed' : ''}`}>

      {/* ─── Top Controls ─── */}
      <div className="sidebar-top-bar">
        <button
          className="sidebar-collapse-btn"
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* ─── Home Navigation ─── */}
      <div className="sidebar-section">
        <button
          data-nav="home"
          className={`sidebar-nav-btn home-nav-btn ${activeNav === 'home' ? 'active' : ''}`}
          onClick={() => onSelectNav('home')}
          title={`Home Dashboard (${totalVisibleUtilities} available utilities)`}
        >
          <div className="nav-tile home-tile">
            <Home size={13} />
          </div>
          {!isCollapsed && <span className="sidebar-btn-label">Home</span>}
          {!isCollapsed && <span className="nav-count-pill">{totalVisibleUtilities}</span>}
        </button>
      </div>

      <div className="sidebar-divider" />

      {/* ─── Core Workspaces Section (Collapsible) ─── */}
      {visibleCoreCategories.length > 0 && (
        <div className="sidebar-section">
          {!isCollapsed && (
            <button
              type="button"
              className="sidebar-section-toggle"
              onClick={toggleCoreExpanded}
              title={isCoreExpanded ? 'Collapse Core workspaces' : 'Expand Core workspaces'}
            >
              <span className="sidebar-section-title">Workspaces</span>
              <span className="sidebar-section-chevron">
                {isCoreExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
            </button>
          )}

          {(isCoreExpanded || isCollapsed) &&
            visibleCoreCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeNav === cat.id;
              const stats = workspaceUtilityData[cat.id] || { total: 0, ready: 0, beta: 0, soon: 0 };

              return (
                <button
                  key={cat.id}
                  data-nav={cat.id}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectNav(cat.id as ActiveNav)}
                  title={`${cat.label} (${stats.total} utilities: ${stats.ready} ready · ${stats.beta} beta · ${stats.soon} coming soon)`}
                >
                  <div className={`nav-tile ${cat.badgeClass}`}>
                    <Icon size={12} />
                  </div>
                  {!isCollapsed && <span className="sidebar-btn-label">{cat.label}</span>}
                  {!isCollapsed && <span className="nav-count-pill">{stats.total}</span>}
                </button>
              );
            })}
        </div>
      )}

      {/* ─── More Workspaces Section (Collapsible) ─── */}
      {visibleMoreCategories.length > 0 && (
        <div className="sidebar-section" style={{ marginTop: '6px' }}>
          {!isCollapsed && (
            <button
              type="button"
              className="sidebar-section-toggle"
              onClick={toggleMoreExpanded}
              title={isMoreExpanded ? 'Collapse More workspaces' : 'Expand More workspaces'}
            >
              <span className="sidebar-section-title">More</span>
              <span className="sidebar-section-chevron">
                {isMoreExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
            </button>
          )}

          {(isMoreExpanded || isCollapsed) &&
            visibleMoreCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeNav === cat.id;
              const stats = workspaceUtilityData[cat.id] || { total: 0, ready: 0, beta: 0, soon: 0 };

              return (
                <button
                  key={cat.id}
                  data-nav={cat.id}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectNav(cat.id as ActiveNav)}
                  title={`${cat.label} (${stats.total} utilities: ${stats.ready} ready · ${stats.beta} beta · ${stats.soon} coming soon)`}
                >
                  <div className={`nav-tile ${cat.badgeClass}`}>
                    <Icon size={12} />
                  </div>
                  {!isCollapsed && <span className="sidebar-btn-label">{cat.label}</span>}
                  {!isCollapsed && <span className="nav-count-pill">{stats.total}</span>}
                </button>
              );
            })}
        </div>
      )}

      <div className="sidebar-divider" />

      {/* ─── Quick Access Section ─── */}
      <div className="sidebar-section">
        {!isCollapsed && <div className="sidebar-section-header">Library</div>}
        <button
          data-nav="favorites"
          className={`sidebar-nav-btn ${activeNav === 'favorites' ? 'active' : ''}`}
          onClick={() => onSelectNav('favorites')}
          title="Favorites"
        >
          <div className="nav-tile fav-tile">
            <Star size={12} />
          </div>
          {!isCollapsed && <span className="sidebar-btn-label">Favorites</span>}
          {!isCollapsed && favoritesCount > 0 && (
            <span className="nav-count-pill amber-pill">{favoritesCount}</span>
          )}
        </button>
        <button
          data-nav="history"
          className={`sidebar-nav-btn ${activeNav === 'history' ? 'active' : ''}`}
          onClick={() => onSelectNav('history')}
          title="Recent Activity"
        >
          <div className="nav-tile history-tile">
            <Clock size={12} />
          </div>
          {!isCollapsed && <span className="sidebar-btn-label">Recent History</span>}
        </button>
        <button
          data-nav="trash"
          className={`sidebar-nav-btn ${activeNav === 'trash' ? 'active' : ''}`}
          onClick={() => onSelectNav('trash')}
          title="Toiloki Trash & Quarantine"
        >
          <div className="nav-tile history-tile">
            <Trash2 size={12} />
          </div>
          {!isCollapsed && <span className="sidebar-btn-label">Trash</span>}
        </button>
      </div>

      {/* ─── Bottom Settings Button ─── */}
      <div className="sidebar-bottom">
        <button
          data-nav="settings"
          className={`sidebar-bottom-btn single-settings-btn ${activeNav === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectNav('settings')}
          title="Settings"
        >
          <Settings size={15} />
          {!isCollapsed && <span className="sidebar-btn-label">Settings</span>}
        </button>

        {/* Offline trust signal */}
        <div
          className="sidebar-offline-indicator"
          title="Everything runs on this device"
          aria-label="Everything runs on this device"
        >
          <span className="offline-dot" aria-hidden="true" />
          {!isCollapsed && <span className="offline-label">Offline</span>}
        </div>
      </div>

    </aside>
  );
};
