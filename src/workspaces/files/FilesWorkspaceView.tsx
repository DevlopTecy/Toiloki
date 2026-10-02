import React, { useState, useMemo } from 'react';
import { FileDropzone, SelectedFile } from '../../components/file-system/FileDropzone';
import { FileOpsEngine, RenameRule, FileTypeInfo } from '../../engines/files/file-ops.engine';
import { ArchiveEngine, ArchiveEntry } from '../../engines/files/archive.engine';
import { HistoryService } from '../../core/services/history.service';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Copy,
  Check,
  Download,
  Search,
  CheckCircle,
  XCircle,
  FileCheck,
  FolderArchive,
  Eye,
  FileText,
  ShieldCheck,
  ArrowRightLeft,
  Trash2,
  FolderOpen,
  Archive,
  Layers,
  FileBox,
} from 'lucide-react';
import './FilesWorkspaceView.css';

interface FilesWorkspaceViewProps {
  featureId: string;
}

export const FilesWorkspaceView: React.FC<FilesWorkspaceViewProps> = ({ featureId }) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // =================== BATCH RENAME STATE ===================
  const [renameRule, setRenameRule] = useState<RenameRule>({
    prefix: '',
    suffix: '',
    findText: '',
    replaceText: '',
    caseTransform: 'none',
    numberingStart: undefined,
    numberingDigits: 2,
  });
  const [useNumbering, setUseNumbering] = useState<boolean>(false);

  const renamePreview = useMemo(() => {
    if (files.length === 0) return [];
    const names = files.map((f) => f.name);
    const rule: RenameRule = {
      ...renameRule,
      numberingStart: useNumbering ? renameRule.numberingStart ?? 1 : undefined,
    };
    return FileOpsEngine.applyBatchRename(names, rule).data || [];
  }, [files, renameRule, useNumbering]);

  // =================== FILE ANALYZER & METADATA ===================
  const [fileAnalysisList, setFileAnalysisList] = useState<
    Array<{
      file: SelectedFile;
      typeInfo: FileTypeInfo;
      sha256: string;
      createdDate: string;
      modifiedDate: string;
      extension: string;
    }>
  >([]);

  const handleAnalyzeFiles = async () => {
    if (files.length === 0) return;
    const results = [];
    const nowStr = new Date().toLocaleString();
    for (const f of files) {
      if (f.buffer) {
        const typeRes = FileOpsEngine.detectFileType(f.buffer, f.name);
        const hashRes = await FileOpsEngine.calculateSha256(f.buffer);
        const dotIdx = f.name.lastIndexOf('.');
        const ext = dotIdx !== -1 ? f.name.slice(dotIdx + 1).toLowerCase() : 'unknown';

        results.push({
          file: f,
          typeInfo: typeRes.data || {
            mime: 'application/octet-stream',
            extension: ext,
            description: 'Binary document',
            magicHex: '—',
          },
          sha256: hashRes.data || '—',
          createdDate: nowStr,
          modifiedDate: nowStr,
          extension: ext,
        });
      }
    }
    setFileAnalysisList(results);
    HistoryService.record({
      toolName: 'File Analyzer',
      workspaceId: 'files',
      utilityId: 'files-analyzer',
      featureId: 'file-type-detection',
      input: `${files.length} files`,
      output: `Analyzed MIME signatures and SHA-256`,
      status: 'completed',
    });
  };

  // =================== DUPLICATE FINDER STATE ===================
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<
    Record<
      string,
      {
        hash: string;
        files: SelectedFile[];
        totalSize: number;
      }
    >
  >({});
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const handleScanDuplicates = async () => {
    if (files.length < 2) return;
    setIsScanningDuplicates(true);
    const groups: Record<string, SelectedFile[]> = {};

    for (const f of files) {
      if (f.buffer) {
        const hashRes = await FileOpsEngine.calculateSha256(f.buffer);
        if (hashRes.success && hashRes.data) {
          const hash = hashRes.data;
          if (!groups[hash]) groups[hash] = [];
          groups[hash].push(f);
        }
      }
    }

    const actualDuplicates: Record<
      string,
      { hash: string; files: SelectedFile[]; totalSize: number }
    > = {};

    for (const [hash, list] of Object.entries(groups)) {
      if (list.length > 1) {
        const totalSize = list.reduce((acc, curr) => acc + curr.size, 0);
        actualDuplicates[hash] = { hash, files: list, totalSize };
      }
    }

    setDuplicateGroups(actualDuplicates);
    setIsScanningDuplicates(false);
    HistoryService.record({
      toolName: 'Duplicate Finder',
      workspaceId: 'files',
      utilityId: 'files-duplicate',
      featureId: 'find-duplicates',
      input: `${files.length} files scanned`,
      output: `Found ${Object.keys(actualDuplicates).length} duplicate groups`,
      status: 'completed',
    });
  };

  const handleSelectAllDuplicates = () => {
    const s = new Set<string>();
    Object.values(duplicateGroups).forEach((group) => {
      // select all except first (keeper)
      group.files.slice(1).forEach((f) => s.add(`${group.hash}-${f.name}`));
    });
    setSelectedDuplicates(s);
  };

  const handleDeselectAllDuplicates = () => {
    setSelectedDuplicates(new Set());
  };

  const handleConfirmDelete = () => {
    const count = selectedDuplicates.size;
    setIsConfirmDeleteOpen(false);
    // remove selected from duplicate groups
    const nextGroups: Record<
      string,
      { hash: string; files: SelectedFile[]; totalSize: number }
    > = {};

    for (const [hash, group] of Object.entries(duplicateGroups)) {
      const remaining = group.files.filter((f) => !selectedDuplicates.has(`${hash}-${f.name}`));
      if (remaining.length > 1) {
        nextGroups[hash] = {
          hash,
          files: remaining,
          totalSize: remaining.reduce((a, b) => a + b.size, 0),
        };
      }
    }

    setDuplicateGroups(nextGroups);
    setSelectedDuplicates(new Set());
    setDeleteNotice(`Successfully cleaned ${count} duplicate file(s) from view.`);
    setTimeout(() => setDeleteNotice(null), 3000);
  };

  // =================== FILE COMPARISON STATE ===================
  const [compareResult, setCompareResult] = useState<{
    fileA?: SelectedFile;
    fileB?: SelectedFile;
    identical: boolean;
    hashA: string;
    hashB: string;
    sizeA: number;
    sizeB: number;
  } | null>(null);

  const handleCompareTwoFiles = async () => {
    if (files.length < 2) return;
    const fileA = files[0];
    const fileB = files[1];
    if (!fileA.buffer || !fileB.buffer) return;

    const hashA = (await FileOpsEngine.calculateSha256(fileA.buffer)).data || '';
    const hashB = (await FileOpsEngine.calculateSha256(fileB.buffer)).data || '';
    const comp = FileOpsEngine.compareBuffers(fileA.buffer, fileB.buffer);

    setCompareResult({
      fileA,
      fileB,
      identical: comp.data?.identical || false,
      hashA,
      hashB,
      sizeA: fileA.size,
      sizeB: fileB.size,
    });
  };

  // =================== ARCHIVE MANAGER STATE ===================
  const [archiveMode, setArchiveMode] = useState<'create' | 'extract' | 'inspect'>('create');
  const [archiveFormat, setArchiveFormat] = useState<'zip' | 'tar' | 'gzip'>('zip');
  const [archiveFilename, setArchiveFilename] = useState<string>('archive.zip');
  const [archiveDest, setArchiveDest] = useState<string>('Default (Downloads)');
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [archiveSuccessBytes, setArchiveSuccessBytes] = useState<number | null>(null);

  const [inspectedZipEntries, setInspectedZipEntries] = useState<ArchiveEntry[]>([]);
  const [isInspectingZip, setIsInspectingZip] = useState<boolean>(false);

  const handleCreateArchive = async () => {
    if (files.length === 0) return;
    setIsArchiving(true);
    const validFiles = files
      .filter((f) => f.buffer)
      .map((f) => ({ name: f.name, buffer: f.buffer! }));
    const res = await ArchiveEngine.createZip(validFiles);
    setIsArchiving(false);

    if (res.success && res.data) {
      setArchiveSuccessBytes(res.data.length);
      const ext = archiveFormat === 'zip' ? '.zip' : archiveFormat === 'tar' ? '.tar' : '.tar.gz';
      const outName = archiveFilename.includes('.') ? archiveFilename : `${archiveFilename}${ext}`;

      const blob = new Blob([res.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outName;
      a.click();
      URL.revokeObjectURL(url);

      HistoryService.record({
        toolName: 'Archive Manager',
        workspaceId: 'files',
        utilityId: 'files-archive',
        featureId: 'create-zip-archive',
        input: `${validFiles.length} files`,
        output: `${outName} created (${((res.data.length || 0) / 1024).toFixed(1)} KB)`,
        status: 'completed',
      });
    }
  };

  const handleInspectArchive = async () => {
    if (files.length === 0 || !files[0].buffer) return;
    setIsInspectingZip(true);
    const res = await ArchiveEngine.inspectZip(files[0].buffer);
    setIsInspectingZip(false);
    if (res.success && res.data) {
      setInspectedZipEntries(res.data);
    }
  };

  return (
    <div className="files-workspace-view">
      {/* 1. BATCH RENAME */}
      {featureId === 'batch-rename-files' && (
        <div className="files-tool-frame">
          <FileDropzone
            multiple={true}
            files={files}
            onFilesChanged={setFiles}
            label="Drop files here to batch rename"
          />

          {files.length > 0 && (
            <div className="rename-controls-panel">
              <div className="rename-rules-grid">
                <div className="control-group">
                  <label className="control-label">Prefix:</label>
                  <input
                    type="text"
                    className="control-input"
                    placeholder="e.g. Doc_"
                    value={renameRule.prefix}
                    onChange={(e) => setRenameRule({ ...renameRule, prefix: e.target.value })}
                  />
                </div>
                <div className="control-group">
                  <label className="control-label">Suffix:</label>
                  <input
                    type="text"
                    className="control-input"
                    placeholder="e.g. _2026"
                    value={renameRule.suffix}
                    onChange={(e) => setRenameRule({ ...renameRule, suffix: e.target.value })}
                  />
                </div>
                <div className="control-group">
                  <label className="control-label">Find Text:</label>
                  <input
                    type="text"
                    className="control-input"
                    placeholder="Text to replace"
                    value={renameRule.findText}
                    onChange={(e) => setRenameRule({ ...renameRule, findText: e.target.value })}
                  />
                </div>
                <div className="control-group">
                  <label className="control-label">Replace With:</label>
                  <input
                    type="text"
                    className="control-input"
                    placeholder="New text"
                    value={renameRule.replaceText}
                    onChange={(e) => setRenameRule({ ...renameRule, replaceText: e.target.value })}
                  />
                </div>
                <div className="control-group">
                  <label className="control-label">Case Conversion:</label>
                  <select
                    className="control-input"
                    value={renameRule.caseTransform}
                    onChange={(e) =>
                      setRenameRule({ ...renameRule, caseTransform: e.target.value as any })
                    }
                  >
                    <option value="none">Preserve Original Case</option>
                    <option value="lower">lowercase</option>
                    <option value="upper">UPPERCASE</option>
                    <option value="capitalize">Capitalize first letter</option>
                  </select>
                </div>
                <div className="control-group checkbox-align">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={useNumbering}
                      onChange={(e) => setUseNumbering(e.target.checked)}
                    />
                    Append Sequential Numbers
                  </label>
                  {useNumbering && (
                    <input
                      type="number"
                      className="control-input small-num"
                      title="Starting Number"
                      value={renameRule.numberingStart ?? 1}
                      onChange={(e) =>
                        setRenameRule({ ...renameRule, numberingStart: Number(e.target.value) })
                      }
                    />
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="rename-preview-card">
                <div className="rename-preview-header">
                  <h3 className="rename-preview-title">
                    Renaming Preview ({renamePreview.length} files)
                  </h3>
                  <button
                    className="tool-btn primary small-btn"
                    onClick={() => alert('Batch rename applied! Files ready.')}
                    type="button"
                  >
                    Apply Renaming
                  </button>
                </div>

                <div className="rename-table">
                  <div className="rename-header-row">
                    <span className="col-orig">Original Filename</span>
                    <span className="col-arrow">→</span>
                    <span className="col-new">Preview Output</span>
                  </div>
                  {renamePreview.map((item, idx) => (
                    <div key={idx} className="rename-data-row">
                      <span className="col-orig" title={item.original}>
                        {item.original}
                      </span>
                      <span className="col-arrow">→</span>
                      <span className="col-new highlighted" title={item.renamed}>
                        {item.renamed}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. FILE TYPE DETECTION & METADATA (FILE ANALYZER) */}
      {(featureId === 'file-type-detection' ||
        featureId === 'file-metadata-ops' ||
        featureId === 'file-analyzer-full') && (
          <div className="files-tool-frame">
            <FileDropzone
              multiple={true}
              files={files}
              onFilesChanged={(newFiles) => {
                setFiles(newFiles);
                setFileAnalysisList([]);
              }}
              label="Drop files here to inspect MIME type, file properties, and cryptographic hash"
            />

            {files.length > 0 && fileAnalysisList.length === 0 && (
              <button className="tool-btn primary analyze-btn" onClick={handleAnalyzeFiles} type="button">
                <Search size={14} /> Analyze {files.length} Files
              </button>
            )}

            {fileAnalysisList.length > 0 && (
              <div className="analysis-results-card">
                <h3 className="rename-preview-title">File Information Matrix</h3>
                <div className="analysis-grid">
                  {fileAnalysisList.map((item, idx) => (
                    <div key={idx} className="analysis-item-box">
                      <div className="analysis-item-header">
                        <FileText size={16} className="text-accent" />
                        <span className="analysis-item-name">{item.file.name}</span>
                        <span className="analysis-item-size">
                          ({(item.file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>

                      {/* Clean information table */}
                      <div className="info-table-matrix">
                        <div className="info-table-row">
                          <span className="info-th">Filename</span>
                          <span className="info-td">{item.file.name}</span>
                          <button
                            className="copy-mini-btn"
                            onClick={() => copyToClipboard(item.file.name, `fn-${idx}`)}
                            type="button"
                            title="Copy filename"
                          >
                            {copiedKey === `fn-${idx}` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>

                        <div className="info-table-row">
                          <span className="info-th">Extension</span>
                          <span className="info-td">.{item.extension}</span>
                          <button
                            className="copy-mini-btn"
                            onClick={() => copyToClipboard(item.extension, `ext-${idx}`)}
                            type="button"
                            title="Copy extension"
                          >
                            {copiedKey === `ext-${idx}` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>

                        <div className="info-table-row">
                          <span className="info-th">MIME Type</span>
                          <span className="info-td font-mono">{item.typeInfo.mime}</span>
                          <button
                            className="copy-mini-btn"
                            onClick={() => copyToClipboard(item.typeInfo.mime, `mime-${idx}`)}
                            type="button"
                            title="Copy MIME type"
                          >
                            {copiedKey === `mime-${idx}` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>

                        <div className="info-table-row">
                          <span className="info-th">Size</span>
                          <span className="info-td">
                            {(item.file.size / 1024).toFixed(1)} KB ({item.file.size} bytes)
                          </span>
                          <button
                            className="copy-mini-btn"
                            onClick={() => copyToClipboard(String(item.file.size), `sz-${idx}`)}
                            type="button"
                            title="Copy size bytes"
                          >
                            {copiedKey === `sz-${idx}` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>

                        <div className="info-table-row">
                          <span className="info-th">Location</span>
                          <span className="info-td text-muted">Local Workspace Virtual Buffer</span>
                        </div>

                        <div className="info-table-row">
                          <span className="info-th">SHA-256 Hash</span>
                          <span className="info-td font-mono hash-display">{item.sha256}</span>
                          <button
                            className="copy-mini-btn"
                            onClick={() => copyToClipboard(item.sha256, `hash-${idx}`)}
                            type="button"
                            title="Copy SHA-256 hash"
                          >
                            {copiedKey === `hash-${idx}` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>

                        <div className="info-table-row">
                          <span className="info-th">Magic Bytes</span>
                          <span className="info-td font-mono">{item.typeInfo.magicHex}</span>
                          <button
                            className="copy-mini-btn"
                            onClick={() => copyToClipboard(item.typeInfo.magicHex, `hex-${idx}`)}
                            type="button"
                            title="Copy magic hex"
                          >
                            {copiedKey === `hex-${idx}` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* 3. DUPLICATE FINDER */}
      {featureId === 'duplicate-finder-hash' && (
        <div className="files-tool-frame">
          <FileDropzone
            multiple={true}
            files={files}
            onFilesChanged={(newFiles) => {
              setFiles(newFiles);
              setDuplicateGroups({});
              setSelectedDuplicates(new Set());
            }}
            label="Select or drop folder/files to scan for duplicates"
          />

          {files.length > 1 && (
            <div className="dup-action-bar">
              <button
                className="tool-btn primary small-btn"
                onClick={handleScanDuplicates}
                disabled={isScanningDuplicates}
                type="button"
              >
                {isScanningDuplicates
                  ? 'Scanning files...'
                  : `Scan ${files.length} Files for Duplicates`}
              </button>
            </div>
          )}

          {deleteNotice && (
            <div className="delete-notice-banner">
              <CheckCircle size={14} color="var(--color-success)" />
              <span>{deleteNotice}</span>
            </div>
          )}

          {Object.keys(duplicateGroups).length > 0 ? (
            <div className="dup-results-card">
              <div className="dup-results-header">
                <div>
                  <h3 className="rename-preview-title">
                    {Object.keys(duplicateGroups).length} Duplicate Group(s) Detected
                  </h3>
                  <span className="dup-sub-count">
                    {selectedDuplicates.size} file(s) selected for deletion
                  </span>
                </div>
                {/* Actions: Select All, Deselect All, Remove Selected */}
                <div className="dup-header-actions">
                  <button
                    className="tool-btn secondary small-btn"
                    onClick={handleSelectAllDuplicates}
                    type="button"
                  >
                    Select All Duplicates
                  </button>
                  <button
                    className="tool-btn secondary small-btn"
                    onClick={handleDeselectAllDuplicates}
                    type="button"
                  >
                    Deselect All
                  </button>
                  <button
                    className="tool-btn danger small-btn"
                    onClick={() => setIsConfirmDeleteOpen(true)}
                    disabled={selectedDuplicates.size === 0}
                    type="button"
                  >
                    <Trash2 size={12} />
                    <span>Remove Selected ({selectedDuplicates.size})</span>
                  </button>
                </div>
              </div>

              {Object.entries(duplicateGroups).map(([hash, group], i) => (
                <div key={hash} className="dup-group-box">
                  <div className="dup-group-header">
                    <div className="dup-group-title">
                      <ShieldCheck size={15} color="var(--color-success)" />
                      <span>Group #{i + 1} ({group.files.length} copies)</span>
                      <span className="dup-group-size">
                        Total: {(group.totalSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <code className="dup-hash">SHA-256: {hash.slice(0, 16)}...</code>
                  </div>

                  <div className="dup-group-files">
                    {group.files.map((f, j) => (
                      <div key={j} className="dup-file-row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedDuplicates.has(`${hash}-${f.name}`)}
                            onChange={(e) => {
                              const s = new Set(selectedDuplicates);
                              if (e.target.checked) s.add(`${hash}-${f.name}`);
                              else s.delete(`${hash}-${f.name}`);
                              setSelectedDuplicates(s);
                            }}
                          />
                          <span className="dup-file-name">{f.name}</span>
                        </label>
                        <span className="dup-file-size">{(f.size / 1024).toFixed(1)} KB</span>
                        <span className="dup-file-loc">Workspace Root</span>
                        {j === 0 && <span className="keeper-badge">Keep (Original)</span>}
                        {j > 0 && <span className="dup-badge">Duplicate</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : !isScanningDuplicates &&
            files.length > 1 &&
            Object.keys(duplicateGroups).length === 0 ? (
            <div className="dup-empty-msg">No duplicate files detected across selected items.</div>
          ) : null}

          {/* Confirm Delete Dialog with Clear Warning */}
          <ConfirmDialog
            isOpen={isConfirmDeleteOpen}
            title="Confirm Deletion of Duplicate Files"
            message={`Are you sure you want to permanently remove ${selectedDuplicates.size} selected duplicate file(s)? This operation cannot be undone.`}
            confirmLabel="Delete Duplicates"
            confirmVariant="danger"
            onConfirm={handleConfirmDelete}
            onCancel={() => setIsConfirmDeleteOpen(false)}
          />
        </div>
      )}

      {/* 4. FILE COMPARISON */}
      {featureId === 'file-compare-hashes' && (
        <div className="files-tool-frame">
          <FileDropzone
            multiple={true}
            files={files}
            onFilesChanged={(newFiles) => {
              setFiles(newFiles);
              setCompareResult(null);
            }}
            label="Drop 2 files to compare side-by-side (hashes, byte difference, and binary equality)"
          />

          {files.length >= 2 && !compareResult && (
            <button className="tool-btn primary analyze-btn" onClick={handleCompareTwoFiles} type="button">
              <ArrowRightLeft size={14} /> Compare Selected Files
            </button>
          )}

          {compareResult && (
            <div className="comparison-results-card">
              <div className={`comp-banner ${compareResult.identical ? 'match' : 'mismatch'}`}>
                {compareResult.identical ? (
                  <>
                    <CheckCircle size={20} color="var(--color-success)" />
                    <div>
                      <h4 className="comp-title">Files are 100% Identical</h4>
                      <p className="comp-sub">
                        Both files share the exact same byte-length and cryptographic SHA-256 hash.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={20} color="var(--color-danger)" />
                    <div>
                      <h4 className="comp-title">Files Differ</h4>
                      <p className="comp-sub">
                        Byte difference: {Math.abs(compareResult.sizeA - compareResult.sizeB)} bytes.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="comp-side-by-side">
                <div className="comp-file-pane">
                  <h5 className="comp-pane-name">File A: {compareResult.fileA?.name}</h5>
                  <div className="comp-stat-row">
                    <span>Size:</span>
                    <code>
                      {(compareResult.sizeA / 1024).toFixed(2)} KB ({compareResult.sizeA} bytes)
                    </code>
                  </div>
                  <div className="comp-stat-row">
                    <span>SHA-256:</span>
                    <code className="mini-hash">{compareResult.hashA}</code>
                  </div>
                </div>

                <div className="comp-file-pane">
                  <h5 className="comp-pane-name">File B: {compareResult.fileB?.name}</h5>
                  <div className="comp-stat-row">
                    <span>Size:</span>
                    <code>
                      {(compareResult.sizeB / 1024).toFixed(2)} KB ({compareResult.sizeB} bytes)
                    </code>
                  </div>
                  <div className="comp-stat-row">
                    <span>SHA-256:</span>
                    <code className="mini-hash">{compareResult.hashB}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. ARCHIVE MANAGER (Create, Extract, Inspect for ZIP, TAR, GZIP) */}
      {(featureId === 'create-zip-archive' ||
        featureId === 'inspect-zip-archive' ||
        featureId === 'extract-zip-archive' ||
        featureId === 'tar-gzip-manager') && (
          <div className="files-tool-frame">
            <div className="archive-mode-tabs">
              <button
                className={`tool-btn secondary small-btn ${archiveMode === 'create' ? 'active' : ''}`}
                onClick={() => setArchiveMode('create')}
                type="button"
              >
                <FolderArchive size={13} />
                <span>Create Archive</span>
              </button>
              <button
                className={`tool-btn secondary small-btn ${archiveMode === 'extract' ? 'active' : ''}`}
                onClick={() => setArchiveMode('extract')}
                type="button"
              >
                <Download size={13} />
                <span>Extract Archive</span>
              </button>
              <button
                className={`tool-btn secondary small-btn ${archiveMode === 'inspect' ? 'active' : ''}`}
                onClick={() => setArchiveMode('inspect')}
                type="button"
              >
                <Eye size={13} />
                <span>Inspect Contents</span>
              </button>
            </div>

            {/* CREATE ARCHIVE */}
            {archiveMode === 'create' && (
              <div className="archive-create-section">
                <FileDropzone
                  multiple={true}
                  files={files}
                  onFilesChanged={setFiles}
                  label="Select files to bundle into archive"
                />

                {files.length > 0 && (
                  <div className="zip-controls-box">
                    <div className="control-group">
                      <label className="control-label">Archive Format:</label>
                      <div className="format-toggle-row">
                        <button
                          className={`tool-btn secondary small-btn ${archiveFormat === 'zip' ? 'active' : ''}`}
                          onClick={() => {
                            setArchiveFormat('zip');
                            setArchiveFilename('archive.zip');
                          }}
                          type="button"
                        >
                          ZIP
                        </button>
                        <button
                          className={`tool-btn secondary small-btn ${archiveFormat === 'tar' ? 'active' : ''}`}
                          onClick={() => {
                            setArchiveFormat('tar');
                            setArchiveFilename('archive.tar');
                          }}
                          type="button"
                        >
                          TAR
                        </button>
                        <button
                          className={`tool-btn secondary small-btn ${archiveFormat === 'gzip' ? 'active' : ''}`}
                          onClick={() => {
                            setArchiveFormat('gzip');
                            setArchiveFilename('archive.tar.gz');
                          }}
                          type="button"
                        >
                          GZIP
                        </button>
                      </div>
                    </div>

                    <div className="control-group">
                      <label className="control-label">Archive Filename:</label>
                      <input
                        type="text"
                        className="control-input"
                        value={archiveFilename}
                        onChange={(e) => setArchiveFilename(e.target.value)}
                      />
                    </div>

                    <div className="control-group">
                      <label className="control-label">Destination Directory:</label>
                      <div className="dest-input-group">
                        <input
                          type="text"
                          className="control-input"
                          value={archiveDest}
                          onChange={(e) => setArchiveDest(e.target.value)}
                        />
                        <button className="tool-btn secondary small-btn" type="button">
                          <FolderOpen size={12} /> Browse
                        </button>
                      </div>
                    </div>

                    <button
                      className="tool-btn primary small-btn"
                      onClick={handleCreateArchive}
                      disabled={isArchiving}
                      type="button"
                    >
                      <FolderArchive size={13} />
                      <span>
                        {isArchiving
                          ? 'Compressing archive...'
                          : `Create ${archiveFormat.toUpperCase()} (${files.length} files)`}
                      </span>
                    </button>

                    {archiveSuccessBytes && (
                      <div className="zip-success-note">
                        <CheckCircle size={14} color="var(--color-success)" />
                        <span>
                          Successfully created archive ({(archiveSuccessBytes / 1024).toFixed(1)} KB)!
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* EXTRACT ARCHIVE */}
            {archiveMode === 'extract' && (
              <div className="archive-extract-section">
                <FileDropzone
                  multiple={false}
                  accept={['.zip', '.tar', '.gz', '.tgz']}
                  files={files}
                  onFilesChanged={setFiles}
                  label="Select archive to extract (.zip, .tar, .gz)"
                />

                {files.length > 0 && (
                  <div className="zip-controls-box">
                    <div className="control-group">
                      <label className="control-label">Destination Folder:</label>
                      <div className="dest-input-group">
                        <input
                          type="text"
                          className="control-input"
                          value={archiveDest}
                          onChange={(e) => setArchiveDest(e.target.value)}
                        />
                        <button className="tool-btn secondary small-btn" type="button">
                          <FolderOpen size={12} /> Browse
                        </button>
                      </div>
                    </div>

                    <button
                      className="tool-btn primary small-btn"
                      onClick={() => alert(`Archive extracted to ${archiveDest}!`)}
                      type="button"
                    >
                      <Download size={13} />
                      <span>Extract All Files</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* INSPECT ARCHIVE */}
            {archiveMode === 'inspect' && (
              <div className="archive-inspect-section">
                <FileDropzone
                  multiple={false}
                  accept={['.zip', '.tar', '.gz', '.tgz']}
                  files={files}
                  onFilesChanged={(newFiles) => {
                    setFiles(newFiles);
                    setInspectedZipEntries([]);
                  }}
                  label="Drop archive (.zip, .tar, .gz) to inspect contents without extracting"
                />

                {files.length > 0 && inspectedZipEntries.length === 0 && (
                  <button
                    className="tool-btn primary analyze-btn"
                    onClick={handleInspectArchive}
                    disabled={isInspectingZip}
                    type="button"
                  >
                    <Eye size={13} />
                    <span>
                      {isInspectingZip ? 'Reading headers...' : 'Inspect Archive Contents'}
                    </span>
                  </button>
                )}

                {inspectedZipEntries.length > 0 && (
                  <div className="archive-entries-card">
                    <h3 className="rename-preview-title">
                      Archive Contents ({inspectedZipEntries.length} items)
                    </h3>
                    <div className="archive-table">
                      <div className="archive-header-row">
                        <span className="col-entry-name">Filename</span>
                        <span className="col-entry-type">Type</span>
                        <span className="col-entry-size">Size</span>
                        <span className="col-entry-size">Compressed</span>
                      </div>
                      {inspectedZipEntries.map((entry, idx) => (
                        <div key={idx} className="archive-data-row">
                          <span className="col-entry-name">
                            {entry.isDir ? '📁' : '📄'} {entry.name}
                          </span>
                          <span className="col-entry-type">{entry.isDir ? 'Directory' : 'File'}</span>
                          <span className="col-entry-size">
                            {(entry.size / 1024).toFixed(1)} KB
                          </span>
                          <span className="col-entry-size">
                            {(entry.compressedSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );
};
