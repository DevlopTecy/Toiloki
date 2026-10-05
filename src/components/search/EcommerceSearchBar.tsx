import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, Sliders, ChevronRight } from 'lucide-react';
import { WORKSPACES } from '../../core/registry/app-registry';
import { WorkspaceId, FeatureKind } from '../../core/types/workspace';
import './EcommerceSearchBar.css';

export interface SearchResultItem {
  id: string;
  workspaceId: WorkspaceId;
  workspaceName: string;
  groupId: string;
  groupName: string;
  utilityId: string;
  utilityName: string;
  description: string;
  icon?: any;
  isFeature?: boolean;
  featureId?: string;
  featureKind?: FeatureKind;
  featureName?: string;
  isRecent?: boolean;
}

interface EcommerceSearchBarProps {
  onSelectUtility: (
    workspaceId: WorkspaceId,
    groupId: string,
    utilityId: string,
    featureId?: string,
    openInNewTab?: boolean
  ) => void;
}

const POPULAR_UTILITY_KEYS = [
  { workspaceId: 'pdf' as WorkspaceId, groupId: 'pdf-optimizer', utilityId: 'compress-pdf', name: 'Compress PDF' },
  { workspaceId: 'pdf' as WorkspaceId, groupId: 'pdf-organize', utilityId: 'merge-pdf', name: 'Merge PDF' },
  { workspaceId: 'images' as WorkspaceId, groupId: 'img-dimensions', utilityId: 'img-resize', name: 'Resize image' },
  { workspaceId: 'images' as WorkspaceId, groupId: 'img-converter', utilityId: 'convert-jpg', name: 'Convert to JPG' },
  { workspaceId: 'developer' as WorkspaceId, groupId: 'dev-formatter', utilityId: 'format-json-code', name: 'JSON formatter' },
  { workspaceId: 'text' as WorkspaceId, groupId: 'text-transform', utilityId: 'case-conversion', name: 'Case conversion' },
];

