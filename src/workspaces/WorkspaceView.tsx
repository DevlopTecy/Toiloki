import React, { useState, useEffect } from 'react';
import { WorkspaceDefinition, GroupDefinition, UtilityDefinition } from '../core/types/workspace';
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
  initialGroupId?: string;
  initialUtilityId?: string;
  onBackToHome: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace,
  initialGroupId,
  initialUtilityId,
  onBackToHome,
}) => {
  // Helper to load last-used utility per category
  const getInitialSelection = () => {
    if (initialGroupId) {
      const foundGroup = workspace.groups.find((g) => g.id === initialGroupId);
      if (foundGroup) {
        if (initialUtilityId) {
          const foundUtil = foundGroup.utilities.find((u) => u.id === initialUtilityId);
          if (foundUtil) return { group: foundGroup, utility: foundUtil };
        }
        return { group: foundGroup, utility: foundGroup.utilities[0] };
      }
    }
    if (initialUtilityId) {
      for (const group of workspace.groups) {
        const found = group.utilities.find((u) => u.id === initialUtilityId);
        if (found) return { group, utility: found };
      }
    }

    try {
      const saved = localStorage.getItem(`toiloki_last_utility_${workspace.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const g = workspace.groups.find((grp) => grp.id === parsed.groupId);
        if (g) {
          const u = g.utilities.find((util) => util.id === parsed.utilityId);
          if (u) return { group: g, utility: u };
        }
      }
    } catch {}

    const defaultGroup = workspace.groups[0];
    return { group: defaultGroup, utility: defaultGroup.utilities[0] };
  };

  const [activeGroup, setActiveGroup] = useState<GroupDefinition>(() => getInitialSelection().group);
  const [activeUtility, setActiveUtility] = useState<UtilityDefinition>(() => getInitialSelection().utility);
  const [isFav, setIsFav] = useState(() => FavoritesService.isFavorite(activeUtility.id));

  // Sync if workspace or initial params change
  useEffect(() => {
    const sel = getInitialSelection();
    setActiveGroup(sel.group);
    setActiveUtility(sel.utility);
  }, [workspace, initialGroupId, initialUtilityId]);

  useEffect(() => {
    setIsFav(FavoritesService.isFavorite(activeUtility.id));
  }, [activeUtility.id]);

  const handleSelectUtility = (group: GroupDefinition, utility: UtilityDefinition) => {
    setActiveGroup(group);
    setActiveUtility(utility);
    try {
      localStorage.setItem(
        `toiloki_last_utility_${workspace.id}`,
        JSON.stringify({ groupId: group.id, utilityId: utility.id })
      );
    } catch {}
  };

  const handleToggleFavorite = () => {
    const updated = FavoritesService.toggleFavorite({
      workspaceId: workspace.id,
      groupId: activeGroup.id,
      utilityId: activeUtility.id,
      name: activeUtility.name,
      description: activeUtility.description,
      workspaceName: workspace.name,
    });
    setIsFav(updated);
  };

  const handleReset = () => {
    window.dispatchEvent(
      new CustomEvent('toiloki_tool_reset', { detail: { utilityId: activeUtility.id } })
    );
  };

  const renderActiveUtilityView = () => {
    const commonProps = {
      groupId: activeGroup.id,
      utilityId: activeUtility.id,
      toolName: activeUtility.name,
      toolDescription: activeUtility.description,
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
        return <CalculatorWorkspaceView utilityId={activeUtility.id} />;
      case 'files':
        return <FilesWorkspaceView utilityId={activeUtility.id} />;
      default:
        return (
          <div style={{ padding: '32px', color: 'var(--text-secondary)' }}>
            Select a utility to begin.
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
      {/* ─── Utility list panel 232px ─── */}
      <ToolListPanel
        workspace={workspace}
        activeGroupId={activeGroup.id}
        activeUtilityId={activeUtility.id}
        onSelectUtility={handleSelectUtility}
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
          activeGroup={activeGroup}
          activeUtility={activeUtility}
          isFavorite={isFav}
          onToggleFavorite={handleToggleFavorite}
          onReset={handleReset}
          onBackToHome={onBackToHome}
        />
        <div
          key={activeUtility.id}
          className="workspace-view-content motion-fade-in"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {renderActiveUtilityView()}
        </div>
      </div>
    </div>
  );
};

