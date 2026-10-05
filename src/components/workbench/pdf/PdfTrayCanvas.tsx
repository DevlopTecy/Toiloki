import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GripVertical,
  Trash2,
  FileText,
  Image as ImageIcon,
  Plus,
  GitCompare,
  Layers,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { SelectedFile } from '../../file-system/FileDropzone';
import { Button } from '../../common/Button';
import { parsePageRange, PageRangeParseResult } from '../../../engines/pdf/page-range.parser';
import { renderPageThumbnail } from './pdfThumbnailService';
import { plural } from '../../../core/utils/plural';
import './PdfTrayCanvas.css';

interface FileMeta {
  pageCount: number;
  thumbUrl?: string;
  loading: boolean;
}

interface PdfTrayCanvasProps {
  files: SelectedFile[];
  activeUtilityId: string;
  onFilesChange: (files: SelectedFile[]) => void;
  onAddMoreFiles: (newFiles: FileList | File[]) => void;
  fileRanges: Record<string, string>; // keyed by unique file identifier
  onFileRangeChange: (fileKey: string, range: string) => void;
  onValidationChange?: (hasErrors: boolean, totalResultPages: number) => void;
  compareResult?: {
    diffSummary: { addedWords: number; removedWords: number; identical: boolean };
    pageCountA: number;
    pageCountB: number;
  } | null;
}

