import React, { useState, useEffect } from 'react';
import { WorkspaceDefinition, UtilityDefinition, FeatureDefinition } from '../core/types/workspace';
import { WorkspaceHeader } from './common/WorkspaceHeader';
import { ToolListPanel } from '../components/layout/ToolListPanel';
import { PdfWorkspaceView } from './pdf/PdfWorkspaceView';
import { DocumentsWorkspaceView } from './documents/DocumentsWorkspaceView';
import { ImagesWorkspaceView } from './images/ImagesWorkspaceView';
import { DataWorkspaceView } from './data/DataWorkspaceView';
import { TextWorkspaceView } from './text/TextWorkspaceView';
import { DeveloperWorkspaceView } from './developer/DeveloperWorkspaceView';
import { CalculatorWorkspaceView } from './calculator/CalculatorWorkspaceView';
import { FilesWorkspaceView } from './files/FilesWorkspaceView';
import { FavoritesService } from '../core/services/favorites.service';

interface WorkspaceViewProps {
  workspace: WorkspaceDefinition;
  initialUtilityId?: string;
  initialFeatureId?: string;
  onBackToHome: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace,
  initialUtilityId,
  initialFeatureId,
  onBackToHome,
}) => {
  // Helper to load last-used tool per category
  const getInitialSelection = () => {
    if (initialUtilityId) {
      const foundUtil = workspace.utilities.find((u) => u.id === initialUtilityId);
      if (foundUtil) {
        if (initialFeatureId) {
          const foundFeat = foundUtil.features.find((f) => f.id === initialFeatureId);
          if (foundFeat) return { util: foundUtil, feat: foundFeat };
        }
        return { util: foundUtil, feat: foundUtil.features[0] };
      }
    }

    try {
      const saved = localStorage.getItem(`toiloki_last_tool_${workspace.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const u = workspace.utilities.find((util) => util.id === parsed.utilId);
        if (u) {
          const f = u.features.find((feat) => feat.id === parsed.featId);
          if (f) return { util: u, feat: f };
        }
      }
    } catch {}

    const defaultUtil = workspace.utilities[0];
    return { util: defaultUtil, feat: defaultUtil.features[0] };
  };

  const [activeUtility, setActiveUtility] = useState<UtilityDefinition>(() => getInitialSelection().util);
  const [activeFeature, setActiveFeature] = useState<FeatureDefinition>(() => getInitialSelection().feat);
  const [isFav, setIsFav] = useState(() => FavoritesService.isFavorite(activeFeature.id));

  // Sync if workspace or initial params change
  useEffect(() => {
    const sel = getInitialSelection();
    setActiveUtility(sel.util);
    setActiveFeature(sel.feat);
  }, [workspace, initialUtilityId, initialFeatureId]);

  useEffect(() => {
    setIsFav(FavoritesService.isFavorite(activeFeature.id));
  }, [activeFeature.id]);

  const handleSelectFeature = (util: UtilityDefinition, feat: FeatureDefinition) => {
    setActiveUtility(util);
    setActiveFeature(feat);
    try {
      localStorage.setItem(
        `toiloki_last_tool_${workspace.id}`,
        JSON.stringify({ utilId: util.id, featId: feat.id })
      );
    } catch {}
  };

  const handleToggleFavorite = () => {
    const updated = FavoritesService.toggleFavorite({
      workspaceId: workspace.id,
      utilityId: activeUtility.id,
      featureId: activeFeature.id,
      name: activeFeature.name,
      description: activeFeature.description,
      workspaceName: workspace.name,
    });
    setIsFav(updated);
  };

  const handleReset = () => {
    window.dispatchEvent(
      new CustomEvent('toiloki_tool_reset', { detail: { featureId: activeFeature.id } })
    );
  };

  const renderActiveFeatureView = () => {
    const commonProps = {
      utilityId: activeUtility.id,
      featureId: activeFeature.id,
      toolName: activeFeature.name,
      toolDescription: activeFeature.description,
      onBackToUtilities: () => {},
      isFavorite: isFav,
      onToggleFavorite: handleToggleFavorite,
    };

    switch (workspace.id) {
      case 'pdf':
        return <PdfWorkspaceView {...commonProps} />;
      case 'images':
        return <ImagesWorkspaceView {...commonProps} />;
      case 'data':
        return <DataWorkspaceView {...commonProps} />;
      case 'documents':
        return <DocumentsWorkspaceView {...commonProps} />;
      case 'text':
        return <TextWorkspaceView {...commonProps} />;
      case 'developer':
        return <DeveloperWorkspaceView {...commonProps} />;
      case 'calculator':
        return <CalculatorWorkspaceView featureId={activeFeature.id} />;
      case 'files':
        return <FilesWorkspaceView featureId={activeFeature.id} />;
      default:
        return (
          <div style={{ padding: '32px', color: 'var(--text-secondary)' }}>
            Select a utility feature to begin.
          </div>
        );
    }
  };

  return (
    <div
      className="workspace-view-container"
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ─── Tool list panel 232px ─── */}
      <ToolListPanel
        workspace={workspace}
        activeUtilityId={activeUtility.id}
        activeFeatureId={activeFeature.id}
        onSelectFeature={handleSelectFeature}
      />

      {/* ─── Main Workspace Area ─── */}
      <div
        className="workspace-main-area"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
          overflowY: 'auto',
          backgroundColor: 'var(--bg)',
        }}
      >
        <WorkspaceHeader
          workspace={workspace}
          activeUtility={activeUtility}
          activeFeature={activeFeature}
          isFavorite={isFav}
          onToggleFavorite={handleToggleFavorite}
          onReset={handleReset}
          onBackToHome={onBackToHome}
        />
        <div
          key={activeFeature.id}
          className="workspace-view-content motion-fade-in"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {renderActiveFeatureView()}
        </div>
      </div>
    </div>
  );
};
