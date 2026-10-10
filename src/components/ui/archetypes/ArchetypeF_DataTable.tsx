import React from 'react';
import './ArchetypeF_DataTable.css';

export interface ArchetypeFProps {
  toolbarSlot: React.ReactNode;
  tableSlot: React.ReactNode;
  paginationSlot?: React.ReactNode;
  detailDrawerSlot?: React.ReactNode;
  isDrawerOpen?: boolean;
  className?: string;
}

export const ArchetypeF_DataTable: React.FC<ArchetypeFProps> = ({
  toolbarSlot,
  tableSlot,
  paginationSlot,
  detailDrawerSlot,
  isDrawerOpen = false,
  className = '',
}) => {
  return (
    <div className={`toiloki-archetype-f ${className}`}>
      <div className="toiloki-archetype-f-main">
        <div className="toiloki-archetype-f-toolbar">
          {toolbarSlot}
        </div>
        <div className="toiloki-archetype-f-table">
          {tableSlot}
        </div>
        {paginationSlot && (
          <div className="toiloki-archetype-f-pagination">
            {paginationSlot}
          </div>
        )}
      </div>

      {detailDrawerSlot && isDrawerOpen && (
        <aside className="toiloki-archetype-f-drawer">
          {detailDrawerSlot}
        </aside>
      )}
    </div>
  );
};
