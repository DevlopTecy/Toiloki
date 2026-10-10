import React from 'react';
import { LucideIcon } from 'lucide-react';
import './EmptyState.css';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onTrySample?: () => void;
  sampleLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  onTrySample,
  sampleLabel = 'Try a sample',
  actionLabel,
  onAction,
  compact = false,
  className = '',
}) => {
  return (
    <div className={`toiloki-empty-state ${compact ? 'is-compact' : ''} ${className}`}>
      <div className="toiloki-empty-icon-wrapper">
        <Icon size={compact ? 22 : 28} className="toiloki-empty-icon" />
      </div>

      <div className="toiloki-empty-text">
        <h4 className="toiloki-empty-title">{title}</h4>
        <p className="toiloki-empty-desc">{description}</p>
      </div>

      <div className="toiloki-empty-actions">
        {actionLabel && onAction && (
          <button type="button" className="toiloki-empty-action-btn" onClick={onAction}>
            {actionLabel}
          </button>
        )}

        {onTrySample && (
          <button
            type="button"
            className="toiloki-empty-sample-link"
            onClick={onTrySample}
          >
            {sampleLabel}
          </button>
        )}
      </div>
    </div>
  );
};
