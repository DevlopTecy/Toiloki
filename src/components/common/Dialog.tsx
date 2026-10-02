import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import './Dialog.css';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  width = '420px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="toiloki-dialog-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="toiloki-dialog-window"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="toiloki-dialog-header">
          <div className="toiloki-dialog-title-group">
            {icon && <span className="toiloki-dialog-icon">{icon}</span>}
            <h3 className="toiloki-dialog-title">{title}</h3>
          </div>
          <button
            className="toiloki-dialog-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            type="button"
          >
            <X size={15} />
          </button>
        </div>

        <div className="toiloki-dialog-body">{children}</div>

        {footer && <div className="toiloki-dialog-footer">{footer}</div>}
      </div>
    </div>
  );
};
