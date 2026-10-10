import React from 'react';
import './ArchetypeB_Converter.css';

export interface ArchetypeBProps {
  inputSlot: React.ReactNode;
  resultSlot: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const ArchetypeB_Converter: React.FC<ArchetypeBProps> = ({
  inputSlot,
  resultSlot,
  actions,
  className = '',
}) => {
  return (
    <div className={`toiloki-archetype-b ${className}`}>
      <div className="toiloki-archetype-b-input">
        {inputSlot}
      </div>
      <div className="toiloki-archetype-b-result">
        {resultSlot}
        {actions && <div className="toiloki-archetype-b-actions">{actions}</div>}
      </div>
    </div>
  );
};
