import React from 'react';
import { evaluateContrast, autoFixContrast } from '../../../../core/theme/wcag-contrast';
import { ContrastResult } from '../../../../core/theme/theme.types';
import { ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';

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
        backgroundColor: passes ? 'rgba(74, 222, 128, 0.12)' : 'rgba(239, 68, 68, 0.14)',
        border: `1px solid ${passes ? 'rgba(74, 222, 128, 0.28)' : 'rgba(239, 68, 68, 0.32)'}`,
        color: passes ? 'var(--color-success)' : 'var(--color-danger)',
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
            background: 'var(--color-danger)',
            color: '#FFFFFF',
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
          <Sparkles size={10} /> Auto-fix
        </button>
      )}
    </div>
  );
};
