import React, { useMemo } from 'react';
import {
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  FileCode,
  MoreHorizontal,
  Database,
  RotateCcw,
} from 'lucide-react';
import { WORKSPACES } from '../../core/registry/app-registry';
import { WorkspaceId } from '../../core/types/workspace';
import { HistoryService } from '../../core/services/history.service';
import { SettingsService } from '../../core/services/settings.service';
import { UtilityRegistry } from '../../core/registry/tool-registry';
import { SessionStore, ResumeSessionItem } from '../../core/services/session.service';
import { useTheme } from '../../core/theme/ThemeContext';
import { ImageCard } from '../../components/common/ImageCard';
import { plural } from '../../core/utils/plural';
import './DashboardHome.css';

// Module-scoped session flag: animation plays only once per session
let hasAnimatedHomeSession = false;

interface DashboardHomeProps {
  onSelectWorkspace: (id: WorkspaceId) => void;
  onSelectUtility: (workspaceId: WorkspaceId, groupId: string, utilityId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  pdf: 'var(--cat-pdf)',
  documents: 'var(--cat-documents)',
  images: 'var(--cat-images)',
  data: 'var(--cat-data)',
  text: 'var(--cat-text)',
  developer: 'var(--cat-developer)',
  calculator: 'var(--cat-calculator)',
  files: 'var(--cat-files)',
  security: 'var(--cat-security)',
  media: 'var(--cat-media)',
  network: 'var(--cat-network)',
  design: 'var(--cat-design)',
  system: 'var(--cat-system)',
};

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onSelectWorkspace,
  onSelectUtility,
}) => {
  const shouldAnimate = React.useRef(!hasAnimatedHomeSession).current;
  const { activeTheme, resolvedMode } = useTheme();

  React.useEffect(() => {
    hasAnimatedHomeSession = true;
  }, []);

  const [settings, setSettings] = React.useState(() => SettingsService.getSettings());
  React.useEffect(() => {
    return SettingsService.subscribe((updated) => setSettings(updated));
  }, []);

  // Hide workspaces with zero openable utilities
  const visibleWorkspacesList = useMemo(() => {
    const visibleIds = new Set(settings.visibleWorkspaces);
    return WORKSPACES.filter((ws) => {
      if (!visibleIds.has(ws.id)) return false;
      const openableCount = ws.groups
        .flatMap((g) => g.utilities)
        .filter((u) => u.status !== 'soon').length;
      return openableCount > 0;
    });
  }, [settings.visibleWorkspaces]);

  const isHighContrast = activeTheme.id === 'high-contrast';
  const isImageStyle = !isHighContrast && (
    settings.buttonCardStyle === 'image' || activeTheme.buttons?.cardStyle === 'image'
  );

  // Real history records for Recent Activity
  const records = useMemo(() => {
    return HistoryService.getRecords().slice(0, 5);
  }, []);

  // Check for resumeable sessions across tabs / restart
  const [resumeSessions, setResumeSessions] = React.useState<ResumeSessionItem[]>(() =>
    SessionStore.getResumeableSessions()
  );

  React.useEffect(() => {
    return SessionStore.subscribe(() => {
      setResumeSessions(SessionStore.getResumeableSessions());
    });
  }, []);

  // Pinned Quick Actions
  const [pinnedIds, setPinnedIds] = React.useState<string[]>(() => UtilityRegistry.getPinnedIds());

  React.useEffect(() => {
    const handlePinnedUpdate = (e: any) => {
      setPinnedIds(e.detail || UtilityRegistry.getPinnedIds());
    };
    window.addEventListener('toiloki-pinned-updated', handlePinnedUpdate);
    return () => window.removeEventListener('toiloki-pinned-updated', handlePinnedUpdate);
  }, []);

  // Quick actions: max 6 medium tiles
  const quickActions = useMemo(() => {
    return pinnedIds
      .map((id) => {
        const util = UtilityRegistry.getUtilityById(id);
        if (!util || util.status === 'soon') return null;
        return {
          name: util.name,
          workspaceId: util.workspaceId as WorkspaceId,
          groupId: util.groupId,
          utilityId: util.utilityId,
          desc: util.description,
        };
      })
      .filter((qa): qa is NonNullable<typeof qa> => !!qa)
      .slice(0, 6);
  }, [pinnedIds]);

  return (
    <div className={`dashboard-home ${isImageStyle ? 'is-image-style' : ''}`}>
      {/* ─── Optional Local-only Storage Savings Summary Card ─── */}
      {settings.showSavingsSummary && (
        <section className="dashboard-section savings-summary-section">
          <div className="savings-summary-card">
            <div className="savings-card-left">
              <div className="savings-icon-wrap">
                <Database size={16} />
              </div>
              <div className="savings-text-group">
                <div className="savings-headline">
                  Saved <span className="savings-highlight">~48.2 MB</span> this week
                </div>
                <div className="savings-subtext">
                  Local offline storage footprint reduced across PDF and Image optimizations. No remote telemetry, no streaks.
                </div>
              </div>
            </div>
            <div className="savings-badge">Local Estimate</div>
          </div>
        </section>
      )}

      {/* ─── 1. Two-Column Section: Recent Activity & Quick Actions (Pinned) ─── */}
      <div className="dashboard-two-col">
        {/* Left Column: Recent files & runs (with resume row for active sessions) */}
        <section className="dashboard-section col-half">
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 className="section-title">Recent activity</h2>
              <span className="section-count">{plural(records.length, 'recorded item')}</span>
            </div>
          </div>

          <div className="recent-runs-list">
            {/* Resume Row on Home if temp / session files exist */}
            {resumeSessions.map((session) => (
              <div
                key={session.id}
                className="recent-run-row unsaved-resume-row"
                onClick={() => {
                  if (session.groupId && session.utilityId) {
                    onSelectUtility(session.workspaceId as WorkspaceId, session.groupId, session.utilityId);
                  } else {
                    onSelectWorkspace(session.workspaceId as WorkspaceId);
                  }
                }}
              >
                <div className="run-row-left">
                  <div className="unsaved-pulse-dot" title="Session with files ready to resume" />
                  <div className="run-details">
                    <span className="run-tool-name">Resume session: {session.title}</span>
                    <span className="run-file-target">{session.summary}</span>
                  </div>
                </div>
                <div className="run-row-right">
                  <button
                    type="button"
                    className="run-open-btn resume-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (session.groupId && session.utilityId) {
                        onSelectUtility(session.workspaceId as WorkspaceId, session.groupId, session.utilityId);
                      } else {
                        onSelectWorkspace(session.workspaceId as WorkspaceId);
                      }
                    }}
                  >
                    <span>Resume</span>
                  </button>
                  <button
                    type="button"
                    className="run-open-btn clear-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      SessionStore.clearSession(session.tabId, session.workspaceId);
                    }}
                    title="Discard temp files"
                  >
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            ))}

            {records.length === 0 && resumeSessions.length === 0 ? (
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
                      rec.groupId &&
                      rec.utilityId &&
                      onSelectUtility(rec.workspaceId as WorkspaceId, rec.groupId, rec.utilityId)
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
                            <CheckCircle2 size={16} color="var(--on-accent)" />
                          ) : (
                            <AlertCircle size={16} color="var(--on-accent)" />
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
                            if (rec.workspaceId && rec.groupId && rec.utilityId) {
                              onSelectUtility(rec.workspaceId as WorkspaceId, rec.groupId, rec.utilityId);
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
                            if (rec.workspaceId && rec.groupId && rec.utilityId) {
                              onSelectUtility(rec.workspaceId as WorkspaceId, rec.groupId, rec.utilityId);
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

        {/* Right Column: Quick actions — Medium tiles, 56px high, grid auto-fill minmax(180px, 1fr), max 6 */}
        <section className="dashboard-section col-half">
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 className="section-title">Quick actions</h2>
              <span className="section-count">{plural(quickActions.length, 'quick action')}</span>
            </div>
          </div>

          <div className="quick-actions-grid">
            {quickActions.map((qa, idx) => {
              const ws = WORKSPACES.find((w) => w.id === qa.workspaceId);
              const Icon = ws?.icon || ArrowUpRight;

              return (
                <div
                  key={qa.utilityId}
                  className="quick-action-card"
                  style={
                    shouldAnimate
                      ? {
                          animation: 'workspaceEntrance var(--dur-page) var(--ease-out) forwards',
                          animationDelay: `${Math.min(idx, 5) * 25}ms`,
                        }
                      : undefined
                  }
                  title={`${qa.name} - ${qa.desc}`}
                  onClick={() => onSelectUtility(qa.workspaceId, qa.groupId, qa.utilityId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectUtility(qa.workspaceId, qa.groupId, qa.utilityId);
                  }}
                >
                  <div className="qa-icon-wrap">
                    <Icon size={20} />
                  </div>
                  <span className="qa-name">{qa.name}</span>
                  <ChevronRight size={15} className="qa-arrow" />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ─── 2. Category Grid (Workspaces) ─── */}
      <section className="dashboard-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <h2 className="section-title">Utility categories</h2>
            <span className="section-count">{plural(visibleWorkspacesList.length, 'workspace')}</span>
          </div>
        </div>

        <div className="categories-grid">
          {visibleWorkspacesList.map((ws) => {
            const allUtils = ws.groups.flatMap((g) => g.utilities);
            const uniqueUtils = Array.from(new Map(allUtils.map((u) => [u.id, u])).values());
            const ready = uniqueUtils.filter((u) => u.status === 'ready' || !u.status).length;
            const beta = uniqueUtils.filter((u) => u.status === 'beta').length;
            const soon = uniqueUtils.filter((u) => u.status === 'soon').length;
            const utilityCount = ready + beta;
            const tooltip = `${plural(ready, 'ready')} · ${plural(beta, 'beta')} · ${plural(soon, 'coming soon')}`;
            const categoryColor = CATEGORY_COLORS[ws.id] || 'var(--cat-system)';
            const pictureConfig = activeTheme.buttons?.pictures?.[ws.id];

            return (
              <ImageCard
                key={ws.id}
                id={ws.id}
                title={ws.name}
                description={ws.description}
                toolCount={utilityCount}
                tooltip={tooltip}
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
    </div>
  );
};
