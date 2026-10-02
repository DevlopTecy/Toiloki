import React, { useState } from 'react';
import { Star, Trash2, ArrowUpRight, Search } from 'lucide-react';
import { WorkspaceId } from '../../core/types/workspace';
import { FavoritesService, FavoriteItem } from '../../core/services/favorites.service';
import './FavoritesView.css';

interface FavoritesViewProps {
  onSelectUtility?: (workspaceId: WorkspaceId, groupId: string, utilityId: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onSelectUtility }) => {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => FavoritesService.getFavorites());

  const handleRemoveFavorite = (e: React.MouseEvent, utilityId: string) => {
    e.stopPropagation();
    FavoritesService.removeFavorite(utilityId);
    setFavorites(FavoritesService.getFavorites());
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
          <h2 className="section-title">Favorite Utilities</h2>
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
          <h3>No favorite utilities yet</h3>
          <p>Click the star icon in any utility to pin it here for quick 1-click access.</p>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="favorites-empty">
          <p>No favorites match "{search}"</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {filteredFavorites.map((fav) => (
            <div
              key={fav.utilityId}
              className="fav-card"
              onClick={() => onSelectUtility?.(fav.workspaceId, fav.groupId, fav.utilityId)}
            >
              <div className="fav-card-top">
                <span className="fav-workspace-pill">{fav.workspaceName}</span>
                <button
                  className="fav-unstar-btn"
                  onClick={(e) => handleRemoveFavorite(e, fav.utilityId)}
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
                <span className="fav-launch-hint">Open Utility</span>
                <ArrowUpRight size={14} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