export const PdfTrayCanvas: React.FC<PdfTrayCanvasProps> = ({
  files,
  activeUtilityId,
  onFilesChange,
  onAddMoreFiles,
  fileRanges,
  onFileRangeChange,
  onValidationChange,
  compareResult,
}) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [fileMetas, setFileMetas] = useState<Record<string, FileMeta>>({});
  const [activePickerFile, setActivePickerFile] = useState<SelectedFile | null>(null);
  const [pickerSelectedPages, setPickerSelectedPages] = useState<number[]>([]);
  const [pickerThumbnails, setPickerThumbnails] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCompareMode = activeUtilityId === 'pdf-compare-pdfs';
  const isImageMode = activeUtilityId === 'images-to-pdf';
  const isMergeMode = activeUtilityId === 'merge-pdf';

  const getFileKey = (file: SelectedFile): string => {
    return file.name;
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Inspect each file to get accurate numPages from PDF engine
  useEffect(() => {
    let isCancelled = false;

    files.forEach(async (file) => {
      const key = getFileKey(file);
      if (fileMetas[key]) return;

      let buffer = file.buffer;
      if (!buffer && file.file) {
        try {
          buffer = new Uint8Array(await file.file.arrayBuffer());
          file.buffer = buffer;
        } catch {}
      }

      if (buffer && !isImageMode) {
        try {
          const doc = await PDFDocument.load(buffer);
          const count = doc.getPageCount();

          // Load first page thumbnail
          let thumbUrl: string | undefined;
          try {
            const thumbRes = await renderPageThumbnail(buffer, 1, 96);
            if (thumbRes) thumbUrl = thumbRes.dataUrl;
          } catch {}

          if (!isCancelled) {
            setFileMetas((prev) => ({
              ...prev,
              [key]: { pageCount: count, thumbUrl, loading: false },
            }));
          }
        } catch {
          if (!isCancelled) {
            setFileMetas((prev) => ({
              ...prev,
              [key]: { pageCount: 1, loading: false },
            }));
          }
        }
      } else {
        if (!isCancelled) {
          setFileMetas((prev) => ({
            ...prev,
            [key]: { pageCount: 1, loading: false },
          }));
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [files, isImageMode]);

  // Parse page ranges per file and notify parent validation state
  const rangeEvaluations: Record<string, PageRangeParseResult> = useMemo(() => {
    const map: Record<string, PageRangeParseResult> = {};
    let hasAnyError = false;
    let totalResultPages = 0;

    files.forEach((file) => {
      const key = getFileKey(file);
      const totalPages = fileMetas[key]?.pageCount || 1;
      const rangeStr = fileRanges[key] || '';
      const parsed = parsePageRange(rangeStr, totalPages);
      map[key] = parsed;

      if (!parsed.valid) {
        hasAnyError = true;
      } else {
        totalResultPages += parsed.totalSelected;
      }
    });

    onValidationChange?.(hasAnyError, totalResultPages);
    return map;
  }, [files, fileMetas, fileRanges, onValidationChange]);

  const totalResultPages = useMemo(() => {
    return Object.values(rangeEvaluations).reduce((acc, r) => acc + (r.valid ? r.totalSelected : 0), 0);
  }, [rangeEvaluations]);

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    setDragOverIdx(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const reordered = [...files];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIndex, 0, moved);
    onFilesChange(reordered);

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, idx) => idx !== index);
    onFilesChange(updated);
  };

  // ─── Choose Pages Modal Handler ───
  const openPagePicker = (file: SelectedFile) => {
    setActivePickerFile(file);
    const key = getFileKey(file);
    const totalPages = fileMetas[key]?.pageCount || 1;
    const currentRange = fileRanges[key] || '';
    const parsed = parsePageRange(currentRange, totalPages);

    if (parsed.valid && parsed.pageIndices1Based.length > 0) {
      setPickerSelectedPages(parsed.pageIndices1Based);
    } else {
      setPickerSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
    }

    // Lazy load thumbnails for picker
    if (file.buffer) {
      const buf = file.buffer;
      for (let p = 1; p <= Math.min(totalPages, 50); p++) {
        renderPageThumbnail(buf, p, 120).then((res) => {
          if (res?.dataUrl) {
            setPickerThumbnails((prev) => ({ ...prev, [p]: res.dataUrl }));
          }
        }).catch(() => {});
      }
    }
  };

  const togglePageSelection = (pageNum: number) => {
    setPickerSelectedPages((prev) => {
      if (prev.includes(pageNum)) {
        return prev.filter((p) => p !== pageNum);
      } else {
        return [...prev, pageNum].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAllPages = (totalPages: number) => {
    setPickerSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
  };

  const handleSelectNonePages = () => {
    setPickerSelectedPages([]);
  };

  const handleSelectOddPages = (totalPages: number) => {
    const odds: number[] = [];
    for (let p = 1; p <= totalPages; p += 2) odds.push(p);
    setPickerSelectedPages(odds);
  };

  const handleSelectEvenPages = (totalPages: number) => {
    const evens: number[] = [];
    for (let p = 2; p <= totalPages; p += 2) evens.push(p);
    setPickerSelectedPages(evens);
  };

  const handleInvertPages = (totalPages: number) => {
    setPickerSelectedPages((prev) => {
      const set = new Set(prev);
      const inverted: number[] = [];
      for (let p = 1; p <= totalPages; p++) {
        if (!set.has(p)) inverted.push(p);
      }
      return inverted;
    });
  };

  const applyPickerSelection = () => {
    if (!activePickerFile) return;
    const key = getFileKey(activePickerFile);
    const totalPages = fileMetas[key]?.pageCount || 1;

    if (pickerSelectedPages.length === 0) {
      onFileRangeChange(key, '');
    } else if (pickerSelectedPages.length === totalPages) {
      onFileRangeChange(key, '');
    } else {
      // Compress sorted numbers to ranges e.g. [1, 2, 5] -> "1-2, 5"
      const ranges: string[] = [];
      let start = pickerSelectedPages[0];
      let end = start;

      for (let i = 1; i < pickerSelectedPages.length; i++) {
        const curr = pickerSelectedPages[i];
        if (curr === end + 1) {
          end = curr;
        } else {
          ranges.push(start === end ? `${start}` : `${start}-${end}`);
          start = curr;
          end = curr;
        }
      }
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      onFileRangeChange(key, ranges.join(', '));
    }

    setActivePickerFile(null);
  };

  return (
    <div className="pdf-tray-canvas">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={isImageMode ? 'image/png,image/jpeg,image/webp' : '.pdf'}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddMoreFiles(e.target.files);
          }
        }}
      />

      {/* ─── Tray Header: "Files" with number badge only (no "in tray" text) ─── */}
      <div className="tray-canvas-header">
        <div className="tray-canvas-meta">
          <div className="tray-canvas-title-group">
            <h3 className="tray-canvas-title">
              Files <span className="tray-count-badge">{files.length}</span>
            </h3>
            <span className="tray-canvas-helper">Merged top to bottom. Drag to reorder.</span>
          </div>

          {isMergeMode && files.length >= 2 && (
            <span className="tray-result-estimate-pill" title="Total pages in merged output">
              {plural(totalResultPages, 'page')} in result
            </span>
          )}
        </div>

        <Button
          variant="secondary"
          size="compact"
          icon={<Plus size={14} />}
          onClick={() => fileInputRef.current?.click()}
          className="tray-add-btn"
        >
          Add files
        </Button>
      </div>

      {/* Compare View Mode */}
      {isCompareMode && (
        <div className="compare-mode-grid">
          <div className="compare-file-card slot-a">
            <div className="compare-card-header">
              <span className="compare-slot-tag">Document A (Original)</span>
            </div>
            {files[0] ? (
              <div className="compare-file-content">
                <FileText size={28} className="compare-file-icon" />
                <div className="compare-file-meta">
                  <strong>{files[0].name}</strong>
                  <span>{formatSize(files[0].size)}</span>
                </div>
              </div>
            ) : (
              <div className="compare-empty-slot">Drop first document</div>
            )}
          </div>

          <div className="compare-divider-badge">
            <GitCompare size={18} />
          </div>

          <div className="compare-file-card slot-b">
            <div className="compare-card-header">
              <span className="compare-slot-tag">Document B (Modified)</span>
            </div>
            {files[1] ? (
              <div className="compare-file-content">
                <FileText size={28} className="compare-file-icon" />
                <div className="compare-file-meta">
                  <strong>{files[1].name}</strong>
                  <span>{formatSize(files[1].size)}</span>
                </div>
              </div>
            ) : (
              <div className="compare-empty-slot">Drop second document</div>
            )}
          </div>
        </div>
      )}

      {/* Compare Results banner */}
      {isCompareMode && compareResult && (
        <div className="compare-results-banner">
          <div className="compare-res-header">
            <h4>Comparison Results</h4>
            {compareResult.diffSummary.identical ? (
              <span className="badge-identical">Documents are identical</span>
            ) : (
              <span className="badge-diff">Differences detected</span>
            )}
          </div>
          <div className="compare-res-stats">
            <div className="res-stat-item">
              <span className="stat-label">Doc A Pages:</span>
              <strong>{compareResult.pageCountA}</strong>
            </div>
            <div className="res-stat-item">
              <span className="stat-label">Doc B Pages:</span>
              <strong>{compareResult.pageCountB}</strong>
            </div>
            <div className="res-stat-item">
              <span className="stat-label">Words Added:</span>
              <strong style={{ color: 'var(--success)' }}>+{compareResult.diffSummary.addedWords}</strong>
            </div>
            <div className="res-stat-item">
              <span className="stat-label">Words Removed:</span>
              <strong style={{ color: 'var(--danger)' }}>-{compareResult.diffSummary.removedWords}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tray Files List (72-80px professional rows with thin dividers) ─── */}
      <div className="tray-files-list">
        {files.map((file, idx) => {
          const key = getFileKey(file);
          const meta = fileMetas[key] || { pageCount: 1, loading: false };
          const evalRes = rangeEvaluations[key] || { valid: true, totalSelected: meta.pageCount, notes: [] };
          const currentRange = fileRanges[key] || '';
          const isDragOver = dragOverIdx === idx;
          const isLimited = evalRes.valid && currentRange.trim() !== '' && currentRange.toLowerCase() !== 'all';

          return (
            <div
              key={`${file.name}-${idx}`}
              className={`tray-file-row ${isDragOver ? 'is-drag-over' : ''}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
            >
              <div className="tray-file-main">
                {/* Drag Handle */}
                <div className="tray-drag-handle" title="Drag to reorder sequence">
                  <GripVertical size={16} />
                </div>

                {/* Sequence Number */}
                <div className="tray-seq-badge">{idx + 1}</div>

                {/* First-Page Thumbnail (48x64) */}
                <div className="tray-thumb-frame" title={`First page preview of ${file.name}`}>
                  {meta.thumbUrl ? (
                    <img src={meta.thumbUrl} alt={`Thumbnail for ${file.name}`} className="tray-thumb-img" />
                  ) : (
                    <div className="tray-thumb-fallback">
                      {isImageMode ? <ImageIcon size={18} /> : <FileText size={18} />}
                      <span>P.1</span>
                    </div>
                  )}
                </div>

                {/* File Details: Name & Muted Meta */}
                <div className="tray-file-details">
                  <div className="tray-file-name" title={file.name}>
                    {file.name}
                  </div>
                  <div className="tray-file-meta">
                    {!isImageMode && (
                      <span className="tray-file-pages">
                        {plural(meta.pageCount, 'page')}
                      </span>
                    )}
                    <span className="tray-file-size">{formatSize(file.size)}</span>
                  </div>
                </div>

                {/* Per-File Page Range Input */}
                {!isImageMode && !isCompareMode && (
                  <div className="tray-page-range-column">
                    <div className="tray-range-input-wrapper">
                      <input
                        type="text"
                        placeholder="All pages"
                        value={currentRange}
                        onChange={(e) => onFileRangeChange(key, e.target.value)}
                        className={`tray-range-input ${!evalRes.valid ? 'is-invalid' : ''}`}
                        title="Specify pages (e.g. 1-3, 5, 8-end)"
                      />
                      {isLimited && (
                        <span className="tray-limited-chip" title="Active subset of pages">
                          {evalRes.totalSelected} of {meta.pageCount} pages
                        </span>
                      )}
                    </div>
                    {!evalRes.valid && (
                      <div className="tray-range-error-msg">
                        <AlertCircle size={11} />
                        <span>{evalRes.error}</span>
                      </div>
                    )}
                    {evalRes.notes.length > 0 && (
                      <div className="tray-range-note-msg">
                        <span>{evalRes.notes.join('. ')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions: Choose pages ghost button & Remove button */}
                <div className="tray-row-actions">
                  {!isImageMode && !isCompareMode && (
                    <Button
                      variant="ghost"
                      size="compact"
                      icon={<Layers size={13} />}
                      onClick={() => openPagePicker(file)}
                      title="Choose pages with visual preview"
                      className="tray-choose-pages-btn"
                    >
                      Choose pages
                    </Button>
                  )}

                  <button
                    type="button"
                    className="tray-remove-btn"
                    onClick={() => handleRemoveFile(idx)}
                    title="Remove file from merge sequence"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* ─── Dashed "Add another PDF to merge" Card below 2 files ─── */}
        {isMergeMode && files.length < 2 && (
          <div
            className="tray-add-another-card"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <div className="tray-add-another-icon-box">
              <Plus size={18} />
            </div>
            <div className="tray-add-another-text">
              <strong>Add another PDF to merge</strong>
              <span>At least 2 PDF documents are required to merge.</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Visual "Choose Pages" Modal with Real Previews ─── */}
      {activePickerFile && (
        <div className="page-picker-backdrop" onClick={() => setActivePickerFile(null)}>
          <div className="page-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="page-picker-header">
              <div className="page-picker-title-group">
                <h3>Choose pages: {activePickerFile.name}</h3>
                <span className="page-picker-sub">
                  {pickerSelectedPages.length} of {fileMetas[getFileKey(activePickerFile)]?.pageCount || 1} pages selected
                </span>
              </div>
              <button
                type="button"
                className="page-picker-close-btn"
                onClick={() => setActivePickerFile(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick selection chips */}
            <div className="page-picker-chips-bar">
              <button
                type="button"
                className="picker-filter-chip"
                onClick={() => handleSelectAllPages(fileMetas[getFileKey(activePickerFile)]?.pageCount || 1)}
              >
                Select all
              </button>
              <button
                type="button"
                className="picker-filter-chip"
                onClick={handleSelectNonePages}
              >
                None
              </button>
              <button
                type="button"
                className="picker-filter-chip"
                onClick={() => handleSelectOddPages(fileMetas[getFileKey(activePickerFile)]?.pageCount || 1)}
              >
                Odd
              </button>
              <button
                type="button"
                className="picker-filter-chip"
                onClick={() => handleSelectEvenPages(fileMetas[getFileKey(activePickerFile)]?.pageCount || 1)}
              >
                Even
              </button>
              <button
                type="button"
                className="picker-filter-chip"
                onClick={() => handleInvertPages(fileMetas[getFileKey(activePickerFile)]?.pageCount || 1)}
              >
                Invert
              </button>
            </div>

            {/* Grid of Real Thumbnails (3 to 5 per row) */}
            <div className="page-picker-grid">
              {Array.from(
                { length: fileMetas[getFileKey(activePickerFile)]?.pageCount || 1 },
                (_, i) => i + 1
              ).map((pageNum) => {
                const isSelected = pickerSelectedPages.includes(pageNum);
                const thumbUrl = pickerThumbnails[pageNum];

                return (
                  <div
                    key={pageNum}
                    className={`picker-page-tile ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => togglePageSelection(pageNum)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="picker-thumb-wrapper">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={`Page ${pageNum}`} className="picker-thumb-image" />
                      ) : (
                        <div className="picker-thumb-placeholder">
                          <FileText size={20} />
                          <span>Page {pageNum}</span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="picker-selected-check-badge">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="picker-page-badge">{pageNum}</span>
                  </div>
                );
              })}
            </div>

            <div className="page-picker-footer">
              <Button variant="secondary" onClick={() => setActivePickerFile(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={applyPickerSelection}>
                Apply selection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
