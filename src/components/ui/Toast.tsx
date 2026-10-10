import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  type?: ToastType;
  message: string;
  onDismiss: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  message,
  onDismiss,
  action,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="toiloki-toast-icon" />;
      case 'warning':
        return <AlertTriangle size={16} className="toiloki-toast-icon" />;
      case 'error':
        return <AlertCircle size={16} className="toiloki-toast-icon" />;
      case 'info':
      default:
        return <Info size={16} className="toiloki-toast-icon" />;
    }
  };

  return (
    <div className={`toiloki-toast toiloki-toast-${type}`} role="status">
      <span className="toiloki-toast-icon-wrap">{getIcon()}</span>
      <span className="toiloki-toast-msg">{message}</span>
      {action && (
        <button
          type="button"
          className="toiloki-toast-action"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        className="toiloki-toast-close"
        onClick={() => onDismiss(id)}
        aria-label="Close notification"
      >
        <X size={13} />
      </button>
    </div>
  );
};
