import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, CornerDownLeft } from 'lucide-react';
import { WORKSPACES } from '../../core/registry/app-registry';
import { WorkspaceId } from '../../core/types/workspace';
import './CommandPalette.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFeature: (workspaceId: WorkspaceId, utilityId: string, featureId: string) => void;
}

interface SearchItem {
  workspaceId: WorkspaceId;
  workspaceName: string;
  utilityId: string;
  utilityName: string;
  featureId: string;
  featureName: string;
  description: string;
  badgeGradient: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectFeature,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten all features for instant searching
  const allFeatures: SearchItem[] = React.useMemo(() => {
    const items: SearchItem[] = [];
    for (const ws of WORKSPACES) {
      for (const util of ws.utilities) {
        for (const feat of util.features) {
          items.push({
            workspaceId: ws.id,
            workspaceName: ws.name,
            utilityId: util.id,
            utilityName: util.name,
            featureId: feat.id,
            featureName: feat.name,
            description: feat.description,
            badgeGradient: util.badgeGradient,
          });
        }
      }
    }
    return items;
  }, []);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return allFeatures.slice(0, 10);
    const q = query.toLowerCase();
    return allFeatures.filter(
      (item) =>
        item.featureName.toLowerCase().includes(q) ||
        item.utilityName.toLowerCase().includes(q) ||
        item.workspaceName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [allFeatures, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
        } else if (e.key === 'Enter' && filtered[selectedIndex]) {
          e.preventDefault();
          const item = filtered[selectedIndex];
          onSelectFeature(item.workspaceId, item.utilityId, item.featureId);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, onSelectFeature]);

  if (!isOpen) return null;

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-search-bar">
          <Search size={18} className="palette-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a tool name, command or file format..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="palette-close-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="palette-results-list">
          {filtered.length === 0 ? (
            <div className="palette-empty">
              No matching tools found for "{query}".
            </div>
          ) : (
            filtered.map((item, index) => (
              <div
                key={`${item.workspaceId}-${item.utilityId}-${item.featureId}`}
                className={`palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  onSelectFeature(item.workspaceId, item.utilityId, item.featureId);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="palette-badge" style={{ background: item.badgeGradient }} />
                <div className="palette-item-text">
                  <div className="palette-breadcrumbs">
                    <span>{item.workspaceName}</span>
                    <ChevronRight size={12} />
                    <span>{item.utilityName}</span>
                  </div>
                  <span className="palette-feature-name">{item.featureName}</span>
                  <span className="palette-feature-desc">{item.description}</span>
                </div>
                {index === selectedIndex && (
                  <div className="palette-enter-hint">
                    <span>Select</span>
                    <CornerDownLeft size={12} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to select</span>
          <span><kbd>esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
