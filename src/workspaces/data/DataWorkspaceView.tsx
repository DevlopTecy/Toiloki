import React, { useState, useMemo, useEffect } from 'react';
import { ToolLayout } from '../../components/common/ToolLayout';
import { FileDropzone, SelectedFile } from '../../components/file-system/FileDropzone';
import { ResultViewer } from '../../components/file-system/ResultViewer';
import { ErrorPanel } from '../../components/common/ErrorPanel';
import { ProcessingView } from '../../components/feedback/ProcessingView';
import { PreviewModal } from '../../components/common/PreviewModal';
import { DataEngine } from '../../engines/data/data.engine';
import { HistoryService } from '../../core/services/history.service';
import {
  Table,
  Code,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Download,
  Copy,
  Check,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Eye,
  Trash2,
  Columns,
  Search,
  Split,
  GitMerge,
  ShieldCheck,
  FileDiff,
  Terminal,
  Database,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Layers,
  Type,
} from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { plural } from '../../core/utils/plural';
import './DataWorkspaceView.css';

interface DataTreeNodeProps {
  label: string | number;
  value: unknown;
  depth?: number;
  searchFilter?: string;
}

const DataTreeNode: React.FC<DataTreeNodeProps> = ({ label, value, depth = 0, searchFilter = '' }) => {
  const [isOpen, setIsOpen] = useState(depth < 2);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (isObject) {
    const entries = isArray
      ? (value as unknown[]).map((v, i) => [i, v] as [number, unknown])
      : Object.entries(value as Record<string, unknown>);

    const count = entries.length;

    return (
      <div className="data-tree-item">
        <div className="data-tree-row">
          <button
            type="button"
            className="data-tree-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Collapse node' : 'Expand node'}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <span className="data-tree-key">{label}:</span>
          <span className="data-tree-meta-badge">
            {isArray ? `Array(${count})` : `Object{${count}}`}
          </span>
        </div>
        {isOpen && (
          <div>
            {entries.map(([k, v]) => (
              <DataTreeNode
                key={String(k)}
                label={k}
                value={v}
                depth={depth + 1}
                searchFilter={searchFilter}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const strVal = String(value);
  let typeClass = 'data-tree-val-str';
  if (typeof value === 'number') typeClass = 'data-tree-val-num';
  else if (typeof value === 'boolean') typeClass = 'data-tree-val-bool';
  else if (value === null || value === undefined) typeClass = 'data-tree-val-null';

  return (
    <div className="data-tree-item">
      <div className="data-tree-row">
        <span className="data-tree-key">{label}:</span>
        <span className={typeClass}>
          {typeof value === 'string' ? `"${strVal}"` : strVal}
        </span>
        <span className="data-tree-meta-badge">{value === null ? 'null' : typeof value}</span>
      </div>
    </div>
  );
};


interface DataWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const DataWorkspaceView: React.FC<DataWorkspaceViewProps> = ({
  groupId,
  utilityId,
  toolName,
  toolDescription,
  onBackToUtilities,
  isFavorite,
  onToggleFavorite,
}) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [dataInput, setDataInput] = useState<string>('');

  // Converter format options
  const [sourceFormat, setSourceFormat] = useState('csv');
  const [targetFormat, setTargetFormat] = useState('json');

  // NDJSON/TSV
  const [ndFrom, setNdFrom] = useState<'ndjson' | 'tsv' | 'json' | 'csv'>('csv');
  const [ndTo, setNdTo] = useState<'ndjson' | 'tsv' | 'json' | 'csv'>('tsv');

  // JSONPath
  const [jsonPathExpr, setJsonPathExpr] = useState('$.*');

  // Join CSV
  const [secondaryCsv, setSecondaryCsv] = useState('');
  const [joinKeyA, setJoinKeyA] = useState('id');
  const [joinKeyB, setJoinKeyB] = useState('id');
  const [joinType, setJoinType] = useState<'inner' | 'left' | 'outer'>('inner');

  // Pivot & Groupby
  const [pivotGroupCol, setPivotGroupCol] = useState('department');
  const [pivotAggCol, setPivotAggCol] = useState('salary');
  const [pivotFunc, setPivotFunc] = useState<'count' | 'sum' | 'avg' | 'min' | 'max'>('avg');

  // Split CSV
  const [splitMode, setSplitMode] = useState<'rows' | 'column'>('column');
  const [splitCol, setSplitCol] = useState('department');
  const [splitChunkSize, setSplitChunkSize] = useState(2);
  const [splitChunksResult, setSplitChunksResult] = useState<Array<{ name: string; csv: string; rowCount: number }> | null>(null);

  // JSON to TypeScript
  const [tsRootName, setTsRootName] = useState('Employee');

  // JSON Schema
  const [schemaInput, setSchemaInput] = useState('');

  // SQL on CSV
  const [sqlQuery, setSqlQuery] = useState('SELECT * WHERE salary > 100000 ORDER BY salary DESC');

  // JSON Diff
  const [jsonDiffLeft, setJsonDiffLeft] = useState('');
  const [jsonDiffRight, setJsonDiffRight] = useState('');
  const [diffReport, setDiffReport] = useState<{
    added: Array<{ path: string; value: any }>;
    removed: Array<{ path: string; value: any }>;
    modified: Array<{ path: string; oldValue: any; newValue: any }>;
    isIdentical: boolean;
  } | null>(null);

  // Transformer controls
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'tree' | 'editor'>('table');

  // Sort & Filter
  const [sfSortCol, setSfSortCol] = useState('');
  const [sfSortAsc, setSfSortAsc] = useState(true);
  const [sfFilterCol, setSfFilterCol] = useState('');
  const [sfFilterOp, setSfFilterOp] = useState<'contains' | 'equals' | 'starts_with' | 'gt' | 'lt' | 'not_empty'>('contains');
  const [sfFilterVal, setSfFilterVal] = useState('');

  // Column Manager
  const [activeCols, setActiveCols] = useState<string[]>([]);
  const [colRenames, setColRenames] = useState<Record<string, string>>({});
  const [dropEmptyCols, setDropEmptyCols] = useState(false);

  // Format Values
  const [fmtTrim, setFmtTrim] = useState(true);
  const [fmtCase, setFmtCase] = useState<'none' | 'lowercase' | 'uppercase' | 'titlecase'>('none');
  const [fmtEmptyRepl, setFmtEmptyRepl] = useState('');
  const [fmtRoundDec, setFmtRoundDec] = useState<number | ''>('');
  const [fmtTargetCol, setFmtTargetCol] = useState('');

  // Tree search
  const [treeSearch, setTreeSearch] = useState('');

  // Processing & Results
  const [outputData, setOutputData] = useState<string | null>(null);
  const [outputBuffer, setOutputBuffer] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    message: string;
    location?: string;
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sample data getter (only populated upon explicit user click, never preloaded or auto-saved)
  const handleTrySample = () => {
    switch (utilityId) {
      case 'data-ndjson-tsv':
        setDataInput('id,name,department\n101,Alice,Core\n102,Bob,Design\n103,Charlie,Security');
        setNdFrom('csv');
        setNdTo('tsv');
        break;
      case 'data-jsonpath-query':
        setDataInput(
          JSON.stringify(
            {
              store: {
                book: [
                  { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
                  { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
                  { category: 'fiction', author: 'Herman Melville', title: 'Moby Dick', isbn: '0-553-21311-3', price: 8.99 },
                ],
                bicycle: { color: 'red', price: 19.95 },
              },
            },
            null,
            2
          )
        );
        setJsonPathExpr('store.book[*]');
        break;
      case 'data-join-csv':
        setDataInput('id,name,department\n1,Alice Morgan,Engineering\n2,Bob Jenkins,Product\n3,Carol Zhao,Analytics\n4,David Kim,Infra');
        setSecondaryCsv('id,location,manager\n1,San Francisco,Sarah Connor\n2,New York,John Doe\n3,London,Emma Watson\n6,Tokyo,Kenji Sato');
        break;
      case 'data-encoding-fixer':
        setDataInput('Toiloki’s offline suite protects user privacy… It won’t leak metadata or contact external servers.');
        break;
      case 'data-json-to-typescript':
        setDataInput(
          JSON.stringify(
            {
              id: 1,
              name: 'Alice Morgan',
              email: 'alice@toiloki.org',
              isActive: true,
              roles: ['admin', 'architect'],
              profile: { avatarUrl: null, department: 'Core Systems', experienceYears: 7 },
            },
            null,
            2
          )
        );
        break;
      case 'data-json-diff':
        setJsonDiffLeft(JSON.stringify({ name: 'Toiloki', version: '1.0.0', features: ['offline', 'privacy'], settings: { darkTheme: true } }, null, 2));
        setJsonDiffRight(JSON.stringify({ name: 'Toiloki Suite', version: '2.0.0', features: ['offline', 'privacy', 'speed'], settings: { darkTheme: true, accentColor: 'orange' } }, null, 2));
        break;
      case 'data-json-schema-validator':
        setDataInput(JSON.stringify({ id: 1, name: 'Alice Morgan', salary: 125000 }, null, 2));
        setSchemaInput(
          JSON.stringify(
            {
              type: 'object',
              required: ['id', 'name', 'salary'],
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                salary: { type: 'number' },
              },
            },
            null,
            2
          )
        );
        break;
      case 'json-tree':
      case 'validate-json':
        setDataInput(
          JSON.stringify(
            {
              suite: 'Toiloki Local Utility Suite',
              version: '2.0.0',
              offline: true,
              metrics: { toolsCount: 56, passRate: 100, activeWorkspaces: 13 },
              team: [
                { id: 1, name: 'Alice Morgan', role: 'Security Architect' },
                { id: 2, name: 'Bob Jenkins', role: 'UI Engineer' },
              ],
              features: {
                encryption: 'AES-256-GCM',
                zeroTelemetry: true,
                localCache: 'IndexedDB',
              },
            },
            null,
            2
          )
        );
        break;
      case 'xml-tree':
      case 'validate-xml':
        setDataInput(
          `<?xml version="1.0" encoding="UTF-8"?>\n<toiloki version="2.0.0">\n  <configuration offline="true">\n    <workspaces count="13">\n      <workspace id="data" active="true">Data Workspace</workspace>\n      <workspace id="developer" active="true">Developer Workspace</workspace>\n    </workspaces>\n    <security auditPassed="true" />\n  </configuration>\n</toiloki>`
        );
        break;
      case 'yaml-viewer':
      case 'validate-yaml':
        setDataInput(
          `name: Toiloki Local Suite\nversion: 2.0.0\noffline_only: true\nenvironment:\n  platform: desktop\n  sandbox: strict\nworkspaces:\n  - id: data\n    name: Data & Formats\n    tools: 24\n  - id: developer\n    name: Developer Utilities\n    tools: 30\nperformance:\n  max_memory_mb: 512\n  parallel_workers: 4\n`
        );
        break;
      case 'validate-csv':
      case 'csv-viewer':
      case 'xlsx-viewer':
      case 'data-sort-filter':
      case 'data-columns':
      case 'data-format-values':
      default:
        setDataInput(
          'id,name,role,department,salary\n1,Alice Morgan,Lead Engineer,Backend,125000\n2,Bob Jenkins,UI Designer,Product,95000\n3,Carol Zhao,Data Scientist,Analytics,118000\n4,David Kim,DevOps Architect,Infrastructure,130000\n5,Elena Rossi,QA Engineer,Quality,88000'
        );
        break;
    }
  };

  // Parse CSV for table viewer / transformers
  const parsedTable = useMemo(() => {
    try {
      const lines = dataInput.trim().split('\n');
      if (lines.length === 0 || !lines[0]) return { headers: [], rows: [], types: {} };
      const headers = lines[0].split(',').map((h) => h.trim());
      let rows = lines.slice(1).map((line) => line.split(',').map((c) => c.trim()));

      if (filterKeyword) {
        rows = rows.filter((r) =>
          r.some((cell) => cell.toLowerCase().includes(filterKeyword.toLowerCase()))
        );
      }

      if (sortCol) {
        const colIdx = headers.indexOf(sortCol);
        if (colIdx !== -1) {
          rows.sort((a, b) => {
            const valA = a[colIdx] || '';
            const valB = b[colIdx] || '';
            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB)) {
              return sortAsc ? numA - numB : numB - numA;
            }
            return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
          });
        }
      }

      // Infer basic data types
      const types: Record<string, string> = {};
      headers.forEach((h, i) => {
        const firstVal = rows[0]?.[i];
        if (firstVal !== undefined) {
          if (!isNaN(Number(firstVal))) types[h] = 'number';
          else if (firstVal.toLowerCase() === 'true' || firstVal.toLowerCase() === 'false')
            types[h] = 'boolean';
          else types[h] = 'string';
        }
      });

      return { headers, rows, types };
    } catch {
      return { headers: [], rows: [], types: {} };
    }
  }, [dataInput, filterKeyword, sortCol, sortAsc]);

  // Parsed hierarchical tree for JSON/XML/YAML preview
  const activeParsedTree = useMemo(() => {
    if (!dataInput.trim()) return null;
    try {
      if (utilityId === 'json-tree' || utilityId === 'validate-json') {
        return JSON.parse(dataInput);
      }
      if (utilityId === 'xml-tree' || utilityId === 'validate-xml') {
        const res = DataEngine.xmlToJson(dataInput);
        return res.success && res.data ? JSON.parse(res.data) : null;
      }
      if (utilityId === 'yaml-viewer' || utilityId === 'validate-yaml') {
        const res = DataEngine.yamlToJson(dataInput);
        return res.success && res.data ? JSON.parse(res.data) : null;
      }
      return JSON.parse(dataInput);
    } catch {
      return null;
    }
  }, [dataInput, utilityId]);

  // Tabular records for DataTable
  const dataTableRows = useMemo(() => {
    if (!parsedTable.headers.length) return [];
    return parsedTable.rows.map((row) => {
      const obj: Record<string, unknown> = {};
      parsedTable.headers.forEach((h, i) => {
        obj[h] = row[i] ?? '';
      });
      return obj;
    });
  }, [parsedTable]);

  useEffect(() => {
    if (parsedTable.headers.length > 0) {
      if (!sfSortCol) setSfSortCol(parsedTable.headers[0]);
      if (!sfFilterCol) setSfFilterCol(parsedTable.headers[0]);
      if (activeCols.length === 0) setActiveCols(parsedTable.headers);
    }
  }, [parsedTable.headers]);

  const handleFilesChanged = async (newFiles: SelectedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0 && newFiles[0].buffer) {
      if (newFiles[0].name.toLowerCase().endsWith('.xlsx')) {
        const xlsxRes = await DataEngine.xlsxToCsv(newFiles[0].buffer);
        if (xlsxRes.success && xlsxRes.data) {
          setDataInput(xlsxRes.data);
          setSourceFormat('xlsx');
          return;
        }
      }
      const decoded = new TextDecoder('utf-8').decode(newFiles[0].buffer);
      setDataInput(decoded);
      if (newFiles[0].name.endsWith('.json')) setSourceFormat('json');
      else if (newFiles[0].name.endsWith('.yaml') || newFiles[0].name.endsWith('.yml'))
        setSourceFormat('yaml');
      else if (newFiles[0].name.endsWith('.xml')) setSourceFormat('xml');
      else setSourceFormat('csv');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setOutputData(null);
    setOutputBuffer(null);
    setErrorMsg(null);
    setValidationStatus(null);
    setFilterKeyword('');
    setSortCol(null);
    setHiddenCols([]);
    setIsProcessing(false);
    setDiffReport(null);
    setSplitChunksResult(null);
  };

  const handleCopyText = async (textToCopy: string) => {
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRunOperation = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setOutputData(null);
    setOutputBuffer(null);
    setValidationStatus(null);
    setDiffReport(null);
    setSplitChunksResult(null);
    setProgressPercent(20);
    setProgressStage('Parsing data payload...');

    try {
      let success = false;
      let summary = '';

      if (utilityId === 'data-ndjson-tsv') {
        const res = DataEngine.ndjsonTsvConvert(dataInput, ndFrom, ndTo);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Converted ${ndFrom.toUpperCase()} to ${ndTo.toUpperCase()} (${res.metadata?.rowCount || 0} records)`;
        } else {
          setErrorMsg(res.error || 'Conversion failed');
        }
      } else if (utilityId === 'data-jsonpath-query') {
        const res = DataEngine.jsonPathQuery(dataInput, jsonPathExpr);
        if (res.success) {
          setOutputData(JSON.stringify(res.data, null, 2));
          success = true;
          summary = `JSONPath query evaluated: ${res.metadata?.matchesCount ?? 1} match(es)`;
        } else {
          setErrorMsg(res.error || 'Invalid JSONPath query');
        }
      } else if (utilityId === 'data-join-csv') {
        const res = DataEngine.joinCsv(dataInput, secondaryCsv, joinKeyA, joinKeyB, joinType);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Joined tables on ${joinKeyA} = ${joinKeyB} (${res.metadata?.rowCount || 0} rows)`;
        } else {
          setErrorMsg(res.error || 'Failed to join CSV tables');
        }
      } else if (utilityId === 'data-pivot-groupby') {
        const res = DataEngine.pivotGroupBy(dataInput, pivotGroupCol, pivotAggCol, pivotFunc);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Grouped by ${pivotGroupCol} (${res.metadata?.groupCount || 0} groups)`;
        } else {
          setErrorMsg(res.error || 'Failed to group and aggregate data');
        }
      } else if (utilityId === 'data-split-csv') {
        const res = DataEngine.splitCsv(dataInput, {
          mode: splitMode,
          column: splitCol,
          chunkSize: splitChunkSize,
        });
        if (res.success && res.data) {
          setSplitChunksResult(res.data);
          setOutputData(`Split into ${res.data.length} files:\n\n` + res.data.map(c => `• ${c.name} (${c.rowCount} rows)`).join('\n'));
          success = true;
          summary = `Split CSV into ${res.data.length} files`;
        } else {
          setErrorMsg(res.error || 'Failed to split CSV');
        }
      } else if (utilityId === 'data-encoding-fixer') {
        const res = DataEngine.fixEncoding(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data.fixed);
          success = true;
          summary = `Encoding repaired (${res.data.fixesCount} Mojibake artifacts corrected)`;
        } else {
          setErrorMsg(res.error || 'Failed to fix encoding');
        }
      } else if (utilityId === 'data-json-to-typescript') {
        const res = DataEngine.jsonToTypeScript(dataInput, tsRootName);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Generated TypeScript interfaces for '${tsRootName}'`;
        } else {
          setErrorMsg(res.error || 'Failed to generate TypeScript interface');
        }
      } else if (utilityId === 'data-json-schema-validator') {
        const res = DataEngine.validateJsonSchema(dataInput, schemaInput);
        if (res.success && res.data) {
          setValidationStatus({
            valid: res.data.valid,
            message: res.data.valid
              ? 'JSON payload matches the schema perfectly with 0 violations.'
              : `Schema violations: ${res.data.errors.join('; ')}`,
          });
          setOutputData(dataInput);
          success = true;
          summary = res.data.valid ? 'JSON Schema Valid' : 'JSON Schema Invalid';
        } else {
          setErrorMsg(res.error || 'Schema validation error');
        }
      } else if (utilityId === 'data-sql-csv') {
        const res = DataEngine.sqlOnCsv(dataInput, sqlQuery);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Executed SQL: ${res.metadata?.rowCount || 0} rows returned`;
        } else {
          setErrorMsg(res.error || 'SQL query failed');
        }
      } else if (utilityId === 'data-json-diff') {
        const res = DataEngine.jsonDiff(jsonDiffLeft, jsonDiffRight);
        if (res.success && res.data) {
          setDiffReport(res.data);
          const d = res.data;
          const report =
            (d.isIdentical ? '✓ Both JSON documents are identical.\n\n' : 'Discrepancies detected:\n\n') +
            `• Added properties: ${d.added.length}\n` +
            `• Removed properties: ${d.removed.length}\n` +
            `• Modified properties: ${d.modified.length}\n\n` +
            JSON.stringify(d, null, 2);
          setOutputData(report);
          success = true;
          summary = d.isIdentical ? 'JSON documents identical' : `JSON Diff: ${d.modified.length} modified`;
        } else {
          setErrorMsg(res.error || 'JSON Diff comparison failed');
        }
      } else if (utilityId === 'csv-to-json' || (sourceFormat === 'csv' && targetFormat === 'json')) {
        const res = DataEngine.csvToJson(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Converted to JSON (${res.metadata?.rowCount || 0} rows)`;
        } else {
          setErrorMsg(res.error || 'Failed to parse CSV.');
        }
      } else if (utilityId === 'json-to-csv' || (sourceFormat === 'json' && targetFormat === 'csv')) {
        const res = DataEngine.jsonToCsv(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Converted to CSV (${res.metadata?.rowCount || 0} rows)`;
        } else {
          setErrorMsg(res.error || 'Failed to convert JSON to CSV.');
        }
      } else if (utilityId === 'csv-to-xlsx') {
        const res = await DataEngine.csvToXlsx(dataInput);
        if (res.success && res.outputBuffer) {
          setOutputBuffer(res.outputBuffer);
          setOutputData(dataInput);
          success = true;
          summary = `Exported Excel XLSX (${res.metadata?.rowCount || 0} rows)`;
        } else {
          setErrorMsg(res.error || 'Failed to generate Excel file.');
        }
      } else if (utilityId === 'json-to-yaml') {
        const res = DataEngine.jsonToYaml(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = 'Converted JSON to YAML';
        } else {
          setErrorMsg(res.error || 'Failed to convert JSON to YAML.');
        }
      } else if (utilityId === 'yaml-to-json') {
        const res = DataEngine.yamlToJson(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = 'Converted YAML to JSON';
        } else {
          setErrorMsg(res.error || 'Failed to convert YAML to JSON.');
        }
      } else if (utilityId === 'xml-to-json') {
        const res = DataEngine.xmlToJson(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = 'Converted XML to JSON';
        } else {
          setErrorMsg(res.error || 'Failed to convert XML to JSON.');
        }
      } else if (utilityId === 'json-pretty-minify' || utilityId === 'format-json-code') {
        const res = DataEngine.formatJson(dataInput, false);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = 'Formatted JSON';
        } else {
          setErrorMsg(res.error || 'Invalid JSON syntax.');
        }
      } else if (utilityId === 'xml-formatting' || utilityId === 'format-xml-code') {
        const res = DataEngine.formatXml(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = 'Formatted XML';
        } else {
          setErrorMsg(res.error || 'Invalid XML syntax.');
        }
      } else if (utilityId === 'yaml-formatting') {
        const res = DataEngine.jsonToYaml(JSON.stringify(dataInput));
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = 'Formatted YAML';
        }
      } else if (utilityId === 'validate-csv') {
        const res = DataEngine.validateCsv(dataInput);
        if (res.success && res.data) {
          const v = res.data;
          setValidationStatus({
            valid: v.valid,
            message: v.valid
              ? `Valid CSV format. ${v.rowCount} records, ${v.columnCount} columns. Delimiter detected: "${v.delimiter}".`
              : `CSV validation issues detected (${v.errors.length} error(s)): ${v.errors.join('; ')}`,
          });
          const report =
            (v.valid ? '✓ CSV VALIDATION PASSED\n\n' : '⚠ CSV VALIDATION FAILED\n\n') +
            `• Delimiter: ${v.delimiter === '\t' ? 'TAB' : v.delimiter}\n` +
            `• Records: ${v.rowCount}\n` +
            `• Columns: ${v.columnCount}\n` +
            `• Headers: ${v.headers.join(', ')}\n\n` +
            (v.errors.length > 0 ? `Errors:\n${v.errors.map((e) => `  ✗ ${e}`).join('\n')}\n\n` : '') +
            (v.warnings.length > 0 ? `Warnings:\n${v.warnings.map((w) => `  ! ${w}`).join('\n')}\n\n` : '') +
            dataInput;
          setOutputData(report);
          success = true;
          summary = v.valid ? `Valid CSV (${v.rowCount} rows)` : `CSV Invalid (${v.errors.length} errors)`;
        } else {
          setErrorMsg(res.error || 'Failed to validate CSV');
        }
      } else if (utilityId === 'validate-yaml') {
        const res = DataEngine.validateYaml(dataInput);
        if (res.success && res.data) {
          const v = res.data;
          setValidationStatus({
            valid: v.valid,
            message: v.valid
              ? 'Valid YAML document. Structure and syntax check passed with 0 errors.'
              : `YAML syntax issues detected: ${v.errors.join('; ')}`,
          });
          const report =
            (v.valid ? '✓ YAML VALIDATION PASSED\n\n' : '⚠ YAML VALIDATION FAILED\n\n') +
            (v.errors.length > 0 ? `Errors:\n${v.errors.map((e) => `  ✗ ${e}`).join('\n')}\n\n` : '') +
            (v.warnings.length > 0 ? `Warnings:\n${v.warnings.map((w) => `  ! ${w}`).join('\n')}\n\n` : '') +
            dataInput;
          setOutputData(report);
          success = true;
          summary = v.valid ? 'YAML Valid' : `YAML Invalid (${v.errors.length} errors)`;
        } else {
          setErrorMsg(res.error || 'Failed to validate YAML');
        }
      } else if (utilityId === 'data-sort-filter') {
        const res = DataEngine.sortAndFilterCsv(dataInput, {
          sortCol: sfSortCol || undefined,
          sortAsc: sfSortAsc,
          filterCol: sfFilterCol || undefined,
          filterOp: sfFilterOp,
          filterVal: sfFilterVal,
        });
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Sorted & filtered CSV: ${res.metadata?.rowCount || 0} rows remaining`;
        } else {
          setErrorMsg(res.error || 'Failed to sort/filter data');
        }
      } else if (utilityId === 'data-columns') {
        const res = DataEngine.transformCsvColumns(dataInput, {
          columnsToKeep: activeCols.length > 0 ? activeCols : undefined,
          columnRenames: colRenames,
          dropEmptyColumns: dropEmptyCols,
        });
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Transformed columns: ${res.metadata?.columnCount || 0} columns preserved`;
        } else {
          setErrorMsg(res.error || 'Failed to transform columns');
        }
      } else if (utilityId === 'data-format-values') {
        const res = DataEngine.formatCsvValues(dataInput, {
          trimWhitespace: fmtTrim,
          caseTransform: fmtCase,
          emptyReplacement: fmtEmptyRepl || undefined,
          roundDecimals: typeof fmtRoundDec === 'number' ? fmtRoundDec : undefined,
          targetColumn: fmtTargetCol || undefined,
        });
        if (res.success && res.data) {
          setOutputData(res.data.csv);
          success = true;
          summary = `Formatted values: ${res.data.modifiedCellsCount} cell(s) modified`;
        } else {
          setErrorMsg(res.error || 'Failed to format values');
        }
      } else if (utilityId === 'csv-viewer' || utilityId === 'xlsx-viewer') {
        setOutputData(dataInput);
        success = true;
        summary = `Inspected tabular data (${parsedTable.rows.length} rows, ${parsedTable.headers.length} columns)`;
      } else if (utilityId === 'json-tree') {
        try {
          const parsed = JSON.parse(dataInput);
          setOutputData(JSON.stringify(parsed, null, 2));
          success = true;
          summary = `Parsed JSON tree (${Array.isArray(parsed) ? `${parsed.length} items` : `${Object.keys(parsed).length} keys`})`;
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Invalid JSON format');
        }
      } else if (utilityId === 'xml-tree') {
        const res = DataEngine.xmlToJson(dataInput);
        if (res.success && res.data) {
          setOutputData(DataEngine.formatXml(dataInput).data || dataInput);
          success = true;
          summary = 'Parsed XML hierarchy tree';
        } else {
          setErrorMsg(res.error || 'Invalid XML document');
        }
      } else if (utilityId === 'yaml-viewer') {
        const res = DataEngine.yamlToJson(dataInput);
        if (res.success && res.data) {
          setOutputData(dataInput);
          success = true;
          summary = 'Parsed YAML hierarchy tree';
        } else {
          setErrorMsg(res.error || 'Invalid YAML document');
        }
      } else if (utilityId.startsWith('validate-')) {
        if (utilityId === 'validate-json') {
          const res = DataEngine.formatJson(dataInput, false);
          if (res.success) {
            setValidationStatus({
              valid: true,
              message: 'Valid JSON payload. Syntax check passed with 0 errors.',
            });
            setOutputData(dataInput);
            success = true;
            summary = 'JSON Validation Passed';
          } else {
            setValidationStatus({
              valid: false,
              message: res.error || 'Invalid JSON syntax.',
            });
            setErrorMsg(res.error || 'Invalid JSON syntax.');
          }
        } else if (utilityId === 'validate-xml') {
          const res = DataEngine.formatXml(dataInput);
          if (res.success) {
            setValidationStatus({
              valid: true,
              message: 'Valid XML document. All tags are balanced and well-formed.',
            });
            setOutputData(dataInput);
            success = true;
            summary = 'XML Validation Passed';
          } else {
            setValidationStatus({
              valid: false,
              message: res.error || 'XML syntax validation error.',
            });
            setErrorMsg(res.error || 'XML syntax validation error.');
          }
        }
      } else if (utilityId === 'data-dedup') {
        const lines = dataInput.trim().split('\n');
        const header = lines[0];
        const unique = Array.from(new Set(lines.slice(1)));
        const res = [header, ...unique].join('\n');
        setOutputData(res);
        success = true;
        summary = `Deduplicated rows (${lines.length - unique.length - 1} duplicates removed)`;
      } else {
        setOutputData(dataInput);
        success = true;
        summary = 'Data processing completed';
      }

      setProgressPercent(100);

      if (success) {
        HistoryService.record({
          toolName,
          workspaceId: 'data',
          groupId,
          utilityId,
          input: files[0]?.name || plural(dataInput.trim() ? dataInput.split('\n').length : 0, 'line'),
          output: summary,
          status: 'completed',
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const getOutputExtension = () => {
    if (utilityId === 'data-json-to-typescript') return 'ts';
    if (utilityId === 'data-ndjson-tsv') return ndTo === 'tsv' ? 'tsv' : ndTo === 'ndjson' ? 'ndjson' : ndTo;
    if (utilityId.includes('json') || targetFormat === 'json') return 'json';
    if (utilityId.includes('yaml') || targetFormat === 'yaml') return 'yaml';
    if (utilityId.includes('xml') || targetFormat === 'xml') return 'xml';
    if (utilityId === 'csv-to-xlsx') return 'xlsx';
    return 'csv';
  };

  const breadcrumbs = [
    { label: 'Home', onClick: onBackToUtilities },
    { label: 'Data', onClick: onBackToUtilities },
    { label: toolName },
  ];

  return (
    <ToolLayout
      breadcrumbItems={breadcrumbs}
      title={toolName}
      description={toolDescription}
      badgeGradient="var(--badge-data)"
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onReset={handleReset}
    >
      <div className="data-tool-body">
        {/* Processing State */}
        {isProcessing && (
          <ProcessingView
            title={`Executing ${toolName}...`}
            currentFile={files[0]?.name || 'payload.data'}
            currentStage={progressStage}
            percent={progressPercent}
            onCancel={() => setIsProcessing(false)}
          />
        )}

        {/* Validation Status Banner if available */}
        {validationStatus && (
          <div
            className={`validation-status-banner ${validationStatus.valid ? 'is-valid' : 'is-invalid'}`}
          >
            {validationStatus.valid ? (
              <CheckCircle size={18} className="text-success" />
            ) : (
              <AlertTriangle size={18} className="text-danger" />
            )}
            <div className="validation-status-texts">
              <span className="validation-main-title">
                {validationStatus.valid ? 'Valid Syntax / Schema' : 'Validation Error'}
              </span>
              <span className="validation-sub-text">{validationStatus.message}</span>
            </div>
          </div>
        )}

        {/* Interactive Custom Controls Header based on utility */}
        {!outputData && !isProcessing && !dataInput.trim() && !jsonDiffLeft.trim() && !schemaInput.trim() && files.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No data loaded"
            description="Paste CSV, TSV, or JSON data to format, convert, and inspect records offline."
            actionLabel="Start with blank input"
            onAction={() => setDataInput('\n')}
            onTrySample={handleTrySample}
            sampleLabel="Try a sample dataset"
          />
        ) : !outputData && !isProcessing && (
          <div className="data-editor-container">
            {utilityId === 'data-ndjson-tsv' && (
              <div className="converter-selectors-bar">
                <div className="selector-group">
                  <label>From:</label>
                  <select className="control-input" value={ndFrom} onChange={(e) => setNdFrom(e.target.value as any)}>
                    <option value="csv">CSV</option>
                    <option value="tsv">TSV</option>
                    <option value="ndjson">NDJSON</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <ArrowRight size={16} className="arrow-icon" />
                <div className="selector-group">
                  <label>To:</label>
                  <select className="control-input" value={ndTo} onChange={(e) => setNdTo(e.target.value as any)}>
                    <option value="tsv">TSV</option>
                    <option value="ndjson">NDJSON</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>
            )}

            {utilityId === 'data-jsonpath-query' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>JSONPath Expression:</span>
                <input
                  type="text"
                  className="control-input"
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                  value={jsonPathExpr}
                  onChange={(e) => setJsonPathExpr(e.target.value)}
                  placeholder="e.g. $.store.book[*].title or items[0].id"
                />
              </div>
            )}

            {utilityId === 'data-join-csv' && (
              <div style={{ display: 'flex', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Key A:</span>
                  <input type="text" className="control-input" style={{ width: '80px' }} value={joinKeyA} onChange={(e) => setJoinKeyA(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Key B:</span>
                  <input type="text" className="control-input" style={{ width: '80px' }} value={joinKeyB} onChange={(e) => setJoinKeyB(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Join Type:</span>
                  {(['inner', 'left', 'outer'] as const).map((t) => (
                    <button key={t} type="button" className={`segmented-chip-btn ${joinType === t ? 'active' : ''}`} onClick={() => setJoinType(t)}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {utilityId === 'data-pivot-groupby' && (
              <div style={{ display: 'flex', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Group By Column:</span>
                  <input type="text" className="control-input" style={{ width: '120px' }} value={pivotGroupCol} onChange={(e) => setPivotGroupCol(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aggregate Column:</span>
                  <input type="text" className="control-input" style={{ width: '120px' }} value={pivotAggCol} onChange={(e) => setPivotAggCol(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Function:</span>
                  {(['count', 'sum', 'avg', 'min', 'max'] as const).map((fn) => (
                    <button key={fn} type="button" className={`segmented-chip-btn ${pivotFunc === fn ? 'active' : ''}`} onClick={() => setPivotFunc(fn)}>
                      {fn.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {utilityId === 'data-split-csv' && (
              <div style={{ display: 'flex', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Split By:</span>
                  <button type="button" className={`segmented-chip-btn ${splitMode === 'column' ? 'active' : ''}`} onClick={() => setSplitMode('column')}>
                    Category Column
                  </button>
                  <button type="button" className={`segmented-chip-btn ${splitMode === 'rows' ? 'active' : ''}`} onClick={() => setSplitMode('rows')}>
                    Row Chunk Count
                  </button>
                </div>
                {splitMode === 'column' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Column Name:</span>
                    <input type="text" className="control-input" style={{ width: '120px' }} value={splitCol} onChange={(e) => setSplitCol(e.target.value)} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rows Per File:</span>
                    <input type="number" min={1} className="control-input" style={{ width: '80px' }} value={splitChunkSize} onChange={(e) => setSplitChunkSize(Math.max(1, parseInt(e.target.value) || 1))} />
                  </div>
                )}
              </div>
            )}

            {utilityId === 'data-sql-csv' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                <Terminal size={14} className="text-accent" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>SQL:</span>
                <input
                  type="text"
                  className="control-input"
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="e.g. SELECT * WHERE salary > 100000 ORDER BY salary DESC LIMIT 10"
                />
              </div>
            )}

            {utilityId === 'data-json-to-typescript' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Root Interface Name:</span>
                <input
                  type="text"
                  className="control-input"
                  style={{ width: '180px' }}
                  value={tsRootName}
                  onChange={(e) => setTsRootName(e.target.value)}
                />
              </div>
            )}

            {/* Sort & Filter Controls */}
            {utilityId === 'data-sort-filter' && (
              <div className="data-controls-strip">
                <span className="data-controls-strip-label">Sort:</span>
                <select
                  className="control-input"
                  value={sfSortCol}
                  onChange={(e) => setSfSortCol(e.target.value)}
                  style={{ minWidth: '120px' }}
                >
                  <option value="">(None)</option>
                  {parsedTable.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="segmented-chip-btn"
                  onClick={() => setSfSortAsc(!sfSortAsc)}
                >
                  <ArrowUpDown size={12} />
                  <span>{sfSortAsc ? 'Ascending' : 'Descending'}</span>
                </button>

                <span className="data-controls-strip-label" style={{ marginLeft: '12px' }}>Filter:</span>
                <select
                  className="control-input"
                  value={sfFilterCol}
                  onChange={(e) => setSfFilterCol(e.target.value)}
                  style={{ minWidth: '120px' }}
                >
                  <option value="">(All Columns)</option>
                  {parsedTable.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  className="control-input"
                  value={sfFilterOp}
                  onChange={(e) => setSfFilterOp(e.target.value as any)}
                  style={{ width: '130px' }}
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals</option>
                  <option value="starts_with">Starts With</option>
                  <option value="gt">Greater Than (&gt;)</option>
                  <option value="lt">Less Than (&lt;)</option>
                  <option value="not_empty">Not Empty</option>
                </select>
                {sfFilterOp !== 'not_empty' && (
                  <input
                    type="text"
                    className="control-input"
                    placeholder="Filter keyword..."
                    value={sfFilterVal}
                    onChange={(e) => setSfFilterVal(e.target.value)}
                    style={{ flex: 1, minWidth: '140px' }}
                  />
                )}
              </div>
            )}

            {/* Column Manager Controls */}
            {utilityId === 'data-columns' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="data-controls-strip-label">Manage Columns ({parsedTable.headers.length} available):</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={dropEmptyCols}
                      onChange={(e) => setDropEmptyCols(e.target.checked)}
                    />
                    <span>Drop entirely empty columns</span>
                  </label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {parsedTable.headers.map((h) => {
                    const isKept = activeCols.includes(h);
                    return (
                      <div key={h} className="column-manage-item">
                        <input
                          type="checkbox"
                          checked={isKept}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setActiveCols([...activeCols, h]);
                            } else {
                              setActiveCols(activeCols.filter((col) => col !== h));
                            }
                          }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 500 }}>{h}</span>
                        {isKept && (
                          <input
                            type="text"
                            placeholder="Rename..."
                            value={colRenames[h] ?? ''}
                            onChange={(e) => setColRenames({ ...colRenames, [h]: e.target.value })}
                            className="control-input"
                            style={{ width: '90px', padding: '2px 6px', fontSize: '10.5px' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Format Values Controls */}
            {utilityId === 'data-format-values' && (
              <div className="data-controls-strip">
                <span className="data-controls-strip-label">Target:</span>
                <select
                  className="control-input"
                  value={fmtTargetCol}
                  onChange={(e) => setFmtTargetCol(e.target.value)}
                  style={{ minWidth: '120px' }}
                >
                  <option value="">(All Columns)</option>
                  {parsedTable.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={fmtTrim}
                    onChange={(e) => setFmtTrim(e.target.checked)}
                  />
                  <span>Trim Spaces</span>
                </label>

                <span className="data-controls-strip-label" style={{ marginLeft: '8px' }}>Case:</span>
                <select
                  className="control-input"
                  value={fmtCase}
                  onChange={(e) => setFmtCase(e.target.value as any)}
                  style={{ width: '110px' }}
                >
                  <option value="none">Preserve</option>
                  <option value="lowercase">lowercase</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="titlecase">Title Case</option>
                </select>

                <span className="data-controls-strip-label" style={{ marginLeft: '8px' }}>Replace Empty:</span>
                <input
                  type="text"
                  placeholder="e.g. N/A"
                  value={fmtEmptyRepl}
                  onChange={(e) => setFmtEmptyRepl(e.target.value)}
                  className="control-input"
                  style={{ width: '80px' }}
                />

                <span className="data-controls-strip-label" style={{ marginLeft: '8px' }}>Decimals:</span>
                <input
                  type="number"
                  min={0}
                  max={8}
                  placeholder="e.g. 2"
                  value={fmtRoundDec}
                  onChange={(e) => setFmtRoundDec(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="control-input"
                  style={{ width: '60px' }}
                />
              </div>
            )}

            {/* View Mode Switcher for Viewers */}
            {(utilityId === 'csv-viewer' || utilityId === 'xlsx-viewer') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="data-view-mode-tabs">
                  <button
                    type="button"
                    className={`data-view-tab-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <Table size={13} />
                    <span>Table View</span>
                  </button>
                  <button
                    type="button"
                    className={`data-view-tab-btn ${viewMode === 'editor' ? 'active' : ''}`}
                    onClick={() => setViewMode('editor')}
                  >
                    <Code size={13} />
                    <span>Raw CSV</span>
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {parsedTable.rows.length} rows • {parsedTable.headers.length} columns
                </span>
              </div>
            )}

            {(utilityId === 'json-tree' || utilityId === 'xml-tree' || utilityId === 'yaml-viewer') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="data-view-mode-tabs">
                  <button
                    type="button"
                    className={`data-view-tab-btn ${viewMode === 'tree' ? 'active' : ''}`}
                    onClick={() => setViewMode('tree')}
                  >
                    <Layers size={13} />
                    <span>Tree Inspector</span>
                  </button>
                  <button
                    type="button"
                    className={`data-view-tab-btn ${viewMode === 'editor' ? 'active' : ''}`}
                    onClick={() => setViewMode('editor')}
                  >
                    <Code size={13} />
                    <span>Raw Code</span>
                  </button>
                </div>
                {activeParsedTree && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Structure parsed cleanly
                  </span>
                )}
              </div>
            )}

            {/* Split Dual Editors for Diff, Schema Validation, or CSV Join */}
            {utilityId === 'data-json-diff' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="code-editor-box">
                  <div className="editor-top-label-bar"><span className="editor-lang-badge">JSON A (Original)</span></div>
                  <textarea className="monospace-editor" style={{ height: '300px' }} value={jsonDiffLeft} onChange={(e) => setJsonDiffLeft(e.target.value)} />
                </div>
                <div className="code-editor-box">
                  <div className="editor-top-label-bar"><span className="editor-lang-badge">JSON B (Modified)</span></div>
                  <textarea className="monospace-editor" style={{ height: '300px' }} value={jsonDiffRight} onChange={(e) => setJsonDiffRight(e.target.value)} />
                </div>
              </div>
            ) : utilityId === 'data-json-schema-validator' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="code-editor-box">
                  <div className="editor-top-label-bar"><span className="editor-lang-badge">JSON Data Payload</span></div>
                  <textarea className="monospace-editor" style={{ height: '300px' }} value={dataInput} onChange={(e) => setDataInput(e.target.value)} />
                </div>
                <div className="code-editor-box">
                  <div className="editor-top-label-bar"><span className="editor-lang-badge">JSON Schema Definition</span></div>
                  <textarea className="monospace-editor" style={{ height: '300px' }} value={schemaInput} onChange={(e) => setSchemaInput(e.target.value)} />
                </div>
              </div>
            ) : utilityId === 'data-join-csv' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="code-editor-box">
                  <div className="editor-top-label-bar"><span className="editor-lang-badge">Primary CSV (Table A)</span></div>
                  <textarea className="monospace-editor" style={{ height: '240px' }} value={dataInput} onChange={(e) => setDataInput(e.target.value)} />
                </div>
                <div className="code-editor-box">
                  <div className="editor-top-label-bar"><span className="editor-lang-badge">Secondary CSV (Table B)</span></div>
                  <textarea className="monospace-editor" style={{ height: '240px' }} value={secondaryCsv} onChange={(e) => setSecondaryCsv(e.target.value)} />
                </div>
              </div>
            ) : (utilityId === 'csv-viewer' || utilityId === 'xlsx-viewer') && viewMode === 'table' && parsedTable.headers.length > 0 ? (
              /* Tabular View Mode */
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                <DataTable columns={parsedTable.headers} data={dataTableRows} pageSize={15} />
              </div>
            ) : (utilityId === 'json-tree' || utilityId === 'xml-tree' || utilityId === 'yaml-viewer') && viewMode === 'tree' && activeParsedTree ? (
              /* Tree Inspector View Mode */
              <div className="data-tree-wrapper">
                <DataTreeNode label="root" value={activeParsedTree} depth={0} />
              </div>
            ) : (
              /* Single Main Input Editor */
              <div className="code-editor-box">
                <div className="editor-top-label-bar">
                  <span className="editor-lang-badge">Input Data Payload</span>
                  <span className="editor-lines-badge">
                    {plural(dataInput.trim() ? dataInput.split('\n').length : 0, 'line')}{parsedTable.rows.length ? ` • ${plural(parsedTable.rows.length, 'row')}` : ''}
                  </span>
                </div>
                <textarea
                  className="monospace-editor"
                  style={{ height: '260px' }}
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  placeholder="Type or paste structured data here..."
                />
              </div>
            )}

            <div className="data-actions-row">
              <button
                className="tool-btn primary"
                onClick={handleRunOperation}
                disabled={isProcessing}
                type="button"
              >
                <span>{`Execute ${toolName}`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Result Screen */}
        {outputData && !isProcessing && (
          <>
            <ResultViewer
              title={`${toolName} Completed`}
              outputText={outputBuffer ? undefined : outputData}
              outputBuffer={outputBuffer || undefined}
              outputName={`toiloki_${utilityId}_output.${getOutputExtension()}`}
              defaultExtension={getOutputExtension()}
              inputFormat={sourceFormat}
              outputFormat={getOutputExtension()}
              dataStats={{
                rows: parsedTable.rows.length,
                columns: parsedTable.headers.length,
                format: getOutputExtension(),
              }}
              onPreview={() => setIsPreviewOpen(true)}
              onReset={handleReset}
            />

            {splitChunksResult && (
              <div style={{ marginTop: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '10px' }}>
                  Split File Chunks ({splitChunksResult.length} files):
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                  {splitChunksResult.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.rowCount} records</div>
                      </div>
                      <button className="tool-btn secondary small-btn" onClick={() => handleCopyText(c.csv)}>
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Error Panel */}
        {errorMsg && (
          <ErrorPanel
            category="processing_failed"
            title="Processing Error"
            message={errorMsg}
            onRetry={handleRunOperation}
            onChooseAnother={handleReset}
          />
        )}
      </div>
    </ToolLayout>
  );
};
