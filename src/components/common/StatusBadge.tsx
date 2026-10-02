import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Loader2, Info } from 'lucide-react';
import './StatusBadge.css';

export type StatusType = 'waiting' | 'processing' | 'completed' | 'failed' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const getIcon = () => {
    switch (status) {
      case 'waiting':
        return <Clock size={size === 'sm' ? 11 : 13} />;
      case 'processing':
        return <Loader2 size={size === 'sm' ? 11 : 13} className="badge-spin" />;
      case 'completed':
        return <CheckCircle2 size={size === 'sm' ? 11 : 13} />;
      case 'failed':
        return <AlertCircle size={size === 'sm' ? 11 : 13} />;
      case 'info':
        return <Info size={size === 'sm' ? 11 : 13} />;
    }
  };

  const getLabel = () => {
    if (label) return label;
    switch (status) {
      case 'waiting': return 'Waiting';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'info': return 'Info';
    }
  };

  return (
    <span className={`status-badge status-${status} size-${size}`}>
      {getIcon()}
      <span>{getLabel()}</span>
    </span>
  );
};
