import React, { useState, useMemo } from 'react';
import {
  Search, Pin, Clock, Star, ArrowRight,
  FileText, FolderOpen, Image as ImageIcon, Table, Type, Terminal,
  Calculator, Archive, Shield, Film, Globe, Palette, Cpu
} from 'lucide-react';
import { WORKSPACES } from '../../core/registry/app-registry';
import { WorkspaceId } from '../../core/types/workspace';
import './NewTabPage.css';

interface NewTabPageProps {
  onSelectWorkspace: (id: WorkspaceId) => void;
  onSelectUtility: (workspaceId: WorkspaceId, groupId: string, utilityId: string, featureId?: string) => void;
}

const POPULAR_8_TILES = [
  { workspaceId: 'pdf', groupId: 'pdf-optimizer', utilityId: 'compress-pdf', name: 'Compress PDF', meta: 'PDF workspace' },
  { workspaceId: 'pdf', groupId: 'pdf-organize', utilityId: 'merge-pdf', name: 'Merge PDF', meta: 'PDF workspace' },
  { workspaceId: 'images', groupId: 'img-dimensions', utilityId: 'img-resize', name: 'Resize image', meta: 'Images workspace' },
  { workspaceId: 'images', groupId: 'img-converter', utilityId: 'convert-jpg', name: 'Convert to JPG', meta: 'Images workspace' },
  { workspaceId: 'developer', groupId: 'dev-formatter', utilityId: 'format-json-code', name: 'JSON formatter', meta: 'Developer workspace' },
  { workspaceId: 'text', groupId: 'text-transform', utilityId: 'case-conversion', name: 'Case conversion', meta: 'Text workspace' },
  { workspaceId: 'calculator', groupId: 'calc-general', utilityId: 'calc-basic', name: 'Calculator', meta: 'Calculator & Converters' },
  { workspaceId: 'security', groupId: 'sec-creds', utilityId: 'sec-password-generator', name: 'Password generator', meta: 'Security & Privacy' },
];

export const NewTabPage: React.FC<NewTabPageProps> = ({
  onSelectWorkspace,
  onSelectUtility,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Retrieve pinned items
  const pinnedItems = useMemo(() => {
    try {
      const raw = localStorage.getItem('toiloki_pinned');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 6);
    } catch {}
    return [];
  }, []);

  // Retrieve recent items
  const recentItems = useMemo(() => {
    try {
      const raw = localStorage.getItem('toiloki_recent') || localStorage.getItem('toiloki_history');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 5);
    } catch {}
    return [];
  }, []);

  // Filtered workspaces
  const filteredWorkspaces = useMemo(() => {
    if (!filterQuery.trim()) return WORKSPACES;
    const q = filterQuery.toLowerCase();
    return WORKSPACES.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q)
    );
  }, [filterQuery]);

  const getWsIcon = (id: WorkspaceId) => {
    switch (id) {
      case 'pdf': return <FileText size={18} />;
      case 'documents': return <FolderOpen size={18} />;
      case 'images': return <ImageIcon size={18} />;
      case 'data': return <Table size={18} />;
      case 'text': return <Type size={18} />;
      case 'developer': return <Terminal size={18} />;
      case 'calculator': return <Calculator size={18} />;
      case 'files': return <Archive size={18} />;
      case 'security': return <Shield size={18} />;
      case 'media': return <Film size={18} />;
      case 'network': return <Globe size={18} />;
      case 'design': return <Palette size={18} />;
      case 'system': return <Cpu size={18} />;
      default: return <FileText size={18} />;
    }
  };

  return (
    <div className="new-tab-page">
      {/* ─── Header & In-Page Search ─── */}
      <div className="new-tab-header">
        <h1 className="new-tab-title">New tab</h1>
        <div className="new-tab-search-box">
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="new-tab-search-input"
            placeholder="Search utilities or filter workspaces..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* ─── 1. Pinned (if any) ─── */}
      {pinnedItems.length > 0 && (
        <div className="new-tab-section">
          <div className="new-tab-section-header">
            <Pin size={14} />
            <span>Pinned</span>
          </div>
          <div className="new-tab-chips-row">
            {pinnedItems.map((item: any, idx: number) => (
              <button
                key={`pinned-${idx}`}
                type="button"
                className="new-tab-chip"
                onClick={() => onSelectUtility(item.workspaceId, item.groupId, item.utilityId)}
              >
                <Pin size={12} style={{ color: 'var(--text-muted)' }} />
                <span>{item.name || item.utilityId}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── 2. Recent (if any) ─── */}
      {recentItems.length > 0 && (
        <div className="new-tab-section">
          <div className="new-tab-section-header">
            <Clock size={14} />
            <span>Recent</span>
          </div>
          <div className="new-tab-chips-row">
            {recentItems.map((item: any, idx: number) => (
              <button
                key={`recent-${idx}`}
                type="button"
                className="new-tab-chip"
                onClick={() => onSelectUtility(item.workspaceId, item.groupId, item.utilityId || item.id)}
              >
                <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                <span>{item.name || item.utilityName || item.utilityId}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3. Popular: 8 Compact Tiles ─── */}
      <div className="new-tab-section">
        <div className="new-tab-section-header">
          <Star size={14} />
          <span>Popular</span>
        </div>
        <div className="new-tab-popular-grid">
          {POPULAR_8_TILES.map((tile) => (
            <button
              key={tile.utilityId}
              type="button"
              className="new-tab-popular-tile"
              onClick={() => onSelectUtility(tile.workspaceId as WorkspaceId, tile.groupId, tile.utilityId)}
            >
              <div className="new-tab-popular-tile-icon">
                {getWsIcon(tile.workspaceId as WorkspaceId)}
              </div>
              <div className="new-tab-popular-tile-text">
                <span className="new-tab-popular-tile-name">{tile.name}</span>
                <span className="new-tab-popular-tile-meta">{tile.meta}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. All Workspaces ─── */}
      <div className="new-tab-section">
        <div className="new-tab-section-header">
          <span>All workspaces</span>
        </div>
        <div className="new-tab-workspaces-grid">
          {filteredWorkspaces.map((ws) => {
            const count = ws.groups.reduce((acc, g) => acc + g.utilities.filter((u) => u.status !== 'soon').length, 0);
            return (
              <button
                key={ws.id}
                type="button"
                className="new-tab-workspace-card"
                onClick={() => onSelectWorkspace(ws.id)}
              >
                <div className="new-tab-ws-top">
                  <div className="new-tab-ws-name-wrap">
                    <span className="new-tab-ws-icon">{getWsIcon(ws.id)}</span>
                    <span className="new-tab-ws-title">{ws.name}</span>
                  </div>
                  <span className="new-tab-ws-count">{count} {count === 1 ? 'utility' : 'utilities'}</span>
                </div>
                <p className="new-tab-ws-desc">{ws.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
