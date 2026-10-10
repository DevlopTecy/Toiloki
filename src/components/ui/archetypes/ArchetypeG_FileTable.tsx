import React from 'react';
import './ArchetypeG_FileTable.css';

export interface ArchetypeGProps {
  tableSlot: React.ReactNode;
  rulesPanelSlot: React.ReactNode;
  actionBarSlot?: React.ReactNode;
  className?: string;
}

export const ArchetypeG_FileTable: React.FC<ArchetypeGProps> = ({
  tableSlot,
  rulesPanelSlot,
  actionBarSlot,
  className = '',
}) => {
  return (
    <div className={`toiloki-archetype-g ${className}`}>
      <div className="toiloki-archetype-g-body">
        <div className="toiloki-archetype-g-table">
          {tableSlot}
        </div>
        <div className="toiloki-archetype-g-rules">
          {rulesPanelSlot}
        </div>
      </div>
      {actionBarSlot && (
        <div className="toiloki-archetype-g-bottom">
          {actionBarSlot}
        </div>
      )}
    </div>
  );
};
