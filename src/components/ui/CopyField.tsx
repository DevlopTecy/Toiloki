import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import './CopyField.css';

export interface CopyFieldProps {
  value: string;
  label?: string;
  masked?: boolean;
  mono?: boolean;
  className?: string;
  placeholder?: string;
}

export const CopyField: React.FC<CopyFieldProps> = ({
  value,
  label,
  masked = false,
  mono = true,
  className = '',
  placeholder = 'Empty',
}) => {
  const [copied, setCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(!masked);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const displayValue = masked && !isRevealed
    ? '•'.repeat(Math.min(32, Math.max(8, value.length)))
    : value || placeholder;

  return (
    <div className={`toiloki-copyfield-wrapper ${className}`}>
      {label && <span className="toiloki-copyfield-label">{label}</span>}
      <div className="toiloki-copyfield-container">
        <span
          className={`toiloki-copyfield-value ${mono ? 'is-mono' : ''} ${!value ? 'is-empty' : ''}`}
          title={value}
        >
          {displayValue}
        </span>

        <div className="toiloki-copyfield-actions">
          {masked && (
            <button
              type="button"
              className="toiloki-copyfield-btn"
              onClick={() => setIsRevealed(!isRevealed)}
              aria-label={isRevealed ? 'Mask value' : 'Reveal value'}
              title={isRevealed ? 'Hide' : 'Show'}
            >
              {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}

          <button
            type="button"
            className={`toiloki-copyfield-btn ${copied ? 'is-copied' : ''}`}
            onClick={handleCopy}
            disabled={!value}
            aria-label="Copy to clipboard"
            title={copied ? 'Copied!' : 'Copy'}
          >
            {copied ? (
              <>
                <Check size={14} className="toiloki-copyfield-check" />
                <span className="toiloki-copyfield-feedback">Copied</span>
              </>
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
