import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Home, FileText, FolderOpen, Image as ImageIcon,
  Table, Type, Terminal, Calculator, Archive, Shield, Film,
  Globe, Palette, Cpu, Clock, Star, Settings, Trash2, Layers
} from 'lucide-react';
import { WorkspaceId } from '../../core/types/workspace';
import './TabBar.css';

export interface UtilityTabItem {
  id: string;
  workspaceId: WorkspaceId | 'home' | 'new-tab' | 'history' | 'favorites' | 'settings' | 'trash';
  groupId?: string;
  utilityId?: string;
  featureId?: string;
  title: string;
  hasFiles?: boolean;
  hasUnsaved?: boolean;
  fileCount?: number;
}

interface TabBarProps {
  tabs: UtilityTabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseOthers: (tabId: string) => void;
  onCloseRight: (tabId: string) => void;
  onCloseAll: () => void;
  onNewTab: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  tabId: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseOthers,
  onCloseRight,
  onCloseAll,
  onNewTab,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenu) setContextMenu(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu) setContextMenu(null);
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  };

  const getTabIcon = (wsId: string) => {
    switch (wsId) {
      case 'home': return <Home size={13} />;
      case 'new-tab': return <Plus size={13} />;
      case 'pdf': return <FileText size={13} />;
      case 'documents': return <FolderOpen size={13} />;
      case 'images': return <ImageIcon size={13} />;
      case 'data': return <Table size={13} />;
      case 'text': return <Type size={13} />;
      case 'developer': return <Terminal size={13} />;
      case 'calculator': return <Calculator size={13} />;
      case 'files': return <Archive size={13} />;
      case 'security': return <Shield size={13} />;
      case 'media': return <Film size={13} />;
      case 'network': return <Globe size={13} />;
      case 'design': return <Palette size={13} />;
      case 'system': return <Cpu size={13} />;
      case 'history': return <Clock size={13} />;
      case 'favorites': return <Star size={13} />;
      case 'settings': return <Settings size={13} />;
      case 'trash': return <Trash2 size={13} />;
      default: return <FileText size={13} />;
    }
  };

  const activeContextMenuTab = tabs.find((t) => t.id === contextMenu?.tabId);

  return (
    <div className="toiloki-tab-bar-container" role="tablist" aria-label="Utility Tabs">
      <div className="toiloki-tab-bar-scrollable" ref={scrollContainerRef}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const hasWork = Boolean(tab.hasFiles || tab.hasUnsaved);

          return (
            <div
              key={tab.id}
              className={`toiloki-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              onMouseDown={(e) => {
                // Middle click closes tab
                if (e.button === 1) {
                  e.preventDefault();
                  onCloseTab(tab.id);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              role="tab"
              aria-selected={isActive}
              title={`${tab.title}${hasWork ? ' (unsaved work)' : ''}`}
            >
              <div className="toiloki-tab-icon">
                {getTabIcon(tab.workspaceId)}
              </div>

              {hasWork && (
                <span className="toiloki-tab-dot" aria-label="Has unsaved work" />
              )}

              <span className="toiloki-tab-title">{tab.title}</span>

              {/* Close Tab button (Home can also be closed if other tabs exist, or kept) */}
              <button
                type="button"
                className="toiloki-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                aria-label={`Close ${tab.title} tab`}
                title="Close tab (Ctrl+W)"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}

        {/* '+' Button: Opens New Tab Page */}
        <button
          type="button"
          className="toiloki-new-tab-btn"
          onClick={onNewTab}
          title="Open new tab (Ctrl+T)"
          aria-label="New tab"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Far Right: Ghost 'Close All Tabs' Button (24px) */}
      <button
        type="button"
        className="toiloki-close-all-btn"
        onClick={onCloseAll}
        title="Close all tabs except Home"
        aria-label="Close all tabs"
      >
        <Layers size={13} />
      </button>

      {/* Context Menu on Right Click */}
      {contextMenu && (
        <div
          className="toiloki-tab-context-menu"
          style={{ top: `${contextMenu.y + 4}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="toiloki-tab-context-item"
            onClick={() => {
              onCloseTab(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Close
          </button>
          <button
            type="button"
            className="toiloki-tab-context-item"
            onClick={() => {
              onCloseOthers(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Close others
          </button>
          <button
            type="button"
            className="toiloki-tab-context-item"
            onClick={() => {
              onCloseRight(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Close to the right
          </button>
        </div>
      )}
    </div>
  );
};
