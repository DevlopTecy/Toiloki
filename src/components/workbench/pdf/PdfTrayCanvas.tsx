import React, { useState, useRef } from 'react';
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Plus,
  GitCompare,
  ArrowRight,
  Layers
} from 'lucide-react';
import { SelectedFile } from '../../file-system/FileDropzone';
import './PdfTrayCanvas.css';

interface FileRangeItem {
  id: string;
  rangeText: string;
  isExpanded: boolean;
}

interface PdfTrayCanvasProps {
  files: SelectedFile[];
  activeUtilityId: string;
  onFilesChange: (files: SelectedFile[]) => void;
  onAddMoreFiles: (newFiles: FileList | File[]) => void;
  fileRanges: Record<string, string>; // fileName -> range string
  onFileRangeChange: (fileName: string, range: string) => void;
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
  compareResult,
}) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCompareMode = activeUtilityId === 'pdf-compare-pdfs';
  const isImageMode = activeUtilityId === 'images-to-pdf';

  // Toggle accordion for choose pages
  const toggleExpanded = (fileName: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

  // Reorder
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="pdf-tray-canvas">
      {/* Hidden file input for adding files */}
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

      {/* Header Info */}
      <div className="tray-canvas-header">
        <div className="tray-canvas-meta">
          <span className="tray-canvas-title">
            {files.length} {files.length === 1 ? 'file' : 'files'} in tray
          </span>
          <span className="tray-canvas-hint">
            {isCompareMode
              ? 'Select two PDF documents to inspect and compare differences'
              : 'Drag to reorder sequence. Specify page ranges per document if needed.'}
          </span>
        </div>

        <button
          type="button"
          className="tray-add-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus size={14} />
          <span>Add more files</span>
        </button>
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

      {/* Compare Results banner if compared */}
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

      {/* Normal Tray List */}
      <div className="tray-files-list">
        {files.map((file, idx) => {
          const isExpanded = Boolean(expandedFiles[file.name]);
          const currentRange = fileRanges[file.name] || '';
          const isDragOver = dragOverIdx === idx;

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
                <div className="tray-drag-handle" title="Drag to reorder">
                  <GripVertical size={16} />
                </div>

                {/* Sequence Number */}
                <div className="tray-seq-badge">{idx + 1}</div>

                {/* File Icon */}
                <div className="tray-file-icon-wrap">
                  {isImageMode ? (
                    <ImageIcon size={18} className="tray-file-icon" />
                  ) : (
                    <FileText size={18} className="tray-file-icon" />
                  )}
                </div>

                {/* File Details */}
                <div className="tray-file-details">
                  <div className="tray-file-name" title={file.name}>
                    {file.name}
                  </div>
                  <div className="tray-file-size">{formatSize(file.size)}</div>
                </div>

                {/* Per-file page range (for PDF tools) */}
                {!isImageMode && !isCompareMode && (
                  <div className="tray-page-range-input-wrap">
                    <label>
                      <span>Pages:</span>
                      <input
                        type="text"
                        placeholder="All (e.g. 1-3, 5)"
                        value={currentRange}
                        onChange={(e) => onFileRangeChange(file.name, e.target.value)}
                        className="tray-range-input"
                      />
                    </label>
                  </div>
                )}

                {/* Actions */}
                <div className="tray-row-actions">
                  {!isImageMode && !isCompareMode && (
                    <button
                      type="button"
                      className="tray-choose-pages-toggle"
                      onClick={() => toggleExpanded(file.name)}
                      title="Choose pages visually"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>Choose pages</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="tray-remove-btn"
                    onClick={() => handleRemoveFile(idx)}
                    title="Remove file from merge sequence"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Collapsed Page Thumbnails Accordion */}
              {isExpanded && (
                <div className="tray-file-accordion-content">
                  <div className="accordion-hint">
                    Page thumbnail preview for {file.name}:
                  </div>
                  <div className="accordion-mock-thumbnails">
                    <div className="mock-sheet">
                      <span>P. 1</span>
                    </div>
                    <div className="mock-sheet">
                      <span>P. 2</span>
                    </div>
                    <div className="mock-sheet">
                      <span>P. 3</span>
                    </div>
                    <div className="mock-sheet">
                      <span>P. 4</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
