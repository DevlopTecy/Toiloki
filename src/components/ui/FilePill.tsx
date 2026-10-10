import React from 'react';
import { File, X } from 'lucide-react';
import './FilePill.css';

export interface FilePillProps {
  name: string;
  sizeBytes?: number;
  onRemove?: () => void;
  className?: string;
}

export const FilePill: React.FC<FilePillProps> = ({
  name,
  sizeBytes,
  onRemove,
  className = '',
}) => {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`toiloki-file-pill ${className}`}>
      <File size={14} className="toiloki-file-pill-icon" />
      <span className="toiloki-file-pill-name" title={name}>
        {name}
      </span>
      {sizeBytes !== undefined && (
        <span className="toiloki-file-pill-size">{formatSize(sizeBytes)}</span>
      )}
      {onRemove && (
        <button
          type="button"
          className="toiloki-file-pill-remove"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};
