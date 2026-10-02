import React from 'react';
import { RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Button } from '../../../common/Button';

interface StickyFooterBarProps {
  show: boolean;
  onRevert: () => void;
  onApply: () => void;
  message?: string;
}

export const StickyFooterBar: React.FC<StickyFooterBarProps> = ({
  show,
  onRevert,
  onApply,
  message = 'You have unsaved theme and appearance changes.',
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'sticky',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: 50,
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.20)',
        padding: '12px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'actionDrawerSlideUp 180ms var(--ease-out) forwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={15} color="var(--accent)" />
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
          Unsaved changes
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>— {message}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Button variant="ghost" size="sm" onClick={onRevert}>
          <RotateCcw size={13} style={{ marginRight: '6px' }} />
          Revert
        </Button>
        <Button variant="primary" size="sm" onClick={onApply}>
          <Check size={13} style={{ marginRight: '6px' }} />
          Apply changes
        </Button>
      </div>
    </div>
  );
};
