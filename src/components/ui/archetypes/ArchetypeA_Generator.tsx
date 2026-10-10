import React from 'react';
import './ArchetypeA_Generator.css';

export interface ArchetypeAProps {
  controls: React.ReactNode;
  result: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const ArchetypeA_Generator: React.FC<ArchetypeAProps> = ({
  controls,
  result,
  actions,
  className = '',
}) => {
  return (
    <div className={`toiloki-archetype-a ${className}`}>
      <div className="toiloki-archetype-a-controls">
        {controls}
      </div>
      <div className="toiloki-archetype-a-result">
        {result}
        {actions && <div className="toiloki-archetype-a-actions">{actions}</div>}
      </div>
    </div>
  );
};
