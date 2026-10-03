import React, { useState, useEffect } from 'react';
import { WorkspaceDefinition, GroupDefinition, UtilityDefinition } from '../core/types/workspace';
import { WorkspaceHeader } from './common/WorkspaceHeader';
import { ToolListPanel } from '../components/layout/ToolListPanel';
import { FeaturesControlsPanel } from '../components/common/FeaturesControlsPanel';
import { PdfWorkspaceView } from './pdf/PdfWorkspaceView';
import { DocumentsWorkspaceView } from './documents/DocumentsWorkspaceView';
import { ImagesWorkspaceView } from './images/ImagesWorkspaceView';
import { DataWorkspaceView } from './data/DataWorkspaceView';
import { TextWorkspaceView } from './text/TextWorkspaceView';
import { DeveloperWorkspaceView } from './developer/DeveloperWorkspaceView';
import { CalculatorWorkspaceView } from './calculator/CalculatorWorkspaceView';
import { FilesWorkspaceView } from './files/FilesWorkspaceView';
import { SecurityWorkspaceView } from './security/SecurityWorkspaceView';
import { DesignWorkspaceView } from './design/DesignWorkspaceView';
import { NetworkWorkspaceView } from './network/NetworkWorkspaceView';
import { SystemWorkspaceView } from './system/SystemWorkspaceView';
import { MediaWorkspaceView } from './media/MediaWorkspaceView';
import { FavoritesService } from '../core/services/favorites.service';
import { SoonState } from '../components/common/SoonState';
import { findUtilityByFeatureId } from '../core/registry/app-registry';
import { SettingsService, AppSettings } from '../core/services/settings.service';
import { WorkbenchShell } from '../components/workbench/WorkbenchShell';

interface WorkspaceViewProps {
  workspace: WorkspaceDefinition;
  initialGroupId?: string;
  initialUtilityId?: string;
  initialFeatureId?: string;
  onBackToHome: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace,
  initialGroupId,
  initialUtilityId,
  initialFeatureId,
  onBackToHome,
}) => {
  // Helper to load last-used utility per category
  const getInitialSelection = () => {
    // 1. Direct deep link via initialGroupId / initialUtilityId
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

    // 2. Deep link via ?feature=id parameter
    const featTarget = initialFeatureId || new URLSearchParams(window.location.search).get('feature');
    if (featTarget) {
      const matched = findUtilityByFeatureId(featTarget);
      if (matched && matched.workspace.id === workspace.id) {
        const grp = workspace.groups.find((g) => g.id === matched.group.id);
        const utl = grp?.utilities.find((u) => u.id === matched.utility.id);
        if (grp && utl) return { group: grp, utility: utl };
      }
    }

    // 3. Fallback to localStorage saved utility
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
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(() => {
    return initialFeatureId || new URLSearchParams(window.location.search).get('feature');
  });
  const [isFav, setIsFav] = useState(() => FavoritesService.isFavorite(activeUtility.id));
  
  const [settings, setSettings] = useState<AppSettings>(() => SettingsService.getSettings());
  useEffect(() => {
    const unsubscribe = SettingsService.subscribe(setSettings);
    return () => unsubscribe();
  }, []);

  // Sync if workspace or initial params change
  useEffect(() => {
    const sel = getInitialSelection();
    setActiveGroup(sel.group);
    setActiveUtility(sel.utility);
  }, [workspace, initialGroupId, initialUtilityId, initialFeatureId]);

  useEffect(() => {
    if (initialFeatureId) {
      setActiveFeatureId(initialFeatureId);
    }
  }, [initialFeatureId]);

  // Sync with browser URL popstate
  useEffect(() => {
    const onPop = () => {
      const param = new URLSearchParams(window.location.search).get('feature');
      setActiveFeatureId(param);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    setIsFav(FavoritesService.isFavorite(activeUtility.id));
  }, [activeUtility.id]);

  const handleSelectUtility = (group: GroupDefinition, utility: UtilityDefinition) => {
    setActiveGroup(group);
    setActiveUtility(utility);
    setActiveFeatureId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('feature');
    url.searchParams.set('nav', workspace.id);
    url.searchParams.set('group', group.id);
    url.searchParams.set('utility', utility.id);
    window.history.replaceState({}, '', url.toString());
    try {
      localStorage.setItem(
        `toiloki_last_utility_${workspace.id}`,
        JSON.stringify({ groupId: group.id, utilityId: utility.id })
      );
    } catch {}
  };

  const handleFeatureSelect = (featureId: string) => {
    setActiveFeatureId(featureId);
    const url = new URL(window.location.href);
    url.searchParams.set('feature', featureId);
    window.history.replaceState({}, '', url.toString());
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
    // 1. Intercept 'soon' status with clean "Not available yet" screen (zero pass-through)
    if (activeUtility.status === 'soon') {
      return (
        <SoonState
          utility={activeUtility}
          onBack={() => {
            const readyUtil = workspace.groups
              .flatMap((g) => g.utilities)
              .find((u) => u.status === 'ready' || !u.status);
            if (readyUtil) {
              const grp = workspace.groups.find((g) =>
                g.utilities.some((u) => u.id === readyUtil.id)
              );
              if (grp) handleSelectUtility(grp, readyUtil);
            } else {
              onBackToHome();
            }
          }}
        />
      );
    }

    // 2. Delegate cross-listed utilities to their primary workspace engine
    const effectiveWorkspaceId = activeUtility.primaryWorkspaceId || workspace.id;
    const effectiveGroupId = activeUtility.primaryGroupId || activeGroup.id;

    const commonProps = {
      groupId: effectiveGroupId,
      utilityId: activeUtility.id,
      toolName: activeUtility.name,
      toolDescription: activeUtility.description,
      onBackToUtilities: () => {},
      isFavorite: isFav,
      onToggleFavorite: handleToggleFavorite,
    };

    switch (effectiveWorkspaceId) {
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
      case 'security':
        return <SecurityWorkspaceView {...commonProps} />;
      case 'design':
        return <DesignWorkspaceView {...commonProps} />;
      case 'network':
        return <NetworkWorkspaceView {...commonProps} />;
      case 'system':
        return <SystemWorkspaceView {...commonProps} />;
      case 'media':
        return <MediaWorkspaceView {...commonProps} />;
      default:
        return (
          <div style={{ padding: '32px', color: 'var(--text-secondary)' }}>
            Select a utility to begin.
          </div>
        );
    }
  };

  if (settings.layout === 'workbench' && (workspace.workbench === 'file' || workspace.workbench === 'editor' || workspace.workbench === 'standalone')) {
    return (
      <WorkbenchShell
        workspace={workspace}
        activeGroup={activeGroup}
        activeUtility={activeUtility}
        onSelectUtility={handleSelectUtility}
      />
    );
  }

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
          onSelectFeature={handleFeatureSelect}
        />
        <div
          key={activeUtility.id}
          className="workspace-view-content motion-fade-in"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {activeUtility.status !== 'soon' &&
            activeUtility.features &&
            activeUtility.features.length > 0 && (
              <div style={{ padding: '16px var(--content-padding-x, 32px) 0 var(--content-padding-x, 32px)' }}>
                <FeaturesControlsPanel
                  features={activeUtility.features}
                  activeFeatureId={activeFeatureId}
                  onFeatureSelect={handleFeatureSelect}
                />
              </div>
            )}
          {renderActiveUtilityView()}
        </div>
      </div>
    </div>
  );
};

