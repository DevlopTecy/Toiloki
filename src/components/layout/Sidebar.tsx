import React, { useState, useEffect } from 'react';
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
  Star,
  Clock,
  Settings,
  Sun,
  Moon,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
} from 'lucide-react';
import { WorkspaceId } from '../../core/types/workspace';
import { WORKSPACES } from '../../core/registry/app-registry';
import { SettingsService } from '../../core/services/settings.service';
import './Sidebar.css';

export type ActiveNav = 'home' | WorkspaceId | 'favorites' | 'history' | 'settings';

interface SidebarProps {
  activeNav: ActiveNav;
  onSelectNav: (nav: ActiveNav) => void;
  favoritesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  favoritesCount = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('toiloki_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    } catch {}
    return typeof window !== 'undefined' ? window.innerWidth < 1100 : false;
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return SettingsService.getSettings().theme || 'system';
  });

  // Calculate tool counts per category from WORKSPACES
  const categoryCounts: Record<string, number> = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ws of WORKSPACES) {
      counts[ws.id] = ws.utilities.reduce((acc, u) => acc + u.features.length, 0);
    }
    return counts;
  }, []);

  const totalTools = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  const categories = [
    { id: 'pdf', label: 'PDF', icon: FileText, badgeClass: 'badge-pdf' },
    { id: 'documents', label: 'Documents', icon: FileSpreadsheet, badgeClass: 'badge-doc' },
    { id: 'images', label: 'Images', icon: ImageIcon, badgeClass: 'badge-img' },
    { id: 'data', label: 'Data', icon: Database, badgeClass: 'badge-data' },
    { id: 'text', label: 'Text', icon: Type, badgeClass: 'badge-text' },
    { id: 'developer', label: 'Developer', icon: Code2, badgeClass: 'badge-dev' },
    { id: 'calculator', label: 'Calculator', icon: Calculator, badgeClass: 'badge-calc' },
    { id: 'files', label: 'Files & Archives', icon: FolderArchive, badgeClass: 'badge-files' },
  ] as const;

  const cycleTheme = () => {
    let nextTheme = 'dark';
    if (currentTheme === 'dark' || currentTheme === 'dark-navy') {
      nextTheme = 'light';
    } else if (currentTheme === 'light') {
      nextTheme = 'system';
    } else {
      nextTheme = 'dark';
    }
    setCurrentTheme(nextTheme);
    SettingsService.saveSettings({ theme: nextTheme });
  };

  const getThemeIcon = () => {
    if (currentTheme === 'light') return <Sun size={13} />;
    if (currentTheme === 'system') return <Monitor size={13} />;
    return <Moon size={13} />;
  };

  const getThemeLabel = () => {
    if (currentTheme === 'light') return 'Light';
    if (currentTheme === 'system') return 'System';
    return 'Dark';
  };

  const sidebarRef = React.useRef<HTMLElement>(null);
  const [indicatorY, setIndicatorY] = useState<number>(-1);

  useEffect(() => {
    if (!sidebarRef.current) return;
    const activeBtn = sidebarRef.current.querySelector<HTMLButtonElement>(`[data-nav="${activeNav}"]`);
    if (activeBtn) {
      const parentRect = sidebarRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorY(btnRect.top - parentRect.top + 5);
    } else {
      setIndicatorY(-1);
    }
  }, [activeNav, isCollapsed]);

  return (
    <aside ref={sidebarRef} className={`app-sidebar no-drag ${isCollapsed ? 'collapsed' : ''}`}>
      {/* ─── Shared Sliding Active Indicator Bar (2px Accent, 180ms ease-standard) ─── */}
      <div
        className="sidebar-shared-indicator"
        style={{
          transform: `translateY(${Math.max(0, indicatorY)}px)`,
          opacity: indicatorY >= 0 ? 1 : 0,
        }}
        aria-hidden="true"
      />

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
          title="Home Dashboard"
        >
          <div className="nav-tile home-tile">
            <Home size={13} />
          </div>
          {!isCollapsed && <span className="sidebar-btn-label">Home</span>}
          {!isCollapsed && <span className="nav-count-pill">{totalTools}</span>}
        </button>
      </div>

      <div className="sidebar-divider" />

      {/* ─── Categories Section ─── */}
      <div className="sidebar-section">
        {!isCollapsed && <div className="sidebar-section-header">CATEGORIES</div>}
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeNav === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              data-nav={cat.id}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectNav(cat.id as ActiveNav)}
              title={`${cat.label} (${count} tools)`}
            >
              <div className={`nav-tile ${cat.badgeClass}`}>
                <Icon size={12} />
              </div>
              {!isCollapsed && <span className="sidebar-btn-label">{cat.label}</span>}
              {!isCollapsed && <span className="nav-count-pill">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="sidebar-divider" />

      {/* ─── Quick Access Section ─── */}
      <div className="sidebar-section">
        {!isCollapsed && <div className="sidebar-section-header">RECENTS & SAVED</div>}
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
      </div>

      {/* ─── Bottom Status & Controls ─── */}
      <div className="sidebar-bottom">
        {!isCollapsed && (
          <div className="sidebar-privacy-status">
            <span className="privacy-dot" />
            <span className="privacy-text">Offline • files stay on your device</span>
          </div>
        )}

        {!isCollapsed && (
          <div className="sidebar-storage-card">
            <div className="storage-row">
              <span className="storage-label">Local Cache</span>
              <span className="storage-val">0 B (Safe)</span>
            </div>
            <div className="storage-track">
              <div className="storage-bar" style={{ transform: 'scaleX(0.08)' }} />
            </div>
          </div>
        )}

        <div className="sidebar-bottom-controls">
          <button
            data-nav="settings"
            className={`sidebar-bottom-btn ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => onSelectNav('settings')}
            title="Settings"
          >
            <Settings size={14} />
            {!isCollapsed && <span>Settings</span>}
          </button>

          <button
            className="sidebar-bottom-btn theme-toggle-btn"
            onClick={cycleTheme}
            title={`Current theme: ${getThemeLabel()} (Click to cycle)`}
          >
            {getThemeIcon()}
            {!isCollapsed && <span>{getThemeLabel()}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