export const EcommerceSearchBar: React.FC<EcommerceSearchBarProps> = ({ onSelectUtility }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Focus input on global Ctrl+K or Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Index all active utilities (ready and beta; skip soon)
  const { utilityIndex, featureIndex } = useMemo(() => {
    const uItems: SearchResultItem[] = [];
    const fItems: SearchResultItem[] = [];
    const seenU = new Set<string>();

    for (const ws of WORKSPACES) {
      for (const group of ws.groups) {
        for (const util of group.utilities) {
          if (util.isSecondaryListing || util.status === 'soon') continue;
          if (seenU.has(util.id)) continue;
          seenU.add(util.id);

          uItems.push({
            id: `u-${util.id}`,
            workspaceId: ws.id,
            workspaceName: ws.name,
            groupId: group.id,
            groupName: group.name,
            utilityId: util.id,
            utilityName: util.name,
            description: util.description,
            icon: util.icon,
          });

          if (util.features && util.features.length > 0) {
            for (const feat of util.features) {
              if (feat.status === 'soon') continue;
              fItems.push({
                id: `f-${util.id}-${feat.id}`,
                workspaceId: ws.id,
                workspaceName: ws.name,
                groupId: group.id,
                groupName: group.name,
                utilityId: util.id,
                utilityName: `${feat.name} - ${util.name}`,
                featureName: feat.name,
                description: feat.description,
                icon: util.icon,
                isFeature: true,
                featureId: feat.id,
                featureKind: feat.kind,
              });
            }
          }
        }
      }
    }
    return { utilityIndex: uItems, featureIndex: fItems };
  }, []);

  // Retrieve recent utilities from localStorage
  const recentItems: SearchResultItem[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('toiloki_recent') || localStorage.getItem('toiloki_history');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const items: SearchResultItem[] = [];
      for (const entry of parsed.slice(0, 5)) {
        const utilId = entry.utilityId || entry.id;
        const matched = utilityIndex.find((u) => u.utilityId === utilId);
        if (matched) {
          items.push({ ...matched, isRecent: true });
        }
      }
      return items;
    } catch {
      return [];
    }
  }, [utilityIndex, isOpen]);

  // Retrieve popular utilities
  const popularItems: SearchResultItem[] = useMemo(() => {
    const list: SearchResultItem[] = [];
    for (const pop of POPULAR_UTILITY_KEYS) {
      const found = utilityIndex.find((u) => u.utilityId === pop.utilityId);
      if (found) list.push(found);
    }
    return list;
  }, [utilityIndex]);

  // Compute matched items for search query
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { utilities: [], options: [], allCombined: [] };
    }

    // Match utilities
    const matchedUtils = utilityIndex.filter((u) => {
      return (
        u.utilityName.toLowerCase().includes(q) ||
        u.description.toLowerCase().includes(q) ||
        u.workspaceName.toLowerCase().includes(q)
      );
    });

    // Match options / features only on strong match
    const matchedOptions = featureIndex.filter((f) => {
      return (
        f.featureName?.toLowerCase().includes(q) ||
        f.utilityName.toLowerCase().includes(q)
      );
    }).slice(0, 3);

    // Max 8 rows visible overall
    const allowedUtils = matchedUtils.slice(0, Math.max(0, 8 - matchedOptions.length));
    const allCombined = [...allowedUtils, ...matchedOptions].slice(0, 8);

    return {
      utilities: allowedUtils,
      options: matchedOptions,
      allCombined,
    };
  }, [query, utilityIndex, featureIndex]);

  // Visible items in panel based on state
  const visibleItems = useMemo(() => {
    if (!query.trim()) {
      return [...recentItems, ...popularItems];
    }
    return searchResults.allCombined;
  }, [query, recentItems, popularItems, searchResults]);

  // Reset selected index when visible items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [visibleItems.length]);

  const handleSelect = (item: SearchResultItem, inNewTab = false) => {
    setIsOpen(false);
    setIsSheetOpen(false);
    setQuery('');
    onSelectUtility(item.workspaceId, item.groupId, item.utilityId, item.featureId, inNewTab);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (visibleItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % visibleItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (visibleItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (visibleItems[selectedIndex]) {
        handleSelect(visibleItems[selectedIndex], e.ctrlKey || e.metaKey);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setIsSheetOpen(false);
      inputRef.current?.blur();
    }
  };

  // Helper to render matched semibold letters
  const renderHighlightedName = (name: string, q: string) => {
    if (!q) return name;
    const parts = name.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={i}>{part}</mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      </>
    );
  };

  return (
    <div
      className={`ecommerce-search-wrapper ${isSheetOpen ? 'sheet-open' : ''}`}
      ref={wrapperRef}
    >
      {/* 25% Dim Backdrop */}
      {isOpen && (
        <div
          className="ecommerce-search-backdrop"
          onClick={() => {
            setIsOpen(false);
            setIsSheetOpen(false);
          }}
        />
      )}

      {/* Collapsed Search Icon button (under 600px width) */}
      <button
        type="button"
        className="ecommerce-search-collapsed-btn"
        onClick={() => {
          setIsSheetOpen(true);
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label="Open search"
      >
        <Search size={18} />
      </button>

      {/* Main 40px Rounded Input Field */}
      <div className={`ecommerce-search-field-container ${isOpen ? 'is-focused' : ''}`}>
        <Search size={18} className="ecommerce-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="ecommerce-search-input"
          placeholder="Search utilities"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query.length > 0 && (
          <button
            type="button"
            className="ecommerce-search-clear-btn"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
        {isSheetOpen && (
          <button
            type="button"
            className="ecommerce-search-clear-btn"
            onClick={() => {
              setIsSheetOpen(false);
              setIsOpen(false);
            }}
            aria-label="Close search sheet"
            style={{ marginLeft: 4 }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Suggestion Panel */}
      {isOpen && (
        <div className="ecommerce-search-panel" role="listbox">
          {!query.trim() ? (
            <>
              {/* Empty query: Recent */}
              {recentItems.length > 0 && (
                <div className="ecommerce-search-section">
                  <div className="ecommerce-search-heading">Recent</div>
                  {recentItems.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={`recent-${item.id}-${idx}`}
                        type="button"
                        className={`ecommerce-search-row ${isSelected ? 'is-selected' : ''}`}
                        onClick={(e) => handleSelect(item, e.ctrlKey || e.metaKey)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="ecommerce-search-row-icon">
                          <Clock size={20} />
                        </div>
                        <div className="ecommerce-search-row-text">
                          <span className="ecommerce-search-row-name">{item.utilityName}</span>
                          <span className="ecommerce-search-row-secondary">in {item.workspaceName}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty query: Popular */}
              <div className="ecommerce-search-section">
                <div className="ecommerce-search-heading">Popular</div>
                {popularItems.map((item, idx) => {
                  const globalIdx = recentItems.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  const Icon = item.icon || Search;
                  return (
                    <button
                      key={`pop-${item.id}-${idx}`}
                      type="button"
                      className={`ecommerce-search-row ${isSelected ? 'is-selected' : ''}`}
                      onClick={(e) => handleSelect(item, e.ctrlKey || e.metaKey)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                    >
                      <div className="ecommerce-search-row-icon">
                        <Icon size={20} />
                      </div>
                      <div className="ecommerce-search-row-text">
                        <span className="ecommerce-search-row-name">{item.utilityName}</span>
                        <span className="ecommerce-search-row-secondary">in {item.workspaceName}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : searchResults.allCombined.length === 0 ? (
            /* No match state with 3 suggestions */
            <div className="ecommerce-search-empty-state">
              <div className="ecommerce-search-empty-title">
                No utilities found for "{query}"
              </div>
              <div className="ecommerce-search-empty-suggestions">
                <span>Try one of these suggestions:</span>
                <div
                  className="ecommerce-search-suggestion-chip"
                  onClick={() => setQuery('pdf')}
                >
                  Search for PDF tools
                </div>
                <div
                  className="ecommerce-search-suggestion-chip"
                  onClick={() => setQuery('json')}
                >
                  Search for JSON & Developer tools
                </div>
                <div
                  className="ecommerce-search-suggestion-chip"
                  onClick={() => setQuery('image')}
                >
                  Search for Image & Converter tools
                </div>
              </div>
            </div>
          ) : (
            /* Matched Query Results */
            <>
              {searchResults.utilities.length > 0 && (
                <div className="ecommerce-search-section">
                  <div className="ecommerce-search-heading">Utilities</div>
                  {searchResults.utilities.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    const Icon = item.icon || Search;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`ecommerce-search-row ${isSelected ? 'is-selected' : ''}`}
                        onClick={(e) => handleSelect(item, e.ctrlKey || e.metaKey)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="ecommerce-search-row-icon">
                          <Icon size={20} />
                        </div>
                        <div className="ecommerce-search-row-text">
                          <span className="ecommerce-search-row-name">
                            {renderHighlightedName(item.utilityName, query)}
                          </span>
                          <span className="ecommerce-search-row-secondary">
                            in {item.workspaceName}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {searchResults.options.length > 0 && (
                <div className="ecommerce-search-section">
                  <div className="ecommerce-search-heading">Options</div>
                  {searchResults.options.map((item, idx) => {
                    const globalIdx = searchResults.utilities.length + idx;
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`ecommerce-search-row ${isSelected ? 'is-selected' : ''}`}
                        onClick={(e) => handleSelect(item, e.ctrlKey || e.metaKey)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div className="ecommerce-search-row-icon">
                          <Sliders size={18} />
                        </div>
                        <div className="ecommerce-search-row-text">
                          <span className="ecommerce-search-row-name">
                            {renderHighlightedName(item.utilityName, query)}
                          </span>
                          <span className="ecommerce-search-row-secondary">
                            in {item.workspaceName}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
