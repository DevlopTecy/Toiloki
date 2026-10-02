import React, { useMemo } from 'react';
import {
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  FileCode,
  MoreHorizontal,
} from 'lucide-react';
import { WORKSPACES } from '../../core/registry/app-registry';
import { WorkspaceId } from '../../core/types/workspace';
import { HistoryService } from '../../core/services/history.service';
import { SettingsService } from '../../core/services/settings.service';
import { useTheme } from '../../core/theme/ThemeContext';
import { ImageCard } from '../../components/common/ImageCard';
import { getDefaultArtwork } from '../../assets/art-pack/default-art-pack';
import './DashboardHome.css';

// Module-scoped session flag: animation plays only once per session
let hasAnimatedHomeSession = false;

interface DashboardHomeProps {
  onSelectWorkspace: (id: WorkspaceId) => void;
  onSelectTool: (workspaceId: WorkspaceId, utilityId: string, featureId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  pdf: 'var(--cat-pdf, #EF4444)',
  documents: 'var(--cat-documents, #3B82F6)',
  images: 'var(--cat-images, #22C55E)',
  data: 'var(--cat-data, #F59E0B)',
  text: 'var(--cat-text, #8B5CF6)',
  developer: 'var(--cat-developer, #F97316)',
  calculator: 'var(--cat-calculator, #EAB308)',
  files: 'var(--cat-files, #3B82F6)',
};

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onSelectWorkspace,
  onSelectTool,
}) => {
  const shouldAnimate = React.useRef(!hasAnimatedHomeSession).current;
  const { activeTheme, resolvedMode } = useTheme();

  React.useEffect(() => {
    hasAnimatedHomeSession = true;
  }, []);

  const settings = SettingsService.getSettings();
  const isHighContrast = activeTheme.id === 'high-contrast';
  const isImageStyle = !isHighContrast && (
    settings.buttonCardStyle === 'image' || activeTheme.buttons?.cardStyle === 'image'
  );

  // Real history records for Recent Activity
  const records = useMemo(() => {
    return HistoryService.getRecords().slice(0, 5);
  }, []);

  // Pinned Quick Actions
  const quickActions = [
    { name: 'Merge PDF', workspaceId: 'pdf' as WorkspaceId, utilityId: 'page-organizer', featureId: 'merge-pdf', badgeClass: 'badge-pdf', desc: 'Combine multiple PDF files' },
    { name: 'Resize Images', workspaceId: 'images' as WorkspaceId, utilityId: 'image-editor', featureId: 'resize-rescale', badgeClass: 'badge-img', desc: 'Batch scale & reformat' },
    { name: 'JSON Formatter', workspaceId: 'developer' as WorkspaceId, utilityId: 'formatters', featureId: 'json-beautifier', badgeClass: 'badge-dev', desc: 'Beautify, minify, validate' },
    { name: 'Hash & Checksum', workspaceId: 'files' as WorkspaceId, utilityId: 'file-analysis', featureId: 'checksum-hash', badgeClass: 'badge-files', desc: 'MD5, SHA-256 integrity' },
    { name: 'Text Diff / Compare', workspaceId: 'text' as WorkspaceId, utilityId: 'text-compare', featureId: 'side-by-side-diff', badgeClass: 'badge-text', desc: 'Side-by-side comparison' },
    { name: 'Create ZIP Archive', workspaceId: 'files' as WorkspaceId, utilityId: 'archive-manager', featureId: 'create-archive', badgeClass: 'badge-files', desc: 'Compress folders and files' },
  ];

  return (
    <div className={`dashboard-home ${isImageStyle ? 'is-image-style' : ''}`}>
      {/* ─── 1. Category Grid (4x2 grid / 20px gap) ─── */}
      <section className="dashboard-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <h2 className="section-title">Tool categories</h2>
            <span className="section-count">{WORKSPACES.length} Modules</span>
          </div>
        </div>

        <div className="categories-grid">
          {WORKSPACES.map((ws) => {
            const toolCount = ws.utilities.reduce((acc, u) => acc + u.features.length, 0);
            const categoryColor = CATEGORY_COLORS[ws.id] || 'var(--cat-system, #64748B)';
            const pictureConfig = activeTheme.buttons?.pictures?.[ws.id];

            return (
              <ImageCard
                key={ws.id}
                id={ws.id}
                title={ws.name}
                description={ws.description}
                toolCount={toolCount}
                icon={ws.icon}
                categoryColor={categoryColor}
                cardStyle={isImageStyle ? 'image' : 'flat'}
                pictureConfig={pictureConfig}
                onClick={() => onSelectWorkspace(ws.id)}
              />
            );
          })}
        </div>
      </section>

      {/* ─── 2. Two-Column Section: Recent Activity & Quick Actions ─── */}
      <div className="dashboard-two-col">
        {/* Left Column: Recent files & runs */}
        <section className="dashboard-section col-half">
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 className="section-title">Recent activity</h2>
              <span className="section-count">{records.length} Recorded</span>
            </div>
          </div>

          <div className="recent-runs-list">
            {records.length === 0 ? (
              <div className="empty-runs-state">
                <FileCode size={18} className="empty-icon" />
                <span className="empty-runs-title">No recent operations</span>
                <span className="empty-runs-sub">
                  Processed files will appear here for fast one-click access.
                </span>
              </div>
            ) : (
              records.map((rec, idx) => {
                const isSuccess = rec.status === 'completed';
                const formattedTime =
                  rec.timestamp && !isNaN(new Date(rec.timestamp).getTime())
                    ? new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                const wsColor = rec.workspaceId ? CATEGORY_COLORS[rec.workspaceId] : undefined;

                return (
                  <div
                    key={rec.id}
                    className={`recent-run-row ${isImageStyle ? 'image-style-row' : ''}`}
                    style={
                      shouldAnimate
                        ? {
                            animation: 'workspaceEntrance var(--dur-page) var(--ease-out) forwards',
                            animationDelay: `${Math.min(idx, 7) * 25}ms`,
                          }
                        : undefined
                    }
                    onClick={() =>
                      rec.workspaceId &&
                      rec.utilityId &&
                      rec.featureId &&
                      onSelectTool(rec.workspaceId as WorkspaceId, rec.utilityId, rec.featureId)
                    }
                  >
                    <div className="run-row-left">
                      {isImageStyle && wsColor ? (
                        <div
                          className="run-icon-tile-small"
                          style={{
                            background: `linear-gradient(180deg, color-mix(in srgb, ${wsColor} 92%, white 8%) 0%, ${wsColor} 100%)`,
                          }}
                        >
                          {isSuccess ? (
                            <CheckCircle2 size={16} color="#FFFFFF" />
                          ) : (
                            <AlertCircle size={16} color="#FFFFFF" />
                          )}
                        </div>
                      ) : (
                        <div className="run-status-indicator">
                          {isSuccess ? (
                            <CheckCircle2 size={14} className="run-status-icon success" />
                          ) : (
                            <AlertCircle size={14} className="run-status-icon failed" />
                          )}
                        </div>
                      )}

                      <div className="run-details">
                        <span className="run-tool-name">{rec.toolName}</span>
                        <span className="run-file-target">{rec.input || rec.output || 'Local Task'}</span>
                      </div>
                    </div>

                    <div className="run-row-right">
                      {formattedTime && <span className="run-timestamp">{formattedTime}</span>}
                      {isImageStyle ? (
                        <button
                          type="button"
                          className="run-overflow-btn"
                          title="More options"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (rec.workspaceId && rec.utilityId && rec.featureId) {
                              onSelectTool(rec.workspaceId as WorkspaceId, rec.utilityId, rec.featureId);
                            }
                          }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      ) : (
                        <button
                          className="run-open-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (rec.workspaceId && rec.utilityId && rec.featureId) {
                              onSelectTool(rec.workspaceId as WorkspaceId, rec.utilityId, rec.featureId);
                            }
                          }}
                        >
                          <span>Open</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Pinned / Favorite Tools Mini-Grid */}
        <section className="dashboard-section col-half">
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 className="section-title">Quick actions</h2>
              <span className="section-count">Pinned Tools</span>
            </div>
          </div>

          <div className="quick-actions-grid">
            {quickActions.map((qa, idx) => {
              const ws = WORKSPACES.find((w) => w.id === qa.workspaceId);
              const Icon = ws?.icon || ArrowUpRight;
              const catColor = CATEGORY_COLORS[qa.workspaceId] || 'var(--accent)';
              const defaultArt = getDefaultArtwork(qa.workspaceId, resolvedMode);

              return (
                <div
                  key={idx}
                  className={`quick-action-card ${isImageStyle ? 'image-style-card' : ''}`}
                  style={
                    shouldAnimate
                      ? {
                          animation: 'workspaceEntrance var(--dur-page) var(--ease-out) forwards',
                          animationDelay: `${Math.min(idx, 7) * 25}ms`,
                        }
                      : undefined
                  }
                  title={qa.desc}
                  onClick={() => onSelectTool(qa.workspaceId, qa.utilityId, qa.featureId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectTool(qa.workspaceId, qa.utilityId, qa.featureId);
                  }}
                >
                  {/* Faint background artwork in Image Style (opacity 0.25) */}
                  {isImageStyle && (
                    <div
                      className="qa-faint-art"
                      aria-hidden="true"
                      style={{
                        backgroundImage: `url('${defaultArt}')`,
                      }}
                    />
                  )}

                  <div className="quick-action-top">
                    {isImageStyle ? (
                      <div
                        className="qa-icon-tile-small"
                        style={{
                          background: `linear-gradient(180deg, color-mix(in srgb, ${catColor} 92%, white 8%) 0%, ${catColor} 100%)`,
                        }}
                      >
                        <Icon size={18} color="#FFFFFF" />
                      </div>
                    ) : (
                      <span className={`qa-tag ${qa.badgeClass}`}>{qa.workspaceId}</span>
                    )}
                    <ArrowUpRight size={14} className="qa-arrow" />
                  </div>

                  <div className="quick-action-info">
                    <span className="qa-name">{qa.name}</span>
                    <span className="qa-desc">{qa.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
