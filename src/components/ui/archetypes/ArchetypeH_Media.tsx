import React from 'react';
import './ArchetypeH_Media.css';

export interface ArchetypeHProps {
  mediaCanvasSlot: React.ReactNode;
  optionsSlot: React.ReactNode;
  actionBarSlot?: React.ReactNode;
  className?: string;
}

export const ArchetypeH_Media: React.FC<ArchetypeHProps> = ({
  mediaCanvasSlot,
  optionsSlot,
  actionBarSlot,
  className = '',
}) => {
  return (
    <div className={`toiloki-archetype-h ${className}`}>
      <div className="toiloki-archetype-h-body">
        <div className="toiloki-archetype-h-canvas">
          {mediaCanvasSlot}
        </div>
        <div className="toiloki-archetype-h-options">
          {optionsSlot}
        </div>
      </div>
      {actionBarSlot && (
        <div className="toiloki-archetype-h-bottom">
          {actionBarSlot}
        </div>
      )}
    </div>
  );
};
