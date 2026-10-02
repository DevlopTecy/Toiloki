import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import './DataTable.css';

interface DataTableProps {
  columns: string[];
  data: Array<Record<string, unknown>>;
  pageSize?: number;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, pageSize = 25 }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns);
  const [isColsDropdownOpen, setIsColsDropdownOpen] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Sync visible columns if incoming columns change
  React.useEffect(() => {
    setVisibleColumns(columns);
  }, [columns]);

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) =>
      prev.includes(col) ? (prev.length > 1 ? prev.filter((c) => c !== col) : prev) : [...prev, col]
    );
  };

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...data];

    // Filter
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }

        const strA = String(valA ?? '');
        const strB = String(valB ?? '');
        return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, filterQuery, sortCol, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  const isNumeric = (val: unknown) => typeof val === 'number' || (!isNaN(Number(val)) && val !== '');

  return (
    <div className="toiloki-datatable-card">
      {/* ─── Toolbar: Filter Left, Columns Dropdown, Count Right ─── */}
      <div className="datatable-toolbar">
        <div className="datatable-filter-wrap">
          <Search size={14} className="datatable-search-icon" />
          <input
            type="text"
            placeholder="Search rows..."
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="datatable-filter-input"
          />
        </div>

        <div className="datatable-toolbar-right">
          {/* Columns Dropdown */}
          <div className="cols-dropdown-wrap">
            <button
              type="button"
              className="toiloki-btn toiloki-btn-secondary toiloki-btn-compact cols-trigger-btn"
              onClick={() => setIsColsDropdownOpen(!isColsDropdownOpen)}
            >
              <span>Columns</span>
              <ChevronDown size={13} />
            </button>

            {isColsDropdownOpen && (
              <div className="cols-dropdown-menu">
                {columns.map((col) => (
                  <label key={col} className="col-checkbox-label">
                    <input
                      type="checkbox"
                      className="toiloki-checkbox"
                      checked={visibleColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                    />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Row / Column Count */}
          <span className="datatable-count-text">
            {filteredAndSorted.length} rows • {visibleColumns.length} cols
          </span>
        </div>
      </div>

      {/* ─── Table Container with Sticky Headers ─── */}
      <div className="datatable-table-container">
        <table className="toiloki-table">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th key={col} onClick={() => handleSort(col)}>
                  <div className="th-content">
                    <span>{col}</span>
                    <ArrowUpDown
                      size={12}
                      className={`sort-arrow ${sortCol === col ? 'is-sorted' : ''} ${sortCol === col && !sortAsc ? 'is-desc' : ''}`}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className={idx < 10 ? 'datatable-row-enter' : ''}
                style={idx < 10 ? { animationDelay: `${idx * 20}ms` } : undefined}
              >
                {visibleColumns.map((col) => {
                  const val = row[col];
                  const numeric = isNumeric(val);
                  return (
                    <td key={col} className={numeric ? 'text-right' : ''}>
                      {val !== undefined && val !== null ? String(val) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}

            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className="datatable-empty-cell">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination Footer ─── */}
      <div className="datatable-footer">
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <div className="pagination-buttons">
          <button
            type="button"
            className="toiloki-btn toiloki-btn-ghost toiloki-btn-compact"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>
          <button
            type="button"
            className="toiloki-btn toiloki-btn-ghost toiloki-btn-compact"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
