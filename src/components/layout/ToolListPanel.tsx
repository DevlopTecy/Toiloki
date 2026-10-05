import React, { useState, useEffect, useMemo } from 'react';
import { WorkspaceDefinition, GroupDefinition, UtilityDefinition } from '../../core/types/workspace';
import { SettingsService, AppSettings } from '../../core/services/settings.service';
import { ChevronRight, Search } from 'lucide-react';
import './ToolListPanel.css';

interface ToolListPanelProps {
  workspace: WorkspaceDefinition;
  activeGroupId: string;
  activeUtilityId: string;
  onSelectUtility: (group: GroupDefinition, utility: UtilityDefinition) => void;
}

export const ToolListPanel: React.FC<ToolListPanelProps> = ({
  workspace,
  activeGroupId: _activeGroupId,
  activeUtilityId,
  onSelectUtility,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  // Persisted collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('toiloki_collapsed_groups');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('toiloki_collapsed_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [showUpcoming, setShowUpcoming] = useState(() => SettingsService.getSettings().showUpcomingUtilities);

  useEffect(() => {
    return SettingsService.subscribe((s: AppSettings) => {
      setShowUpcoming(s.showUpcomingUtilities);
    });
  }, []);

  // Calculate utility statistics per workspace (unique IDs, tooltip: ready/beta/soon)
  const utilityStats = useMemo(() => {
    const all = workspace.groups.flatMap((g) => g.utilities);
    const unique = Array.from(new Map(all.map((u) => [u.id, u])).values());
    const ready = unique.filter((u) => u.status === 'ready' || !u.status).length;
    const beta = unique.filter((u) => u.status === 'beta').length;
    const soon = unique.filter((u) => u.status === 'soon').length;
    const total = ready + beta;
    return {
      total,
      tooltip: `${ready} ready · ${beta} beta · ${soon} coming soon`,
    };
  }, [workspace]);

  // Filtered groups & utilities
  const filteredGroups = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();

    return workspace.groups
      .map((g) => {
        let utils = g.utilities;
        if (!showUpcoming) {
          utils = utils.filter((u) => u.status !== 'soon');
        }
        if (q) {
          utils = utils.filter(
            (u) =>
              u.name.toLowerCase().includes(q) ||
              u.description.toLowerCase().includes(q) ||
              u.keywords?.some((k) => k.toLowerCase().includes(q))
          );
        }
        return {
          ...g,
          utilities: utils,
        };
      })
      .filter((g) => g.utilities.length > 0);
  }, [workspace, searchFilter, showUpcoming]);

  const scrollableRef = React.useRef<HTMLDivElement>(null);
  const [indicatorY, setIndicatorY] = useState<number>(-1);

  // Track position of active utility for shared sliding indicator bar (180ms ease-standard)
  useEffect(() => {
    if (!scrollableRef.current) return;
    const activeBtn = scrollableRef.current.querySelector<HTMLButtonElement>(`[data-tool-id="${activeUtilityId}"]`);
    if (activeBtn) {
      const parentRect = scrollableRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const currentScroll = scrollableRef.current.scrollTop;
      setIndicatorY(btnRect.top - parentRect.top + currentScroll + 5);
    } else {
      setIndicatorY(-1);
    }
  }, [activeUtilityId, collapsedGroups, filteredGroups]);

  return (
    <aside className="tool-list-panel no-drag">
      {/* ─── Header: Category Name + Utility Count ─── */}
      <div className="tool-list-header">
        <div className="tool-list-title-row">
          <h2 className="tool-list-cat-name">{workspace.name}</h2>
          <span className="tool-list-count" title={utilityStats.tooltip}>
            {utilityStats.total} utilities
          </span>
        </div>

        {/* Small filter input if > 12 utilities */}
        {utilityStats.total > 12 && (
          <div className="tool-list-search-wrap">
            <Search size={13} className="tool-list-search-icon" />
            <input
              type="text"
              placeholder="Filter utilities..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="tool-list-search-input"
            />
          </div>
        )}
      </div>

      {/* ─── Scrollable Groups and Utilities ─── */}
      <div ref={scrollableRef} className="tool-list-scrollable" style={{ position: 'relative' }}>
        {/* Shared Sliding 2px Accent Bar */}
        <div
          className="tool-list-shared-indicator"
          style={{
            transform: `translateY(${Math.max(0, indicatorY)}px)`,
            opacity: indicatorY >= 0 ? 1 : 0,
          }}
          aria-hidden="true"
        />

        {filteredGroups.map((group) => {
          const originalGroup = workspace.groups.find((g) => g.id === group.id) || group;
          const isSingleUtilityGroup = originalGroup.utilities.length === 1;

          if (isSingleUtilityGroup) {
            const utility = group.utilities[0];
            if (!utility) return null;
            const isActive = utility.id === activeUtilityId;

            return (
              <div key={group.id} className="tool-list-group tool-list-single-tool-group">
                <button
                  data-tool-id={utility.id}
                  data-utility-id={utility.id}
                  type="button"
                  className={`tool-item-btn single-utility-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectUtility(group, utility)}
                  title={utility.description}
                >
                  <span className="tool-item-name">{utility.name}</span>
                  {utility.status === 'soon' && (
                    <span className="tool-status-badge tool-status-soon">Soon</span>
                  )}
                  {utility.status === 'beta' && (
                    <span className="tool-status-badge tool-status-beta">Beta</span>
                  )}
                </button>
              </div>
            );
          }

          const isCollapsed = Boolean(collapsedGroups[group.id]);

          return (
            <div key={group.id} className="tool-list-group">
              {/* Group Heading (Folder only: no screen, route, or count) */}
              <button
                type="button"
                className="tool-group-heading"
                onClick={() => toggleGroupCollapse(group.id)}
                title={group.name}
              >
                <span className="tool-group-title">{group.name}</span>
                <span className="tool-group-toggle-icon">
                  <ChevronRight
                    size={13}
                    className={`tool-group-chevron ${!isCollapsed ? 'open' : ''}`}
                  />
                </span>
              </button>

              {/* Group Utilities List */}
              <div className={`tool-group-collapse ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                <div className="tool-group-collapse-inner">
                  <div className="tool-group-items">
                    {group.utilities.map((utility) => {
                      const isActive = utility.id === activeUtilityId;

                      return (
                        <button
                          key={utility.id}
                          data-tool-id={utility.id}
                          data-utility-id={utility.id}
                          type="button"
                          className={`tool-item-btn ${isActive ? 'active' : ''}`}
                          onClick={() => onSelectUtility(group, utility)}
                          title={utility.description}
                        >
                          <span className="tool-item-name">{utility.name}</span>
                          {utility.status === 'soon' && (
                            <span className="tool-status-badge tool-status-soon">Soon</span>
                          )}
                          {utility.status === 'beta' && (
                            <span className="tool-status-badge tool-status-beta">Beta</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="tool-list-empty">
            <span>No matching utilities</span>
          </div>
        )}
      </div>
    </aside>
  );
};

