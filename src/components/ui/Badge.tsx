import React from 'react';
import './Badge.css';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  icon,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  return (
    <span className={`toiloki-badge toiloki-badge-${variant} toiloki-badge-${size} ${className}`}>
      {icon && <span className="toiloki-badge-icon">{icon}</span>}
      <span className="toiloki-badge-text">{label}</span>
    </span>
  );
};
