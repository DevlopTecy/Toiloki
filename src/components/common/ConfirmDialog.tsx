import React from 'react';
import { Dialog } from './Dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={<AlertTriangle size={18} color={confirmVariant === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)'} />}
      width="380px"
      footer={
        <>
          <button className="tool-btn secondary" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className={`tool-btn ${confirmVariant === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {message}
      </p>
    </Dialog>
  );
};
