import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import './KeyValueTable.css';

export interface KeyValueRow {
  key: string;
  label: React.ReactNode;
  value: React.ReactNode;
  copyValue?: string;
  mono?: boolean;
}

export interface KeyValueTableProps {
  rows: KeyValueRow[];
  className?: string;
}

export const KeyValueTable: React.FC<KeyValueTableProps> = ({ rows, className = '' }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch (err) {
      console.error('Failed to copy value:', err);
    }
  };

  return (
    <div className={`toiloki-kv-table ${className}`}>
      {rows.map((row) => (
        <div key={row.key} className="toiloki-kv-row">
          <div className="toiloki-kv-key">{row.label}</div>
          <div className="toiloki-kv-val-container">
            <span className={`toiloki-kv-val ${row.mono ? 'is-mono' : ''}`}>
              {row.value}
            </span>
            {row.copyValue && (
              <button
                type="button"
                className={`toiloki-kv-copy-btn ${copiedKey === row.key ? 'is-copied' : ''}`}
                onClick={() => handleCopy(row.key, row.copyValue!)}
                aria-label={`Copy ${row.label}`}
                title={copiedKey === row.key ? 'Copied!' : 'Copy'}
              >
                {copiedKey === row.key ? <Check size={12} /> : <Copy size={12} />}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
