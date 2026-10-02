import React from 'react';
import { LucideIcon } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}) => {
  return (
    <div className={`empty-state-box ${compact ? 'compact' : ''}`}>
      <div className="empty-state-icon-wrapper">
        <Icon size={compact ? 22 : 28} className="empty-state-icon" />
      </div>
      <div className="empty-state-text">
        <h4 className="empty-state-title">{title}</h4>
        <p className="empty-state-desc">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button className="empty-state-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};
