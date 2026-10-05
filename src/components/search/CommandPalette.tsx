import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, CornerDownLeft } from 'lucide-react';
import { WORKSPACES } from '../../core/registry/app-registry';
import { WorkspaceId, UtilityStatus, FeatureKind, FeatureStatus } from '../../core/types/workspace';
import { SettingsService } from '../../core/services/settings.service';
import { SmartPasteService } from '../../core/services/smart-paste.service';
import { PipeService } from '../../core/services/pipe.service';
import './CommandPalette.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUtility: (
    workspaceId: WorkspaceId,
    groupId: string,
    utilityId: string,
    featureId?: string
  ) => void;
}

interface SearchItem {
  workspaceId: WorkspaceId;
  workspaceName: string;
  groupId: string;
  groupName: string;
  utilityId: string;
  utilityName: string;
  description: string;
  badgeGradient: string;
  status?: UtilityStatus | FeatureStatus;
  aliases?: string[];
  keywords?: string[];
  isFeature?: boolean;
  featureId?: string;
  featureKind?: FeatureKind;
  isSmartPaste?: boolean;
  clipText?: string;
  formatId?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectUtility,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [smartPasteItem, setSmartPasteItem] = useState<SearchItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showUpcoming, setShowUpcoming] = useState(() => SettingsService.getSettings().showUpcomingUtilities);

  useEffect(() => {
    return SettingsService.subscribe((s) => {
      setShowUpcoming(s.showUpcomingUtilities);
    });
  }, []);

  // Flatten unique utilities & features for instant omnisearch
  const allUtilities: SearchItem[] = React.useMemo(() => {
    const items: SearchItem[] = [];
    const seen = new Set<string>();

    for (const ws of WORKSPACES) {
      for (const group of ws.groups) {
        for (const util of group.utilities) {
          // If secondary listing, skip so it is indexed once in its primary home
          if (util.isSecondaryListing) continue;
          if (!showUpcoming && util.status === 'soon') continue;
          if (seen.has(util.id)) continue;
          seen.add(util.id);

          // 1. Index the utility itself
          items.push({
            workspaceId: ws.id,
            workspaceName: ws.name,
            groupId: group.id,
            groupName: group.name,
            utilityId: util.id,
            utilityName: util.name,
            description: util.description,
            badgeGradient: group.badgeGradient,
            status: util.status,
            aliases: util.aliases,
            keywords: util.keywords,
          });

          // 2. Index every child feature as "{Feature Name} — {Utility Name}"
          if (util.features && util.features.length > 0) {
            for (const feat of util.features) {
              if (!showUpcoming && feat.status === 'soon') continue;
              items.push({
                workspaceId: ws.id,
                workspaceName: ws.name,
                groupId: group.id,
                groupName: `${util.name} (${feat.kind})`,
                utilityId: util.id,
                utilityName: `${feat.name} — ${util.name}`,
                description: feat.description,
                badgeGradient: group.badgeGradient,
                status: feat.status,
                aliases: feat.aliases,
                keywords: [feat.kind, feat.status, ...(feat.aliases || [])],
                isFeature: true,
                featureId: feat.id,
                featureKind: feat.kind,
              });
            }
          }
        }
      }
    }
    return items;
  }, [showUpcoming]);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    let matches = allUtilities;

    if (q) {
      matches = allUtilities.filter(
        (item) =>
          item.utilityName.toLowerCase().includes(q) ||
          item.aliases?.some((a) => a.toLowerCase().includes(q)) ||
          item.keywords?.some((k) => k.toLowerCase().includes(q)) ||
          item.groupName.toLowerCase().includes(q) ||
          item.workspaceName.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );

      // Rank exact/title matches first
      matches = matches.sort((a, b) => {
        const aName = a.utilityName.toLowerCase();
        const bName = b.utilityName.toLowerCase();
        const aStartsWith = aName.startsWith(q);
        const bStartsWith = bName.startsWith(q);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        const aIncludes = aName.includes(q);
        const bIncludes = bName.includes(q);
        if (aIncludes && !bIncludes) return -1;
        if (!aIncludes && bIncludes) return 1;
        return 0;
      });
    } else {
      matches = allUtilities.slice(0, 12);
    }

    if (smartPasteItem) {
      if (!q || q.includes('paste') || q.includes('smart') || smartPasteItem.utilityName.toLowerCase().includes(q)) {
        return [smartPasteItem, ...matches.filter((m) => m.utilityId !== smartPasteItem.utilityId)];
      }
    }

    return matches;
  }, [allUtilities, query, smartPasteItem]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);

      // Clipboard Sniffer for Smart Paste
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        navigator.clipboard.readText()
          .then((text) => {
            const raw = (text || '').trim();
            if (!raw) {
              setSmartPasteItem(null);
              return;
            }
            const det = SmartPasteService.detect(raw);
            if (det && det.formatId !== 'unknown' && det.suggestedUtilities.length > 0) {
              const top = det.suggestedUtilities[0];
              setSmartPasteItem({
                workspaceId: top.workspaceId,
                workspaceName: 'Smart Paste',
                groupId: top.groupId,
                groupName: `Clipboard (${det.badgeText})`,
                utilityId: top.utilityId,
                utilityName: `Smart Paste — Open in ${top.name}`,
                description: `Detected ${det.badgeText} on clipboard. Press Enter to paste and launch.`,
                badgeGradient: 'var(--accent)',
                status: 'ready',
                keywords: ['smart', 'paste', 'clipboard', det.formatId],
                isSmartPaste: true,
                clipText: raw,
                formatId: det.formatId,
              });
            } else {
              setSmartPasteItem(null);
            }
          })
          .catch(() => {
            setSmartPasteItem(null);
          });
      }
    } else {
      setQuery('');
      setSmartPasteItem(null);
    }
  }, [isOpen]);

  const handleSelectItem = (item: SearchItem) => {
    if (item.isSmartPaste && item.clipText) {
      PipeService.pipeToUtility(item.utilityId, {
        text: item.clipText,
        format: item.formatId || 'text',
        sourceUtilityName: `Smart Paste (${item.groupName})`,
      });
    }
    onSelectUtility(item.workspaceId, item.groupId, item.utilityId, item.featureId);
    onClose();
  };

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
          handleSelectItem(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, onSelectUtility, smartPasteItem]);

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
            placeholder="Type a feature name, utility, or format..."
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
              No matching utilities or features found for "{query}".
            </div>
          ) : (
            filtered.map((item, index) => (
              <div
                key={`${item.workspaceId}-${item.groupId}-${item.utilityId}-${item.featureId || 'main'}`}
                className={`palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="palette-badge" style={{ background: item.badgeGradient }} />
                <div className="palette-item-text">
                  <div className="palette-breadcrumbs">
                    <span>{item.workspaceName}</span>
                    <ChevronRight size={12} />
                    <span>{item.groupName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="palette-utility-name">{item.utilityName}</span>
                    {item.isFeature && (
                      <span className="feat-kind-chip">{item.featureKind}</span>
                    )}
                    {item.status === 'soon' && (
                      <span className="tool-status-badge tool-status-soon">Soon</span>
                    )}
                    {item.status === 'beta' && (
                      <span className="tool-status-badge tool-status-beta">Beta</span>
                    )}
                  </div>
                  <span className="palette-utility-desc">{item.description}</span>
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

