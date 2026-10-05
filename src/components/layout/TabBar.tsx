import React from 'react';
import { X, Plus, Home, Folder, Wrench } from 'lucide-react';
import { WorkspaceId } from '../../core/types/workspace';
import './TabBar.css';

export interface UtilityTabItem {
  id: string;
  workspaceId: WorkspaceId | 'home' | 'history' | 'favorites' | 'settings' | 'trash';
  groupId?: string;
  utilityId?: string;
  featureId?: string;
  title: string;
}

interface TabBarProps {
  tabs: UtilityTabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  if (tabs.length < 2) return null;

  return (
    <div className="toiloki-tab-bar" role="tablist" aria-label="Utility Tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={`toiloki-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            role="tab"
            aria-selected={isActive}
            title={tab.title}
          >
            <span className="toiloki-tab-title">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                type="button"
                className="toiloki-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                aria-label={`Close ${tab.title} tab`}
              >
                <X size={11} />
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        className="toiloki-new-tab-btn"
        onClick={onNewTab}
        title="Open new tab (Ctrl+T)"
        aria-label="New tab"
      >
        <Plus size={13} />
      </button>
    </div>
  );
};
