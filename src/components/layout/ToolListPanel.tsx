import React, { useState, useEffect, useMemo } from 'react';
import { WorkspaceDefinition, UtilityDefinition, FeatureDefinition } from '../../core/types/workspace';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import './ToolListPanel.css';

interface ToolListPanelProps {
  workspace: WorkspaceDefinition;
  activeUtilityId: string;
  activeFeatureId: string;
  onSelectFeature: (utility: UtilityDefinition, feature: FeatureDefinition) => void;
}

export const ToolListPanel: React.FC<ToolListPanelProps> = ({
  workspace,
  activeUtilityId,
  activeFeatureId,
  onSelectFeature,
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

  // Calculate total tools in this workspace
  const totalTools = useMemo(() => {
    return workspace.utilities.reduce((sum, u) => sum + u.features.length, 0);
  }, [workspace]);

  // Filtered utilities & features
  const filteredUtilities = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return workspace.utilities;

    return workspace.utilities
      .map((u) => {
        const matchingFeatures = u.features.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q) ||
            f.keywords?.some((k) => k.toLowerCase().includes(q))
        );
        return {
          ...u,
          features: matchingFeatures,
        };
      })
      .filter((u) => u.features.length > 0);
  }, [workspace, searchFilter]);

  const scrollableRef = React.useRef<HTMLDivElement>(null);
  const [indicatorY, setIndicatorY] = useState<number>(-1);

  // Track position of active tool for shared sliding indicator bar (180ms ease-standard)
  useEffect(() => {
    if (!scrollableRef.current) return;
    const activeBtn = scrollableRef.current.querySelector<HTMLButtonElement>(`[data-tool-id="${activeFeatureId}"]`);
    if (activeBtn) {
      const parentRect = scrollableRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const currentScroll = scrollableRef.current.scrollTop;
      setIndicatorY(btnRect.top - parentRect.top + currentScroll + 5);
    } else {
      setIndicatorY(-1);
    }
  }, [activeFeatureId, collapsedGroups, filteredUtilities]);

  return (
    <aside className="tool-list-panel no-drag">
      {/* ─── Header: Category Name + Tool Count ─── */}
      <div className="tool-list-header">
        <div className="tool-list-title-row">
          <h2 className="tool-list-cat-name">{workspace.name}</h2>
          <span className="tool-list-count">{totalTools} tools</span>
        </div>

        {/* Small filter input if > 12 tools */}
        {totalTools > 12 && (
          <div className="tool-list-search-wrap">
            <Search size={13} className="tool-list-search-icon" />
            <input
              type="text"
              placeholder="Filter tools..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="tool-list-search-input"
            />
          </div>
        )}
      </div>

      {/* ─── Scrollable Groups and Features ─── */}
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

        {filteredUtilities.map((utility) => {
          const isCollapsed = Boolean(collapsedGroups[utility.id]);

          return (
            <div key={utility.id} className="tool-list-group">
              {/* Group Heading (12px / 500 Muted, Collapsible) */}
              <button
                type="button"
                className="tool-group-heading"
                onClick={() => toggleGroupCollapse(utility.id)}
                title={`${utility.name} (${utility.features.length})`}
              >
                <span className="tool-group-title">{utility.name}</span>
                <span className="tool-group-toggle-icon">
                  <ChevronRight
                    size={13}
                    className={`tool-group-chevron ${!isCollapsed ? 'open' : ''}`}
                  />
                </span>
              </button>

              {/* Group Features List (grid-template-rows 0fr -> 1fr, 180ms ease-standard) */}
              <div className={`tool-group-collapse ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                <div className="tool-group-collapse-inner">
                  <div className="tool-group-items">
                    {utility.features.map((feature) => {
                      const isActive = feature.id === activeFeatureId;

                      return (
                        <button
                          key={feature.id}
                          data-tool-id={feature.id}
                          type="button"
                          className={`tool-item-btn ${isActive ? 'active' : ''}`}
                          onClick={() => onSelectFeature(utility, feature)}
                          title={feature.description}
                        >
                          <span className="tool-item-name">{feature.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredUtilities.length === 0 && (
          <div className="tool-list-empty">
            <span>No matching tools</span>
          </div>
        )}
      </div>
    </aside>
  );
};
