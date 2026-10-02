import React from 'react';
import { Star, RotateCcw } from 'lucide-react';
import { WorkspaceDefinition, GroupDefinition, UtilityDefinition } from '../../core/types/workspace';
import './WorkspaceHeader.css';

interface WorkspaceHeaderProps {
  workspace: WorkspaceDefinition;
  activeGroup: GroupDefinition;
  activeUtility: UtilityDefinition;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onReset?: () => void;
  onBackToHome: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  workspace,
  activeGroup: _activeGroup,
  activeUtility,
  isFavorite,
  onToggleFavorite,
  onReset,
  onBackToHome,
}) => {
  return (
    <header className="compact-workspace-header">
      <div className="header-left-col">
        {/* Small Muted Breadcrumb */}
        <nav className="header-breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="breadcrumb-btn" onClick={onBackToHome}>
            Home
          </button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item">{workspace.name}</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item active">{activeUtility.name}</span>
        </nav>

        {/* Utility Title 22px + Favorite Star */}
        <div className="header-title-row">
          <h1 className="header-tool-title">{activeUtility.name}</h1>
          <button
            type="button"
            className={`header-star-btn ${isFavorite ? 'favorited' : ''}`}
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={16} fill={isFavorite ? 'var(--accent)' : 'none'} />
          </button>
        </div>

        {/* ONE Muted Line of Description */}
        <p className="header-tool-desc">{activeUtility.description}</p>
      </div>

      {/* Ghost Reset Button on the Right */}
      <div className="header-right-col">
        {onReset && (
          <button
            type="button"
            className="toiloki-btn toiloki-btn-ghost toiloki-btn-compact header-reset-btn"
            onClick={onReset}
            title="Reset utility parameters to defaults"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </header>
  );
};

