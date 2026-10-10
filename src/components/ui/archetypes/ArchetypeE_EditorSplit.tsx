import React from 'react';
import './ArchetypeE_EditorSplit.css';

export interface ArchetypeEProps {
  inputPane: React.ReactNode;
  outputPane: React.ReactNode;
  statusBar?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}

export const ArchetypeE_EditorSplit: React.FC<ArchetypeEProps> = ({
  inputPane,
  outputPane,
  statusBar,
  toolbar,
  className = '',
}) => {
  return (
    <div className={`toiloki-archetype-e ${className}`}>
      {toolbar && <div className="toiloki-archetype-e-toolbar">{toolbar}</div>}
      <div className="toiloki-archetype-e-split">
        <div className="toiloki-archetype-e-pane toiloki-archetype-e-left">
          {inputPane}
        </div>
        <div className="toiloki-archetype-e-pane toiloki-archetype-e-right">
          {outputPane}
        </div>
      </div>
      {statusBar && <div className="toiloki-archetype-e-status">{statusBar}</div>}
    </div>
  );
};
