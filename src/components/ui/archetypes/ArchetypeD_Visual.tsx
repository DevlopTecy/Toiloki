import React from 'react';
import './ArchetypeD_Visual.css';

export interface ArchetypeDProps {
  canvasSlot: React.ReactNode;
  optionsSlot: React.ReactNode;
  actionBarSlot?: React.ReactNode;
  className?: string;
}

export const ArchetypeD_Visual: React.FC<ArchetypeDProps> = ({
  canvasSlot,
  optionsSlot,
  actionBarSlot,
  className = '',
}) => {
  return (
    <div className={`toiloki-archetype-d ${className}`}>
      <div className="toiloki-archetype-d-body">
        <div className="toiloki-archetype-d-canvas">
          {canvasSlot}
        </div>
        <div className="toiloki-archetype-d-options">
          {optionsSlot}
        </div>
      </div>
      {actionBarSlot && (
        <div className="toiloki-archetype-d-bottom">
          {actionBarSlot}
        </div>
      )}
    </div>
  );
};
