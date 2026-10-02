import React, { useState } from 'react';
import { Star, Trash2, ArrowUpRight, Search } from 'lucide-react';
import { WORKSPACES } from '../../core/registry/app-registry';
import { WorkspaceId } from '../../core/types/workspace';
import './FavoritesView.css';

interface FavoriteItem {
  workspaceId: WorkspaceId;
  utilityId: string;
  featureId: string;
  name: string;
  description: string;
  workspaceName: string;
}

interface FavoritesViewProps {
  onSelectFeature?: (workspaceId: WorkspaceId, utilityId: string, featureId: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onSelectFeature }) => {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem('toiloki_favorites');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Default seeded favorites
    return [
      {
        workspaceId: 'pdf',
        utilityId: 'page-organizer',
        featureId: 'merge-pdf',
        name: 'Merge PDF',
        description: 'Combine multiple PDF files into one.',
        workspaceName: 'PDF',
      },
      {
        workspaceId: 'images',
        utilityId: 'image-optimizer',
        featureId: 'compress-image',
        name: 'Compress Image',
        description: 'Reduce image file size with quality slider.',
        workspaceName: 'Images',
      },
      {
        workspaceId: 'text',
        utilityId: 'text-cleaner',
        featureId: 'remove-spaces',
        name: 'Remove Extra Spaces',
        description: 'Collapse consecutive spaces and trim whitespace.',
        workspaceName: 'Text',
      },
      {
        workspaceId: 'files',
        utilityId: 'files-operations',
        featureId: 'batch-rename-files',
        name: 'Batch Rename',
        description: 'Rename files with prefix, suffix, and numbering.',
        workspaceName: 'Files & Archives',
      },
      {
        workspaceId: 'developer',
        utilityId: 'dev-formatter',
        featureId: 'format-json-code',
        name: 'JSON Formatter',
        description: 'Format and indent JSON data.',
        workspaceName: 'Developer',
      },
      {
        workspaceId: 'calculator',
        utilityId: 'calc-general',
        featureId: 'calc-basic',
        name: 'Basic Calculator',
        description: 'Standard desktop arithmetic calculator.',
        workspaceName: 'Calculator & Converters',
      },
    ];
  });

  const handleRemoveFavorite = (e: React.MouseEvent, featureId: string) => {
    e.stopPropagation();
    const updated = favorites.filter((f) => f.featureId !== featureId);
    setFavorites(updated);
    localStorage.setItem('toiloki_favorites', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setFavorites([]);
    localStorage.removeItem('toiloki_favorites');
  };

  const filteredFavorites = favorites.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.workspaceName.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="favorites-view-container">
      <div className="favorites-header">
        <div>
          <h2 className="section-title">Favorite Tools</h2>
          <p className="favorites-subtitle">
            Quick access to your most frequently used desktop utilities.
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="fav-actions-group">
            <div className="fav-search-box">
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Filter favorites..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="clear-favs-btn" onClick={handleClearAll} title="Clear All Favorites">
              <Trash2 size={14} /> Clear All
            </button>
          </div>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="favorites-empty">
          <Star size={36} color="var(--text-muted)" />
          <h3>No favorite tools yet</h3>
          <p>Click the star icon in any utility tool to pin it here for quick 1-click access.</p>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="favorites-empty">
          <p>No favorites match "{search}"</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {filteredFavorites.map((fav) => (
            <div
              key={fav.featureId}
              className="fav-card"
              onClick={() => onSelectFeature?.(fav.workspaceId, fav.utilityId, fav.featureId)}
            >
              <div className="fav-card-top">
                <span className="fav-workspace-pill">{fav.workspaceName}</span>
                <button
                  className="fav-unstar-btn"
                  onClick={(e) => handleRemoveFavorite(e, fav.featureId)}
                  title="Remove from favorites"
                >
                  <Star size={16} fill="var(--color-warning)" color="var(--color-warning)" />
                </button>
              </div>

              <div className="fav-card-body">
                <h4 className="fav-tool-name">{fav.name}</h4>
                <p className="fav-tool-desc">{fav.description}</p>
              </div>

              <div className="fav-card-footer">
                <span className="fav-launch-hint">Open Tool</span>
                <ArrowUpRight size={14} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
