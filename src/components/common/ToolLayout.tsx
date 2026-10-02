import React from 'react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { Star, RotateCcw, HelpCircle } from 'lucide-react';
import './ToolLayout.css';

interface ToolLayoutProps {
  breadcrumbItems: BreadcrumbItem[];
  title: string;
  description: string;
  badgeGradient?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onReset?: () => void;
  fileSummary?: string;
  progress?: {
    percent: number;
    eta?: string;
  };
  children: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
  }>;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  breadcrumbItems,
  title,
  description,
  badgeGradient,
  isFavorite,
  onToggleFavorite,
  onReset,
  fileSummary,
  progress,
  children,
  primaryAction,
  secondaryActions,
}) => {
  const hasBottomBar =
    primaryAction ||
    (secondaryActions && secondaryActions.length > 0) ||
    fileSummary ||
    progress;

  return (
    <div className="tool-layout-wrapper">
      {/* ─── 1. Top Header Bar (Universal Template Zone 1) ─── */}
      <header className="tool-header">
        <div className="tool-header-left">
          <Breadcrumb items={breadcrumbItems} />
          <div className="tool-title-row">
            {badgeGradient && (
              <div className="tool-badge-dot" style={{ background: badgeGradient }} />
            )}
            <h2 className="tool-title">{title}</h2>
            {onToggleFavorite && (
              <button
                className={`favorite-star-btn ${isFavorite ? 'favorited' : ''}`}
                onClick={onToggleFavorite}
                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                type="button"
              >
                <Star size={15} fill={isFavorite ? 'var(--accent-amber)' : 'none'} />
              </button>
            )}
          </div>
          <p className="tool-description">{description}</p>
        </div>

        <div className="tool-header-right">
          {onReset && (
            <button className="tool-reset-btn" onClick={onReset} title="Reset tool parameters">
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── 2. Main Workspace (Universal Template Zone 2) ─── */}
      <main className="tool-main-content">{children}</main>

      {/* ─── 3. Bottom Action Bar (Universal Template Zone 3) ─── */}
      {hasBottomBar && (
        <footer className="tool-actions-bar">
          {/* Left: Batch queue / File summary */}
          <div className="actions-bar-left">
            {fileSummary && (
              <span className="file-summary-pill">{fileSummary}</span>
            )}
          </div>

          {/* Center: Processing progress bar (2px amber line) + ETA */}
          <div className="actions-bar-center">
            {progress && (
              <div className="progress-center-strip">
                <div className="amber-progress-track">
                  <div
                    className="amber-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
                  />
                </div>
                <div className="progress-meta-text">
                  <span className="progress-percent">{Math.round(progress.percent)}%</span>
                  {progress.eta && <span className="progress-eta">ETA: {progress.eta}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Right: Secondary Actions + Primary Amber Action Button */}
          <div className="actions-bar-right">
            {secondaryActions?.map((sec, idx) => (
              <button
                key={idx}
                className="tool-btn secondary"
                onClick={sec.onClick}
                disabled={sec.disabled}
              >
                {sec.icon}
                <span>{sec.label}</span>
              </button>
            ))}

            {primaryAction && (
              <button
                className="tool-btn primary"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
              >
                {primaryAction.icon}
                <span>{primaryAction.loading ? 'Processing...' : primaryAction.label}</span>
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};
