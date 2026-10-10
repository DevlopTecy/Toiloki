import React from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';
import './Banner.css';

export type BannerVariant = 'info' | 'warning' | 'danger' | 'success';

export interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  message: React.ReactNode;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  title,
  message,
  onDismiss,
  action,
  className = '',
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertTriangle size={18} className="toiloki-banner-icon" />;
      case 'danger':
        return <AlertCircle size={18} className="toiloki-banner-icon" />;
      case 'success':
        return <CheckCircle size={18} className="toiloki-banner-icon" />;
      case 'info':
      default:
        return <Info size={18} className="toiloki-banner-icon" />;
    }
  };

  return (
    <div className={`toiloki-banner toiloki-banner-${variant} ${className}`} role="alert">
      <div className="toiloki-banner-icon-col">{getIcon()}</div>
      <div className="toiloki-banner-content">
        {title && <div className="toiloki-banner-title">{title}</div>}
        <div className="toiloki-banner-message">{message}</div>
      </div>
      {action && (
        <button
          type="button"
          className="toiloki-banner-action"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          className="toiloki-banner-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
