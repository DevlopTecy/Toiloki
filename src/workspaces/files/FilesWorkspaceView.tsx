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
  utilityId: string;
}

export const FilesWorkspaceView: React.FC<FilesWorkspaceViewProps> = ({ utilityId }) => {
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
  const [renameNotice, setRenameNotice] = useState<string | null>(null);

  const renamePreview = useMemo(() => {
    if (files.length === 0) return [];
    const names = files.map((f) => f.name);
    const rule: RenameRule = {
      ...renameRule,
      numberingStart: useNumbering ? renameRule.numberingStart ?? 1 : undefined,
    };
    return FileOpsEngine.applyBatchRename(names, rule).data || [];
  }, [files, renameRule, useNumbering]);

  const handleApplyRename = () => {
    if (files.length === 0 || renamePreview.length === 0) return;
    const updatedFiles = files.map((f, i) => {
      const prev = renamePreview[i];
      return {
        ...f,
        name: prev ? prev.renamed : f.name,
      };
    });
    setFiles(updatedFiles);
    setRenameNotice(`Renamed ${updatedFiles.length} file(s) in place.`);
    setTimeout(() => setRenameNotice(null), 3000);
    HistoryService.record({
      toolName: 'Batch Rename',
      workspaceId: 'files',
      groupId: 'files-operations',
      utilityId: 'batch-rename-files',
      input: `${files.length} files`,
      output: `Batch rename applied`,
      status: 'completed',
    });
  };

  const handleDownloadRenamedZip = async () => {
    if (files.length === 0 || renamePreview.length === 0) return;
    const valid = files
      .map((f, i) => ({
        name: renamePreview[i]?.renamed || f.name,
        buffer: f.buffer || new Uint8Array(),
      }))
      .filter((f) => f.buffer.length > 0);

    const zipRes = await ArchiveEngine.createZip(valid);
    if (zipRes.success && zipRes.data) {
      const blob = new Blob([zipRes.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'renamed_files.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

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
      groupId: 'files-analyzer',
      utilityId: 'file-type-detection',
      input: `${files.length} files`,
      output: `Analyzed MIME signatures and SHA-256`,
      status: 'completed',
    });
  };

  const handleExportChecksums = () => {
    if (fileAnalysisList.length === 0) return;
    const manifestItems = fileAnalysisList.map((item) => ({
      name: item.file.name,
      hash: item.sha256,
    }));
    const text = FileOpsEngine.formatChecksumManifest(manifestItems);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'checksums.sha256';
    a.click();
    URL.revokeObjectURL(url);
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
  const [wastedBytesTotal, setWastedBytesTotal] = useState<number>(0);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const handleScanDuplicates = async () => {
    if (files.length < 2) return;
    setIsScanningDuplicates(true);

    const dupRes = await FileOpsEngine.findDuplicates(files);
    if (dupRes.success && dupRes.data) {
      const actualDuplicates: Record<
        string,
        { hash: string; files: SelectedFile[]; totalSize: number }
      > = {};

      for (const group of dupRes.data.groups) {
        const matchedFiles = group.files.map((gf) => files[gf.index]).filter(Boolean);
        actualDuplicates[group.hash] = {
          hash: group.hash,
          files: matchedFiles,
          totalSize: matchedFiles.reduce((acc, curr) => acc + curr.size, 0),
        };
      }

      setDuplicateGroups(actualDuplicates);
      setWastedBytesTotal(dupRes.data.totalWastedBytes);
      HistoryService.record({
        toolName: 'Duplicate Finder',
        workspaceId: 'files',
        groupId: 'files-duplicate',
        utilityId: 'find-duplicates',
        input: `${files.length} files scanned`,
        output: `Found ${dupRes.data.groups.length} duplicate groups (${(dupRes.data.totalWastedBytes / 1024).toFixed(1)} KB reclaimable)`,
        status: 'completed',
      });
    }

    setIsScanningDuplicates(false);
  };

  const handleSelectAllDuplicates = () => {
    const s = new Set<string>();
    Object.values(duplicateGroups).forEach((group) => {
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
    setDeleteNotice(`Cleaned ${count} duplicate file(s) from view.`);
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

  const [extractedFiles, setExtractedFiles] = useState<
    Array<{ name: string; buffer: Uint8Array; size: number }>
  >([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  React.useEffect(() => {
    if (utilityId === 'extract-zip-archive') {
      setArchiveMode('extract');
    } else if (utilityId === 'inspect-zip-archive') {
      setArchiveMode('inspect');
    } else if (utilityId === 'create-zip-archive') {
      setArchiveMode('create');
      setArchiveFormat('zip');
    } else if (utilityId === 'tar-gzip-manager') {
      setArchiveMode('create');
      setArchiveFormat('tar');
      setArchiveFilename('archive.tar');
    }
  }, [utilityId]);

  const handleCreateArchive = async () => {
    if (files.length === 0) return;
    setIsArchiving(true);
    const validFiles = files
      .filter((f) => f.buffer)
      .map((f) => ({ name: f.name, buffer: f.buffer! }));

    let res: { success: boolean; data?: Uint8Array; error?: string };

    if (archiveFormat === 'tar') {
      res = ArchiveEngine.createTar(validFiles);
    } else if (archiveFormat === 'gzip') {
      if (validFiles.length === 1) {
        res = await ArchiveEngine.createGzip(validFiles[0].buffer);
      } else {
        const tarRes = ArchiveEngine.createTar(validFiles);
        if (!tarRes.success || !tarRes.data) {
          res = { success: false, error: tarRes.error || 'Failed to create TAR' };
        } else {
          res = await ArchiveEngine.createGzip(tarRes.data);
        }
      }
    } else {
      res = await ArchiveEngine.createZip(validFiles);
    }

    setIsArchiving(false);

    if (res.success && res.data) {
      setArchiveSuccessBytes(res.data.length);
      const ext =
        archiveFormat === 'zip'
          ? '.zip'
          : archiveFormat === 'tar'
          ? '.tar'
          : validFiles.length === 1
          ? '.gz'
          : '.tar.gz';
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
        groupId: 'files-archive',
        utilityId: 'create-zip-archive',
        input: `${validFiles.length} files`,
        output: `${outName} created (${((res.data.length || 0) / 1024).toFixed(1)} KB)`,
        status: 'completed',
      });
    }
  };

  const handleInspectArchive = async () => {
    const file = files[0];
    if (!file || !file.buffer) return;
    setIsInspectingZip(true);
    let res: { success: boolean; data?: ArchiveEntry[]; error?: string };

    if (file.name.endsWith('.tar')) {
      res = ArchiveEngine.inspectTar(file.buffer);
    } else {
      res = await ArchiveEngine.inspectZip(file.buffer);
    }

    setIsInspectingZip(false);
    if (res.success && res.data) {
      setInspectedZipEntries(res.data);
    }
  };

  const handleExtractArchive = async () => {
    const file = files[0];
    if (!file || !file.buffer) return;
    const buf = file.buffer;
    setIsExtracting(true);
    setExtractError(null);
    try {
      let res: {
        success: boolean;
        data?: Array<{ name: string; buffer: Uint8Array }>;
        error?: string;
      };

      if (file.name.endsWith('.tar')) {
        res = ArchiveEngine.extractTar(buf);
      } else if (file.name.endsWith('.tar.gz') || file.name.endsWith('.tgz')) {
        const decomp = await ArchiveEngine.decompressGzip(buf);
        if (!decomp.success || !decomp.data)
          throw new Error(decomp.error || 'Failed to decompress GZIP');
        res = ArchiveEngine.extractTar(decomp.data);
      } else if (file.name.endsWith('.gz')) {
        const decomp = await ArchiveEngine.decompressGzip(buf);
        if (!decomp.success || !decomp.data)
          throw new Error(decomp.error || 'Failed to decompress GZIP');
        const uncompressedName = file.name.replace(/\.gz$/, '') || 'extracted_data';
        res = { success: true, data: [{ name: uncompressedName, buffer: decomp.data }] };
      } else {
        res = await ArchiveEngine.extractZip(buf);
      }

      if (res.success && res.data) {
        const mapped = res.data.map((item) => ({
          name: item.name,
          buffer: item.buffer,
          size: item.buffer.length,
        }));
        setExtractedFiles(mapped);
        HistoryService.record({
          toolName: 'Archive Extractor',
          workspaceId: 'files',
          groupId: 'files-archive',
          utilityId: 'extract-zip-archive',
          input: file.name,
          output: `Extracted ${mapped.length} files (${((file.size || 0) / 1024).toFixed(1)} KB)`,
          status: 'completed',
        });
      } else {
        setExtractError(res.error || 'Failed to extract archive');
      }
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownloadExtractedItem = (item: { name: string; buffer: Uint8Array }) => {
    const blob = new Blob([item.buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name.split('/').pop() || item.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllExtracted = async () => {
    if (extractedFiles.length === 0) return;
    const res = await ArchiveEngine.createZip(extractedFiles);
    if (res.success && res.data) {
      const blob = new Blob([res.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extracted_bundle.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="files-workspace-view">
      {/* 1. BATCH RENAME */}
      {utilityId === 'batch-rename-files' && (
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
                    <option value="kebab">kebab-case</option>
                    <option value="snake">snake_case</option>
                  </select>
                </div>
                <div className="control-group checkbox-align">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={renameRule.useRegex || false}
                      onChange={(e) =>
                        setRenameRule({ ...renameRule, useRegex: e.target.checked })
                      }
                    />
                    Use RegEx Pattern
                  </label>
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

              {renameNotice && (
                <div className="delete-notice-banner">
                  <CheckCircle size={14} color="var(--success)" />
                  <span>{renameNotice}</span>
                </div>
              )}

              {/* Preview Table */}
              <div className="rename-preview-card">
                <div className="rename-preview-header">
                  <h3 className="rename-preview-title">
                    Renaming Preview ({renamePreview.length} files)
                  </h3>
                  <div className="dup-header-actions">
                    <button
                      className="tool-btn primary small-btn"
                      onClick={handleApplyRename}
                      type="button"
                    >
                      Apply Renaming
                    </button>
                    <button
                      className="tool-btn secondary small-btn"
                      onClick={handleDownloadRenamedZip}
                      type="button"
                    >
                      <Download size={12} />
                      <span>Download ZIP</span>
                    </button>
                  </div>
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
      {(utilityId === 'file-type-detection' ||
        utilityId === 'file-metadata-ops' ||
        utilityId === 'file-analyzer-full') && (
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
                <div className="rename-preview-header">
                  <h3 className="rename-preview-title">
                    File Information Matrix ({fileAnalysisList.length} files)
                  </h3>
                  <button
                    className="tool-btn secondary small-btn"
                    onClick={handleExportChecksums}
                    type="button"
                  >
                    <Download size={12} />
                    <span>Export Checksums (.sha256)</span>
                  </button>
                </div>
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
                          <span className="info-td">{item.typeInfo.mime}</span>
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
      {utilityId === 'duplicate-finder-hash' && (
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
              <CheckCircle size={14} color="var(--success)" />
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
                    {selectedDuplicates.size} file(s) selected for deletion • {(wastedBytesTotal / 1024).toFixed(1)} KB reclaimable
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
                      <ShieldCheck size={15} color="var(--success)" />
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
      {utilityId === 'file-compare-hashes' && (
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
                    <CheckCircle size={20} color="var(--success)" />
                    <div>
                      <h4 className="comp-title">Files are 100% Identical</h4>
                      <p className="comp-sub">
                        Both files share the exact same byte-length and cryptographic SHA-256 hash.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={20} color="var(--danger)" />
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
      {(utilityId === 'create-zip-archive' ||
        utilityId === 'inspect-zip-archive' ||
        utilityId === 'extract-zip-archive' ||
        utilityId === 'tar-gzip-manager') && (
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
                        <CheckCircle size={14} color="var(--success)" />
                        <span>
                          Created archive ({(archiveSuccessBytes / 1024).toFixed(1)} KB)
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
                      onClick={handleExtractArchive}
                      disabled={isExtracting}
                      type="button"
                    >
                      <Download size={13} />
                      <span>{isExtracting ? 'Extracting archive...' : 'Extract All Files'}</span>
                    </button>

                    {extractError && (
                      <div className="error-notice-banner" style={{ marginTop: '10px' }}>
                        <XCircle size={14} color="var(--danger)" />
                        <span>{extractError}</span>
                      </div>
                    )}

                    {extractedFiles.length > 0 && (
                      <div className="archive-entries-card" style={{ marginTop: '14px' }}>
                        <div className="rename-preview-header">
                          <h3 className="rename-preview-title">
                            Extracted Files ({extractedFiles.length} items)
                          </h3>
                          <button
                            className="tool-btn secondary small-btn"
                            onClick={handleDownloadAllExtracted}
                            type="button"
                          >
                            <Download size={12} />
                            <span>Download All as ZIP</span>
                          </button>
                        </div>
                        <div className="archive-table">
                          <div className="archive-header-row">
                            <span className="col-entry-name">Filename</span>
                            <span className="col-entry-size">Size</span>
                            <span className="col-action">Action</span>
                          </div>
                          {extractedFiles.map((item, idx) => (
                            <div key={idx} className="archive-data-row">
                              <span className="col-entry-name" title={item.name}>
                                📄 {item.name}
                              </span>
                              <span className="col-entry-size">
                                {(item.size / 1024).toFixed(1)} KB
                              </span>
                              <span className="col-action">
                                <button
                                  className="tool-btn secondary small-btn"
                                  onClick={() => handleDownloadExtractedItem(item)}
                                  type="button"
                                  title="Download extracted file"
                                >
                                  <Download size={11} /> Save
                                </button>
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
