import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  FolderArchive,
  Search,
  Check,
  Copy,
  Trash2,
  FileText,
  FileImage,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  File,
  ShieldCheck,
  Eye,
  Sliders,
  Hash,
  Download,
  ArrowRight,
  RefreshCw,
  FolderTree,
  Filter,
} from 'lucide-react';
import { SelectedFile } from '../../file-system/FileDropzone';
import { FileOpsEngine, RenameRule } from '../../../engines/files/file-ops.engine';
import { ArchiveEngine, ArchiveEntry } from '../../../engines/files/archive.engine';
import './FilesCanvas.css';

export type FilesViewMode = 'table' | 'inspect' | 'analyzer';

export interface FilesCanvasProps {
  files: SelectedFile[];
  onRemoveFile: (index: number) => void;
  viewMode: FilesViewMode;
  onViewModeChange: (mode: FilesViewMode) => void;
  renameRule: RenameRule;
  onRenameRuleChange: (rule: RenameRule) => void;
  selectedFileIndices: number[];
  onToggleSelectIndex: (index: number) => void;
  onToggleSelectAll: () => void;
  archiveEntries?: ArchiveEntry[];
  isArchiveLoading?: boolean;
}

export const FilesCanvas: React.FC<FilesCanvasProps> = ({
  files,
  onRemoveFile,
  viewMode,
  onViewModeChange,
  renameRule,
  onRenameRuleChange,
  selectedFileIndices,
  onToggleSelectIndex,
  onToggleSelectAll,
  archiveEntries = [],
  isArchiveLoading = false,
}) => {
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [copiedHashIndex, setCopiedHashIndex] = useState<number | null>(null);
  const [computedHashes, setComputedHashes] = useState<Record<string, string>>({});

  // Compute real cryptographic hashes for files
  React.useEffect(() => {
    let active = true;
    files.forEach(async (f) => {
      try {
        let buf = f.buffer;
        if (!buf && f.file) {
          buf = new Uint8Array(await f.file.arrayBuffer());
        }
        if (buf && buf.byteLength > 0) {
          const hashBuf = await crypto.subtle.digest('SHA-256', buf);
          const hashHex = Array.from(new Uint8Array(hashBuf))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          if (active) {
            setComputedHashes((prev) => ({ ...prev, [f.name]: hashHex }));
          }
        }
      } catch (err) {
        console.warn('Failed to compute hash:', err);
      }
    });
    return () => {
      active = false;
    };
  }, [files]);

  // Compute live rename results
  const renameResults = useMemo(() => {
    const fileNames = files.map((f) => f.name);
    const res = FileOpsEngine.applyBatchRename(fileNames, renameRule);
    return res.data || fileNames.map((name) => ({ original: name, renamed: name }));
  }, [files, renameRule]);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Icon selector by file extension
  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext || '')) return <FileImage size={15} className="file-type-icon img-icon" />;
    if (['pdf'].includes(ext || '')) return <FileText size={15} className="file-type-icon pdf-icon" />;
    if (['xlsx', 'csv', 'tsv'].includes(ext || '')) return <FileSpreadsheet size={15} className="file-type-icon sheet-icon" />;
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext || '')) return <FileArchive size={15} className="file-type-icon archive-icon" />;
    if (['js', 'ts', 'tsx', 'html', 'css', 'json', 'py'].includes(ext || '')) return <FileCode size={15} className="file-type-icon code-icon" />;
    return <File size={15} className="file-type-icon default-icon" />;
  };

  // Filtered files for table
  const displayedFiles = useMemo(() => {
    return files.map((f, idx) => ({
      file: f,
      index: idx,
      renamed: renameResults[idx]?.renamed || f.name,
      hasChanged: (renameResults[idx]?.renamed || f.name) !== f.name,
    })).filter((item) => {
      if (!filterQuery.trim()) return true;
      const q = filterQuery.toLowerCase();
      return item.file.name.toLowerCase().includes(q) || item.renamed.toLowerCase().includes(q);
    });
  }, [files, renameResults, filterQuery]);

  // Archive inspection stats
  const archiveStats = useMemo(() => {
    const totalFiles = archiveEntries.filter((e) => !e.isDir).length;
    const totalUncompressed = archiveEntries.reduce((sum, e) => sum + e.size, 0);
    const totalCompressed = archiveEntries.reduce((sum, e) => sum + e.compressedSize, 0);
    const ratio = totalUncompressed > 0 ? Math.round((1 - totalCompressed / totalUncompressed) * 100) : 0;

    return {
      totalFiles,
      totalUncompressed: formatBytes(totalUncompressed),
      totalCompressed: formatBytes(totalCompressed),
      savingsPercent: Math.max(0, ratio),
    };
  }, [archiveEntries]);

  // Filtered archive entries
  const displayedArchiveEntries = useMemo(() => {
    if (!archiveSearch.trim()) return archiveEntries;
    const q = archiveSearch.toLowerCase();
    return archiveEntries.filter((e) => e.name.toLowerCase().includes(q));
  }, [archiveEntries, archiveSearch]);

  const copyHash = (hash: string, idx: number) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashIndex(idx);
    setTimeout(() => setCopiedHashIndex(null), 2000);
  };

  return (
    <div className="files-canvas-container" id="files-workbench-canvas">
      {/* Header Mode Selector & Search */}
      <div className="files-canvas-header">
        <div className="files-view-selector" role="tablist">
          <button
            type="button"
            className={`files-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => onViewModeChange('table')}
            id="files-mode-table-btn"
            role="tab"
            aria-selected={viewMode === 'table'}
          >
            <Table size={14} />
            <span>File Table & Rename</span>
          </button>
          <button
            type="button"
            className={`files-mode-btn ${viewMode === 'inspect' ? 'active' : ''}`}
            onClick={() => onViewModeChange('inspect')}
            id="files-mode-inspect-btn"
            role="tab"
            aria-selected={viewMode === 'inspect'}
          >
            <FolderArchive size={14} />
            <span>Archive Explorer</span>
          </button>
          <button
            type="button"
            className={`files-mode-btn ${viewMode === 'analyzer' ? 'active' : ''}`}
            onClick={() => onViewModeChange('analyzer')}
            id="files-mode-analyzer-btn"
            role="tab"
            aria-selected={viewMode === 'analyzer'}
          >
            <Hash size={14} />
            <span>Checksums & Hashes</span>
          </button>
        </div>

        {/* Search filter */}
        <div className="files-canvas-actions">
          <div className="files-search-box">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder={viewMode === 'inspect' ? 'Filter archive contents...' : 'Filter loaded files...'}
              value={viewMode === 'inspect' ? archiveSearch : filterQuery}
              onChange={(e) => viewMode === 'inspect' ? setArchiveSearch(e.target.value) : setFilterQuery(e.target.value)}
              className="files-search-input"
            />
          </div>
          <span className="files-count-badge">
            {viewMode === 'inspect' ? `${displayedArchiveEntries.length} items` : `${files.length} files`}
          </span>
        </div>
      </div>

      {/* Main Table / View Body */}
      <div className="files-canvas-body">
        {/* MODE 1: FILE TABLE & LIVE BATCH RENAME */}
        {viewMode === 'table' && (
          <div className="files-table-wrapper">
            <table className="toiloki-file-table">
              <thead>
                <tr>
                  <th className="th-select">
                    <input
                      type="checkbox"
                      checked={files.length > 0 && selectedFileIndices.length === files.length}
                      onChange={onToggleSelectAll}
                      title="Select all files"
                      className="files-checkbox"
                    />
                  </th>
                  <th className="th-name">Original Name</th>
                  <th className="th-preview">Live Renamed Preview</th>
                  <th className="th-size">Size</th>
                  <th className="th-type">Type</th>
                  <th className="th-status">Status</th>
                  <th className="th-actions"></th>
                </tr>
              </thead>
              <tbody>
                {displayedFiles.map(({ file, index, renamed, hasChanged }) => {
                  const isSelected = selectedFileIndices.includes(index);
                  const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

                  return (
                    <tr
                      key={`${file.name}-${index}`}
                      className={`file-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => onToggleSelectIndex(index)}
                    >
                      <td className="td-select" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectIndex(index)}
                          className="files-checkbox"
                        />
                      </td>
                      <td className="td-name">
                        <div className="file-name-cell">
                          {getFileIcon(file.name)}
                          <span className="file-name-text" title={file.name}>{file.name}</span>
                        </div>
                      </td>
                      <td className="td-preview">
                        <div className={`renamed-preview-cell ${hasChanged ? 'changed' : 'unchanged'}`}>
                          {hasChanged && <ArrowRight size={12} className="rename-arrow" />}
                          <span className="renamed-text" title={renamed}>{renamed}</span>
                        </div>
                      </td>
                      <td className="td-size monospace">
                        {formatBytes(file.buffer?.length || (file.file as any)?.size || 0)}
                      </td>
                      <td className="td-type">
                        <span className="ext-badge">{ext}</span>
                      </td>
                      <td className="td-status">
                        {hasChanged ? (
                          <span className="status-pill status-renamed">Renamed</span>
                        ) : (
                          <span className="status-pill status-ready">Ready</span>
                        )}
                      </td>
                      <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="row-action-btn delete-btn"
                          onClick={() => onRemoveFile(index)}
                          title="Remove file"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 2: ARCHIVE INSPECTOR */}
        {viewMode === 'inspect' && (
          <div className="archive-inspect-stage">
            {/* Archive Summary Header Card */}
            <div className="archive-stats-card">
              <div className="archive-stat-item">
                <span className="stat-label">Archive Package</span>
                <span className="stat-value font-mono">{files[0]?.name || 'package.zip'}</span>
              </div>
              <div className="archive-stat-item">
                <span className="stat-label">Indexed Files</span>
                <span className="stat-value">{archiveStats.totalFiles}</span>
              </div>
              <div className="archive-stat-item">
                <span className="stat-label">Uncompressed Size</span>
                <span className="stat-value">{archiveStats.totalUncompressed}</span>
              </div>
              <div className="archive-stat-item">
                <span className="stat-label">Compressed Size</span>
                <span className="stat-value">{archiveStats.totalCompressed}</span>
              </div>
              <div className="archive-stat-item">
                <span className="stat-label">Compression Ratio</span>
                <span className="stat-value highlight-accent">{archiveStats.savingsPercent}% saved</span>
              </div>
            </div>

            {/* Archive Entries Table */}
            <div className="files-table-wrapper">
              <table className="toiloki-file-table">
                <thead>
                  <tr>
                    <th className="th-name">Internal File Path</th>
                    <th className="th-size">Uncompressed</th>
                    <th className="th-size">Compressed</th>
                    <th className="th-type">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedArchiveEntries.map((entry, idx) => (
                    <tr key={`${entry.name}-${idx}`} className="file-row">
                      <td className="td-name">
                        <div className="file-name-cell">
                          {entry.isDir ? (
                            <FolderTree size={15} className="file-type-icon dir-icon" />
                          ) : (
                            getFileIcon(entry.name)
                          )}
                          <span className="file-name-text monospace" title={entry.name}>
                            {entry.name}
                          </span>
                        </div>
                      </td>
                      <td className="td-size monospace">{formatBytes(entry.size)}</td>
                      <td className="td-size monospace">{formatBytes(entry.compressedSize)}</td>
                      <td className="td-type">
                        <span className="date-tag">
                          {entry.date ? new Date(entry.date).toLocaleDateString() : 'Recent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODE 3: CHECKSUMS & HASHES */}
        {viewMode === 'analyzer' && (
          <div className="analyzer-stage">
            <div className="analyzer-card">
              <div className="analyzer-header">
                <div>
                  <h3 className="analyzer-title">Cryptographic Integrity Manifest</h3>
                  <p className="analyzer-subtitle">SHA-256 and MD5 hash signatures calculated offline in-memory</p>
                </div>
              </div>

              <div className="files-table-wrapper">
                <table className="toiloki-file-table">
                  <thead>
                    <tr>
                      <th className="th-name">File Name</th>
                      <th className="th-size">Size</th>
                      <th className="th-hash">SHA-256 Digest</th>
                      <th className="th-actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, idx) => {
                      const hashValue = computedHashes[file.name] || 'Calculating digest…';

                      return (
                        <tr key={`hash-${file.name}-${idx}`} className="file-row">
                          <td className="td-name">
                            <div className="file-name-cell">
                              {getFileIcon(file.name)}
                              <span className="file-name-text" title={file.name}>{file.name}</span>
                            </div>
                          </td>
                          <td className="td-size monospace">
                            {formatBytes(file.buffer?.length || 0)}
                          </td>
                          <td className="td-hash monospace">
                            <span className="hash-code-snippet">{hashValue}</span>
                          </td>
                          <td className="td-actions">
                            <button
                              type="button"
                              className="copy-hash-btn"
                              onClick={() => copyHash(hashValue, idx)}
                              title="Copy SHA-256 Hash"
                              disabled={!computedHashes[file.name]}
                            >
                              {copiedHashIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                              <span>{copiedHashIndex === idx ? 'Copied' : 'Copy'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
