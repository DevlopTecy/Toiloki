import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import './DataWorkspaceView.css';

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
  const [dataInput, setDataInput] = useState<string>(
    'id,name,role,department,salary\n1,Alice Morgan,Lead Engineer,Backend,125000\n2,Bob Jenkins,UI Designer,Product,95000\n3,Carol Zhao,Data Scientist,Analytics,118000\n4,David Kim,DevOps Architect,Infrastructure,130000\n5,Elena Rossi,QA Engineer,Quality,88000'
  );

  // Converter format options
  const [sourceFormat, setSourceFormat] = useState('csv');
  const [targetFormat, setTargetFormat] = useState('json');

  // Transformer controls
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'tree' | 'editor'>('table');

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

  // Parsed JSON tree for JSON preview
  const parsedTree = useMemo(() => {
    try {
      return JSON.parse(dataInput);
    } catch {
      return null;
    }
  }, [dataInput]);

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
  };

  const handleRemoveDuplicates = () => {
    const lines = dataInput.trim().split('\n');
    if (lines.length <= 1) return;
    const header = lines[0];
    const unique = Array.from(new Set(lines.slice(1)));
    setDataInput([header, ...unique].join('\n'));
  };

  const toggleColumnVisibility = (col: string) => {
    setHiddenCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleRunOperation = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setOutputData(null);
    setOutputBuffer(null);
    setValidationStatus(null);
    setProgressPercent(20);
    setProgressStage('Parsing data payload...');

    try {
      let success = false;
      let summary = '';

      // Converters
      if (utilityId === 'csv-to-json' || (sourceFormat === 'csv' && targetFormat === 'json')) {
        setProgressPercent(60);
        const res = DataEngine.csvToJson(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Converted to JSON (${res.metadata?.rowCount || 0} rows)`;
        } else {
          setErrorMsg(res.error || 'Failed to parse CSV.');
        }
      } else if (
        utilityId === 'json-to-csv' ||
        (sourceFormat === 'json' && targetFormat === 'csv')
      ) {
        setProgressPercent(60);
        const res = DataEngine.jsonToCsv(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = `Converted to CSV (${res.metadata?.rowCount || 0} rows)`;
        } else {
          setErrorMsg(res.error || 'Failed to convert JSON to CSV.');
        }
      } else if (utilityId === 'csv-to-xlsx') {
        setProgressPercent(50);
        setProgressStage('Building Excel workbook cells...');
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
        const res = DataEngine.formatXml(dataInput);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = 'Processed XML';
        } else {
          setErrorMsg(res.error || 'Failed to parse XML.');
        }
      } else if (utilityId === 'json-pretty-minify') {
        const res = DataEngine.formatJson(dataInput, false);
        if (res.success && res.data) {
          setOutputData(res.data);
          success = true;
          summary = 'Formatted JSON';
        } else {
          setErrorMsg(res.error || 'Invalid JSON syntax.');
        }
      } else if (utilityId === 'xml-formatting') {
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
              location: 'Near unexpected token or missing quote',
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
              location: 'Closing tag mismatch',
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
          input: files[0]?.name || `${dataInput.split('\n').length} lines`,
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

  const visibleHeaders = parsedTable.headers.filter((h) => !hiddenCols.includes(h));

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
                {validationStatus.valid ? 'Valid Syntax' : 'Invalid Syntax'}
              </span>
              <span className="validation-sub-text">{validationStatus.message}</span>
              {validationStatus.location && (
                <span className="validation-location">
                  Location context: <code>{validationStatus.location}</code>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Table Viewer Screen */}
        {utilityId === 'data-viewer' && !isProcessing && (
          <div className="data-viewer-container">
            <DataTable
              columns={parsedTable.headers}
              data={parsedTable.rows.map((row) => {
                const rowObj: Record<string, unknown> = {};
                parsedTable.headers.forEach((h, i) => {
                  const val = row[i] ?? '';
                  const num = Number(val);
                  rowObj[h] = !isNaN(num) && val !== '' ? num : val;
                });
                return rowObj;
              })}
            />
          </div>
        )}

        {/* Converter / Formatter / Transformer / Validator Screens */}
        {utilityId !== 'data-viewer' && !outputData && !isProcessing && (
          <div className="data-editor-container">
            <FileDropzone
              accept={['.csv', '.json', '.xml', '.yaml', '.yml', '.xlsx']}
              multiple={false}
              files={files}
              onFilesChanged={handleFilesChanged}
              label={`Select or drop data file for ${toolName}`}
              compact={true}
            />

            {/* Converter Source / Target selector bar */}
            {utilityId === 'data-converter' && (
              <div className="converter-selectors-bar">
                <div className="selector-group">
                  <label>Source Format:</label>
                  <select
                    className="control-input"
                    value={sourceFormat}
                    onChange={(e) => setSourceFormat(e.target.value)}
                  >
                    <option value="csv">CSV (Comma-separated)</option>
                    <option value="json">JSON (JavaScript Object)</option>
                    <option value="yaml">YAML (Human readable)</option>
                    <option value="xml">XML (Extensible Markup)</option>
                  </select>
                </div>
                <ArrowRight size={16} className="arrow-icon" />
                <div className="selector-group">
                  <label>Target Format:</label>
                  <select
                    className="control-input"
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value)}
                  >
                    <option value="json">JSON (Formatted)</option>
                    <option value="csv">CSV (Table)</option>
                    <option value="yaml">YAML (Clean)</option>
                    <option value="xlsx">Excel (.XLSX)</option>
                  </select>
                </div>
              </div>
            )}

            {/* View Mode Switcher for JSON/YAML/XML */}
            {(dataInput.trim().startsWith('{') || dataInput.trim().startsWith('[')) && (
              <div className="view-mode-bar">
                <button
                  className={`tool-btn secondary small-btn ${viewMode === 'editor' ? 'active' : ''}`}
                  onClick={() => setViewMode('editor')}
                  type="button"
                >
                  <Code size={12} />
                  <span>Raw Editor</span>
                </button>
                <button
                  className={`tool-btn secondary small-btn ${viewMode === 'tree' ? 'active' : ''}`}
                  onClick={() => setViewMode('tree')}
                  type="button"
                >
                  <Eye size={12} />
                  <span>Tree View</span>
                </button>
              </div>
            )}

            {/* Editor or Tree Preview */}
            {viewMode === 'tree' && parsedTree ? (
              <div className="tree-view-card">
                <pre className="tree-content-block">
                  {JSON.stringify(parsedTree, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="code-editor-box">
                <div className="editor-top-label-bar">
                  <span className="editor-lang-badge">INPUT PAYLOAD</span>
                  <span className="editor-lines-badge">
                    {dataInput.split('\n').length} lines •{' '}
                    {parsedTable.rows.length ? `${parsedTable.rows.length} rows` : ''}
                  </span>
                </div>
                <textarea
                  className="monospace-editor"
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  placeholder="Type or paste structured CSV, JSON, XML, or YAML here..."
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

            <PreviewModal
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              type={parsedTable.headers.length > 0 ? 'data' : 'text'}
              title={`${toolName} Result`}
              textContent={outputData}
              tableData={
                parsedTable.headers.length > 0
                  ? {
                    headers: parsedTable.headers,
                    rows: parsedTable.rows,
                  }
                  : undefined
              }
            />
          </>
        )}

        {/* Error Panel if error occurs */}
        {errorMsg && (
          <ErrorPanel
            category="processing_failed"
            title="Validation / Processing Error"
            message={errorMsg}
            onRetry={handleRunOperation}
            onChooseAnother={handleReset}
          />
        )}
      </div>
    </ToolLayout>
  );
};
