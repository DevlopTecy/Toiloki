import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  FolderTree,
  Sliders,
  FileCode,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  Code,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import Papa from 'papaparse';
import * as yaml from 'yaml';
import { XMLParser } from 'fast-xml-parser';
import './DataCanvas.css';

export type DataViewMode = 'grid' | 'tree' | 'schema' | 'raw';

export interface DataCanvasProps {
  dataContent: string;
  onDataChange: (newContent: string) => void;
  format: 'csv' | 'json' | 'yaml' | 'xml' | 'tsv' | 'xlsx';
  viewMode: DataViewMode;
  onViewModeChange: (mode: DataViewMode) => void;
  delimiter?: string;
  hasHeader?: boolean;
  onLoadSample?: () => void;
  fileName?: string;
}

interface ParsedTable {
  headers: string[];
  rows: any[][];
  rawObjects?: any[];
  error?: string;
}

// Tree Node Component for hierarchical JSON / XML / YAML
interface TreeNodeProps {
  nodeKey: string;
  value: any;
  path: string;
  filterText: string;
  isExpandedInitial?: boolean;
  depth?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  nodeKey,
  value,
  path,
  filterText,
  isExpandedInitial = true,
  depth = 0,
}) => {
  const [expanded, setExpanded] = useState<boolean>(depth < 2 || isExpandedInitial);
  const [copied, setCopied] = useState<boolean>(false);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  const getType = (val: any): string => {
    if (val === null) return 'null';
    if (Array.isArray(val)) return `array[${val.length}]`;
    return typeof val;
  };

  const copyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Filter check
  const matchesFilter = useMemo(() => {
    if (!filterText) return true;
    const lower = filterText.toLowerCase();
    if (nodeKey.toLowerCase().includes(lower)) return true;
    if (!isObject && String(value).toLowerCase().includes(lower)) return true;
    return false;
  }, [filterText, nodeKey, value, isObject]);

  if (!matchesFilter && !isObject) {
    return null;
  }

  const typeName = getType(value);

  return (
    <div className="tree-node" style={{ paddingLeft: `${Math.min(depth * 18, 140)}px` }}>
      <div
        className={`tree-node-row ${isObject ? 'is-branch' : 'is-leaf'}`}
        onClick={() => isObject && setExpanded(!expanded)}
      >
        {isObject ? (
          <span className="tree-arrow">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="tree-leaf-bullet">•</span>
        )}

        <span className="tree-key">{nodeKey}</span>
        <span className="tree-colon">:</span>

        {isObject ? (
          <span className="tree-type-pill">{typeName}</span>
        ) : (
          <span className={`tree-val tree-val-${typeof value}`}>
            {value === null
              ? 'null'
              : typeof value === 'string'
              ? `"${value}"`
              : String(value)}
          </span>
        )}

        <button
          className="tree-copy-path-btn"
          title={`Copy path: ${path}`}
          onClick={copyPath}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>

      {isObject && expanded && (
        <div className="tree-children">
          {Object.entries(value).map(([k, v]) => (
            <TreeNode
              key={k}
              nodeKey={isArray ? `[${k}]` : k}
              value={v}
              path={isArray ? `${path}[${k}]` : `${path}.${k}`}
              filterText={filterText}
              isExpandedInitial={isExpandedInitial}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DataCanvas: React.FC<DataCanvasProps> = ({
  dataContent,
  onDataChange,
  format,
  viewMode,
  onViewModeChange,
  delimiter = ',',
  hasHeader = true,
  onLoadSample,
  fileName,
}) => {
  // Grid State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [copiedCell, setCopiedCell] = useState<boolean>(false);

  // Tree State
  const [treeSearch, setTreeSearch] = useState<string>('');
  const [expandAllKey, setExpandAllKey] = useState<number>(0);

  // Parse raw text into structured table data
  const parsedData: ParsedTable = useMemo(() => {
    if (!dataContent || !dataContent.trim()) {
      return { headers: [], rows: [] };
    }

    try {
      if (format === 'csv' || format === 'tsv') {
        const delim = format === 'tsv' ? '\t' : delimiter;
        const res = Papa.parse(dataContent, {
          delimiter: delim,
          header: false,
          skipEmptyLines: true,
          dynamicTyping: true,
        });

        if (res.errors && res.errors.length > 0 && (!res.data || res.data.length === 0)) {
          return { headers: [], rows: [], error: res.errors[0].message };
        }

        const rawRows = res.data as any[][];
        if (rawRows.length === 0) return { headers: [], rows: [] };

        if (hasHeader && rawRows.length > 0) {
          const headers = rawRows[0].map((h, i) => (h ? String(h) : `col_${i + 1}`));
          const rows = rawRows.slice(1);
          return { headers, rows };
        } else {
          const colCount = Math.max(...rawRows.map((r) => r.length), 0);
          const headers = Array.from({ length: colCount }, (_, i) => `col_${i + 1}`);
          return { headers, rows: rawRows };
        }
      }

      if (format === 'json') {
        const obj = JSON.parse(dataContent);
        if (Array.isArray(obj)) {
          if (obj.length === 0) return { headers: [], rows: [] };
          // Extract union of keys
          const keys = Array.from(
            new Set(obj.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : [])))
          );
          const headers = keys.length > 0 ? keys : ['Value'];
          const rows = obj.map((item) =>
            typeof item === 'object' && item !== null
              ? headers.map((k) => (item[k] !== undefined ? item[k] : ''))
              : [item]
          );
          return { headers, rows, rawObjects: obj };
        } else if (typeof obj === 'object' && obj !== null) {
          const headers = ['Property', 'Value'];
          const rows = Object.entries(obj).map(([k, v]) => [
            k,
            typeof v === 'object' ? JSON.stringify(v) : String(v),
          ]);
          return { headers, rows, rawObjects: [obj] };
        }
      }

      if (format === 'yaml') {
        const obj = yaml.parse(dataContent);
        if (Array.isArray(obj)) {
          if (obj.length === 0) return { headers: [], rows: [] };
          const keys = Array.from(
            new Set(obj.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : [])))
          );
          const headers = keys.length > 0 ? keys : ['Value'];
          const rows = obj.map((item) =>
            typeof item === 'object' && item !== null
              ? headers.map((k) => (item[k] !== undefined ? item[k] : ''))
              : [item]
          );
          return { headers, rows, rawObjects: obj };
        } else if (typeof obj === 'object' && obj !== null) {
          const headers = ['Property', 'Value'];
          const rows = Object.entries(obj).map(([k, v]) => [
            k,
            typeof v === 'object' ? JSON.stringify(v) : String(v),
          ]);
          return { headers, rows, rawObjects: [obj] };
        }
      }

      if (format === 'xml') {
        const parser = new XMLParser({ ignoreAttributes: false });
        const obj = parser.parse(dataContent);
        const headers = ['Element', 'Content'];
        const rows = Object.entries(obj).map(([k, v]) => [
          k,
          typeof v === 'object' ? JSON.stringify(v) : String(v),
        ]);
        return { headers, rows, rawObjects: [obj] };
      }

      // Default fallback
      const lines = dataContent.split('\n').filter((l) => l.trim().length > 0);
      return {
        headers: ['Line Content'],
        rows: lines.map((l) => [l]),
      };
    } catch (err: any) {
      return { headers: [], rows: [], error: err.message || 'Syntax parse error' };
    }
  }, [dataContent, format, delimiter, hasHeader]);

  // Filtered & Sorted Rows
  const filteredRows = useMemo(() => {
    let rows = parsedData.rows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((r) =>
        r.some((cell) => cell !== null && cell !== undefined && String(cell).toLowerCase().includes(q))
      );
    }
    if (sortCol !== null && sortCol < parsedData.headers.length) {
      rows = [...rows].sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }
    return rows;
  }, [parsedData.rows, parsedData.headers.length, searchQuery, sortCol, sortDir]);

  // Paginated Rows
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Tree Root Object
  const treeObject = useMemo(() => {
    try {
      if (format === 'json') return JSON.parse(dataContent);
      if (format === 'yaml') return yaml.parse(dataContent);
      if (format === 'xml') {
        const parser = new XMLParser({ ignoreAttributes: false });
        return parser.parse(dataContent);
      }
      if (format === 'csv' || format === 'tsv') {
        const res = Papa.parse(dataContent, { header: true, dynamicTyping: true });
        return res.data;
      }
    } catch {
      return null;
    }
    return null;
  }, [dataContent, format]);

  // Schema Inspection Analytics
  const schemaAnalysis = useMemo(() => {
    if (!parsedData.headers || parsedData.headers.length === 0) return [];
    return parsedData.headers.map((colName, colIdx) => {
      let nullCount = 0;
      const typeCounts: Record<string, number> = {};
      const uniqueVals = new Set();
      const samples: any[] = [];

      parsedData.rows.forEach((row) => {
        const val = row[colIdx];
        if (val === null || val === undefined || val === '') {
          nullCount++;
        } else {
          const t = typeof val;
          typeCounts[t] = (typeCounts[t] || 0) + 1;
          uniqueVals.add(val);
          if (samples.length < 3 && !samples.includes(val)) {
            samples.push(val);
          }
        }
      });

      // Dominant type
      let dominantType = 'string';
      let maxCount = 0;
      Object.entries(typeCounts).forEach(([t, cnt]) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          dominantType = t;
        }
      });

      const totalRows = parsedData.rows.length;
      const filledPct = totalRows > 0 ? Math.round(((totalRows - nullCount) / totalRows) * 100) : 0;

      return {
        column: colName,
        dominantType,
        nullCount,
        filledPct,
        uniqueCount: uniqueVals.size,
        samples: samples.map((s) => String(s)).join(', '),
      };
    });
  }, [parsedData.headers, parsedData.rows]);

  // Inferred JSON Schema String
  const inferredJsonSchema = useMemo(() => {
    if (!schemaAnalysis || schemaAnalysis.length === 0) return '{}';
    const properties: Record<string, any> = {};
    schemaAnalysis.forEach((col) => {
      properties[col.column] = {
        type: col.dominantType,
        description: `Column: ${col.column} (unique values: ${col.uniqueCount})`,
      };
    });
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: fileName || 'InferredDataSchema',
      type: 'object',
      properties,
      required: schemaAnalysis.filter((c) => c.nullCount === 0).map((c) => c.column),
    };
    return JSON.stringify(schema, null, 2);
  }, [schemaAnalysis, fileName]);

  const handleSort = (idx: number) => {
    if (sortCol === idx) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(idx);
      setSortDir('asc');
    }
  };

  const handleCellClick = (rIdx: number, cIdx: number, value: any) => {
    setSelectedCell({ row: rIdx, col: cIdx });
    if (value !== undefined && value !== null) {
      navigator.clipboard.writeText(String(value));
      setCopiedCell(true);
      setTimeout(() => setCopiedCell(false), 1200);
    }
  };

  return (
    <div className="data-canvas-root">
      {/* Canvas Top Bar */}
      <div className="data-canvas-header">
        <div className="canvas-header-left">
          <div className="view-mode-tabs" role="tablist">
            <button
              className={`view-mode-tab ${viewMode === 'grid' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              role="tab"
              aria-selected={viewMode === 'grid'}
            >
              <Table size={14} />
              <span>Grid Table</span>
            </button>
            <button
              className={`view-mode-tab ${viewMode === 'tree' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('tree')}
              role="tab"
              aria-selected={viewMode === 'tree'}
            >
              <FolderTree size={14} />
              <span>Tree Explorer</span>
            </button>
            <button
              className={`view-mode-tab ${viewMode === 'schema' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('schema')}
              role="tab"
              aria-selected={viewMode === 'schema'}
            >
              <Sliders size={14} />
              <span>Schema & Stats</span>
            </button>
            <button
              className={`view-mode-tab ${viewMode === 'raw' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('raw')}
              role="tab"
              aria-selected={viewMode === 'raw'}
            >
              <FileCode size={14} />
              <span>Raw Editor</span>
            </button>
          </div>

          <div className="data-meta-badge">
            <span className="format-tag">{format.toUpperCase()}</span>
            <span className="dimensions-tag">
              {parsedData.rows.length} rows × {parsedData.headers.length} cols
            </span>
          </div>
        </div>

        <div className="canvas-header-right">
          {viewMode === 'grid' && (
            <div className="data-table-search">
              <Search size={13} className="search-icon" />
              <input
                type="text"
                placeholder="Filter table rows..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  ×
                </button>
              )}
            </div>
          )}

          {viewMode === 'tree' && (
            <div className="tree-actions-row">
              <div className="data-table-search">
                <Search size={13} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search keys or values..."
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              <button
                className="data-pill-btn"
                onClick={() => setExpandAllKey((prev) => prev + 1)}
                title="Reset expansion state"
              >
                <RefreshCw size={12} />
                <span>Toggle Tree</span>
              </button>
            </div>
          )}

          {onLoadSample && (!dataContent || dataContent.trim().length === 0) && (
            <button className="data-pill-btn is-gold" onClick={onLoadSample}>
              <FileSpreadsheet size={13} />
              <span>Load Sample Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas View Body */}
      <div className="data-canvas-body">
        {parsedData.error && (
          <div className="data-canvas-alert is-error">
            <AlertCircle size={16} />
            <span>Parsing notice: {parsedData.error}</span>
          </div>
        )}

        {/* 1. GRID TABLE VIEW */}
        {viewMode === 'grid' && (
          <div className="data-grid-container">
            {parsedData.headers.length === 0 ? (
              <div className="data-empty-container">
                <Table size={40} className="empty-icon" />
                <h4>No Tabular Data Found</h4>
                <p>Drag in a CSV, TSV, JSON, or YAML file, or load sample data to begin.</p>
                {onLoadSample && (
                  <button className="data-pill-btn is-gold" onClick={onLoadSample}>
                    Load Sample CSV Dataset
                  </button>
                )}
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="th-row-idx">#</th>
                      {parsedData.headers.map((hdr, idx) => (
                        <th
                          key={idx}
                          className={`th-data-col ${sortCol === idx ? 'is-sorted' : ''}`}
                          onClick={() => handleSort(idx)}
                          title="Click to sort column"
                        >
                          <div className="th-content">
                            <span>{hdr}</span>
                            <span className="th-sort-icon">
                              {sortCol === idx ? (
                                sortDir === 'asc' ? (
                                  <ArrowUp size={12} />
                                ) : (
                                  <ArrowDown size={12} />
                                )
                              ) : (
                                <ArrowUpDown size={12} className="is-dim" />
                              )}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, rIdx) => {
                      const actualRowIdx = (currentPage - 1) * pageSize + rIdx;
                      return (
                        <tr key={rIdx} className="data-tr">
                          <td className="td-row-idx">{actualRowIdx + 1}</td>
                          {parsedData.headers.map((_, cIdx) => {
                            const val = row[cIdx];
                            const isCellSelected =
                              selectedCell?.row === actualRowIdx && selectedCell?.col === cIdx;
                            return (
                              <td
                                key={cIdx}
                                className={`td-data-cell ${isCellSelected ? 'is-selected' : ''}`}
                                onClick={() => handleCellClick(actualRowIdx, cIdx, val)}
                                title="Click to copy cell value"
                              >
                                {val === null || val === undefined ? (
                                  <span className="cell-null">null</span>
                                ) : typeof val === 'boolean' ? (
                                  <span className="cell-bool">{String(val)}</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {parsedData.rows.length > 0 && (
              <div className="data-grid-pagination">
                <div className="pagination-info">
                  Showing {(currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length}{' '}
                  rows
                  {searchQuery && ` (filtered from ${parsedData.rows.length} total)`}
                  {copiedCell && <span className="copied-pill">Cell copied to clipboard</span>}
                </div>

                <div className="pagination-controls">
                  <label className="pagination-size-label">
                    Rows:
                    <select
                      className="pagination-select"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={250}>250</option>
                    </select>
                  </label>

                  <div className="pagination-page-btns">
                    <button
                      className="page-btn"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <span className="page-indicator">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      className="page-btn"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. TREE VIEW */}
        {viewMode === 'tree' && (
          <div className="data-tree-container">
            {treeObject ? (
              <div className="data-tree-body" key={expandAllKey}>
                <TreeNode
                  nodeKey="root"
                  value={treeObject}
                  path="$"
                  filterText={treeSearch}
                  isExpandedInitial={true}
                />
              </div>
            ) : (
              <div className="data-empty-container">
                <FolderTree size={40} className="empty-icon" />
                <h4>Hierarchical Tree Viewer</h4>
                <p>Tree view is available for structured JSON, YAML, XML, and CSV files.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. SCHEMA & STATS VIEW */}
        {viewMode === 'schema' && (
          <div className="data-schema-container">
            <div className="schema-section">
              <h3 className="schema-title">
                <Sliders size={16} /> Column Types & Data Health
              </h3>
              <table className="schema-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Inferred Type</th>
                    <th>Fill Rate</th>
                    <th>Null / Empty</th>
                    <th>Unique Values</th>
                    <th>Sample Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {schemaAnalysis.map((col, idx) => (
                    <tr key={idx}>
                      <td className="td-schema-col font-medium">{col.column}</td>
                      <td>
                        <span className={`schema-type-tag tag-${col.dominantType}`}>
                          {col.dominantType}
                        </span>
                      </td>
                      <td>
                        <div className="fill-bar-wrapper">
                          <div className="fill-bar" style={{ width: `${col.filledPct}%` }} />
                          <span className="fill-label">{col.filledPct}%</span>
                        </div>
                      </td>
                      <td className={col.nullCount > 0 ? 'text-amber' : 'text-muted'}>
                        {col.nullCount}
                      </td>
                      <td>{col.uniqueCount}</td>
                      <td className="td-sample-vals" title={col.samples}>
                        {col.samples || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="schema-section">
              <div className="schema-title-row">
                <h3 className="schema-title">
                  <Code size={16} /> Inferred JSON Schema (Draft-07)
                </h3>
                <button
                  className="data-pill-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(inferredJsonSchema);
                  }}
                >
                  <Copy size={12} />
                  <span>Copy Schema</span>
                </button>
              </div>
              <pre className="schema-json-box">
                <code>{inferredJsonSchema}</code>
              </pre>
            </div>
          </div>
        )}

        {/* 4. RAW EDITOR VIEW */}
        {viewMode === 'raw' && (
          <div className="data-raw-container">
            <div className="raw-editor-wrapper">
              <textarea
                className="raw-textarea"
                value={dataContent}
                onChange={(e) => onDataChange(e.target.value)}
                placeholder="Paste or type raw data here..."
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
