import React from 'react';
import './ArchetypeC_Analyzer.css';

export interface ArchetypeCProps {
  dropzoneSlot?: React.ReactNode;
  summarySlot?: React.ReactNode;
  tableSlot: React.ReactNode;
  actionSlot?: React.ReactNode;
  className?: string;
}

export const ArchetypeC_Analyzer: React.FC<ArchetypeCProps> = ({
  dropzoneSlot,
  summarySlot,
  tableSlot,
  actionSlot,
  className = '',
}) => {
  return (
    <div className={`toiloki-archetype-c ${className}`}>
      {dropzoneSlot && (
        <div className="toiloki-archetype-c-dropzone">
          {dropzoneSlot}
        </div>
      )}

      {summarySlot && (
        <div className="toiloki-archetype-c-summary">
          {summarySlot}
        </div>
      )}

      <div className="toiloki-archetype-c-table">
        {tableSlot}
      </div>

      {actionSlot && (
        <div className="toiloki-archetype-c-actions">
          {actionSlot}
        </div>
      )}
    </div>
  );
};
