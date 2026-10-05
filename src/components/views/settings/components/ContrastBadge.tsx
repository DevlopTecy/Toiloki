import React from 'react';
import { evaluateContrast, autoFixContrast } from '../../../../core/theme/wcag-contrast';
import { ContrastResult } from '../../../../core/theme/theme.types';
import { ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

interface ContrastBadgeProps {
  textColor: string;
  bgColor: string;
  label?: string;
  isLargeText?: boolean;
  onAutoFix?: (newTextColor: string) => void;
}

export const ContrastBadge: React.FC<ContrastBadgeProps> = ({
  textColor,
  bgColor,
  label,
  isLargeText = false,
  onAutoFix,
}) => {
  const result: ContrastResult = evaluateContrast(textColor, bgColor);
  const passes = isLargeText ? result.isLargeAccessible : result.isAccessible;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-xs)',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        backgroundColor: passes ? 'var(--success-bg)' : 'var(--danger-bg)',
        border: `1px solid ${passes ? 'var(--success)' : 'var(--danger)'}`,
        color: passes ? 'var(--success)' : 'var(--danger)',
      }}
      title={`${label ? `${label}: ` : ''}${result.ratio}:1 (${result.score}) against ${bgColor}`}
    >
      {passes ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
      <span style={{ fontWeight: 600 }}>{result.ratio}:1</span>
      <span style={{ fontSize: '10px', opacity: 0.85 }}>({result.score})</span>

      {!passes && onAutoFix && (
        <button
          type="button"
          onClick={() => {
            const fixed = autoFixContrast(textColor, bgColor);
            onAutoFix(fixed);
          }}
          style={{
            marginLeft: '4px',
            background: 'var(--danger)',
            color: 'var(--on-accent)',
            border: 'none',
            borderRadius: '2px',
            padding: '1px 5px',
            fontSize: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
          title="Auto-nudge lightness to pass WCAG AA"
        >
          <Zap size={10} /> Auto-fix
        </button>
      )}
    </div>
  );
};
