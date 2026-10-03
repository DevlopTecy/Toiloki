import React, { useState } from 'react';
import { Star, RotateCcw, Info } from 'lucide-react';
import { WorkspaceDefinition, GroupDefinition, UtilityDefinition } from '../../core/types/workspace';
import { WhatThisCanDoModal } from '../../components/common/WhatThisCanDoModal';
import './WorkspaceHeader.css';

interface WorkspaceHeaderProps {
  workspace: WorkspaceDefinition;
  activeGroup: GroupDefinition;
  activeUtility: UtilityDefinition;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onReset?: () => void;
  onBackToHome: () => void;
  onSelectFeature?: (featureId: string) => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  workspace,
  activeGroup: _activeGroup,
  activeUtility,
  isFavorite,
  onToggleFavorite,
  onReset,
  onBackToHome,
  onSelectFeature,
}) => {
  const [isWhatModalOpen, setIsWhatModalOpen] = useState(false);
  const isSecondary = Boolean(
    activeUtility.isSecondaryListing ||
    (activeUtility.primaryWorkspaceId && activeUtility.primaryWorkspaceId !== workspace.id)
  );

  const getPrimaryWorkspaceTitle = (wsId?: string) => {
    switch (wsId) {
      case 'pdf': return 'PDF';
      case 'documents': return 'Documents';
      case 'images': return 'Images';
      case 'data': return 'Data';
      case 'text': return 'Text';
      case 'developer': return 'Developer';
      case 'calculator': return 'Calculator & Converters';
      case 'files': return 'Files & Archives';
      default: return workspace.name;
    }
  };

  const breadcrumbWorkspaceName = isSecondary
    ? getPrimaryWorkspaceTitle(activeUtility.primaryWorkspaceId)
    : workspace.name;

  return (
    <>
      <header className="compact-workspace-header">
        <div className="header-left-col">
          {/* Small Muted Breadcrumb */}
          <nav className="header-breadcrumb" aria-label="Breadcrumb">
            <button type="button" className="breadcrumb-btn" onClick={onBackToHome}>
              Home
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item">{breadcrumbWorkspaceName}</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item active">{activeUtility.name}</span>
            {isSecondary && (
              <span className="also-in-chip">Also in {workspace.name}</span>
            )}
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

        {/* Action Buttons on the Right */}
        <div className="header-right-col">
          {activeUtility.features && activeUtility.features.length > 0 && (
            <button
              type="button"
              className="toiloki-btn toiloki-btn-ghost toiloki-btn-compact header-info-btn"
              onClick={() => setIsWhatModalOpen(true)}
              title="What this can do — View capabilities & upcoming features"
            >
              <Info size={13} />
              <span>What this can do</span>
            </button>
          )}

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

      {/* "What this can do" Feature Inventory Modal */}
      {activeUtility.features && activeUtility.features.length > 0 && (
        <WhatThisCanDoModal
          utility={activeUtility}
          isOpen={isWhatModalOpen}
          onClose={() => setIsWhatModalOpen(false)}
          onSelectFeature={(featId) => {
            onSelectFeature?.(featId);
            setIsWhatModalOpen(false);
          }}
        />
      )}
    </>
  );
};

