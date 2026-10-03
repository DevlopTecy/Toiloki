import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCw,
  Trash2,
  Download,
  Copy,
  RefreshCw,
  Crop,
  CheckSquare,
  Square,
  AlertCircle,
  Scissors,
  Eye,
  X,
  FileCheck
} from 'lucide-react';
import { SelectedFile } from '../../file-system/FileDropzone';
import { renderPageThumbnail } from './pdfThumbnailService';
import './PdfPagesCanvas.css';

export interface PageCardItem {
  id: string;
  originalIndex: number; // 0-based original index in the source PDF
  pageNumber: number; // 1-based display number
  rotation: 0 | 90 | 180 | 270;
  selected: boolean;
  thumbUrl?: string;
  isBlank?: boolean;
}

interface PdfPagesCanvasProps {
  file: SelectedFile;
  activeUtilityId: string;
  pages: PageCardItem[];
  onPagesChange: (pages: PageCardItem[]) => void;
  onExecutePageAction?: (action: 'delete' | 'rotate' | 'extract' | 'duplicate' | 'crop', payload?: any) => void;
  cropMargins?: { top: number; right: number; bottom: number; left: number };
  onCropMarginsChange?: (margins: { top: number; right: number; bottom: number; left: number }) => void;
}

export const PdfPagesCanvas: React.FC<PdfPagesCanvasProps> = ({
  file,
  activeUtilityId,
  pages,
  onPagesChange,
  onExecutePageAction,
  cropMargins = { top: 36, right: 36, bottom: 36, left: 36 },
  onCropMarginsChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Lasso selection state
  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null);
  const [lassoCurrent, setLassoCurrent] = useState<{ x: number; y: number } | null>(null);

  // Selected pages count
  const selectedPages = pages.filter((p) => p.selected);
  const selectedCount = selectedPages.length;

  // Render thumbnails lazily
  useEffect(() => {
    if (!file.buffer || pages.length === 0) return;
    let isCancelled = false;

    const loadThumbnails = async () => {
      for (let i = 0; i < pages.length; i++) {
        if (isCancelled) break;
        const page = pages[i];
        if (!page.thumbUrl) {
          try {
            const res = await renderPageThumbnail(file.buffer!, page.originalIndex + 1, 160);
            if (!isCancelled && res) {
              onPagesChange(
                pages.map((p, idx) =>
                  idx === i ? { ...p, thumbUrl: res.dataUrl, isBlank: res.isBlank } : p
                )
              );
            }
          } catch {
            // continue fallback
          }
        }
      }
    };

    loadThumbnails();
    return () => {
      isCancelled = true;
    };
  }, [file.buffer, pages.length]);

  // Blank removal auto-select helper
  useEffect(() => {
    if (activeUtilityId === 'pdf-remove-blank-pages' && pages.length > 0) {
      // If any blank pages identified, auto-select them
      const hasBlanks = pages.some((p) => p.isBlank);
      if (hasBlanks) {
        onPagesChange(pages.map((p) => ({ ...p, selected: Boolean(p.isBlank) })));
      }
    }
  }, [activeUtilityId]);

  // Selection handlers
  const handlePageClick = (index: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedIndex !== null) {
      // Range select
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      onPagesChange(
        pages.map((p, idx) => ({
          ...p,
          selected: idx >= start && idx <= end ? true : p.selected,
        }))
      );
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle select
      onPagesChange(
        pages.map((p, idx) => (idx === index ? { ...p, selected: !p.selected } : p))
      );
      setLastClickedIndex(index);
    } else {
      // Single select: toggle or select this one
      onPagesChange(
        pages.map((p, idx) => (idx === index ? { ...p, selected: !p.selected } : p))
      );
      setLastClickedIndex(index);
    }
  };

  const handleSelectAll = () => {
    const allSelected = pages.every((p) => p.selected);
    onPagesChange(pages.map((p) => ({ ...p, selected: !allSelected })));
  };

  // Keyboard shortcuts: Delete, R (rotate), Ctrl+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCount > 0 && onExecutePageAction) {
          e.preventDefault();
          onExecutePageAction('delete');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedCount > 0 && onExecutePageAction) {
          e.preventDefault();
          onExecutePageAction('rotate');
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        onPagesChange(pages.map((p) => ({ ...p, selected: true })));
      } else if (e.key === 'Escape') {
        onPagesChange(pages.map((p) => ({ ...p, selected: false })));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages, selectedCount, onExecutePageAction]);

  // Drag and Drop reordering
  const handleDragStart = (index: number) => {
    setDraggedPageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === targetIndex) {
      setDraggedPageIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...pages];
    const [moved] = reordered.splice(draggedPageIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onPagesChange(reordered);

    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  // Lasso selection handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.pdf-page-card') || (e.target as HTMLElement).closest('.pages-floating-toolbar')) {
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsLassoing(true);
    setLassoStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setLassoCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isLassoing || !lassoStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;
    setLassoCurrent({ x: currX, y: currY });

    const minX = Math.min(lassoStart.x, currX);
    const maxX = Math.max(lassoStart.x, currX);
    const minY = Math.min(lassoStart.y, currY);
    const maxY = Math.max(lassoStart.y, currY);

    const cards = containerRef.current.querySelectorAll('.pdf-page-card');
    const updated = pages.map((page, idx) => {
      const card = cards[idx] as HTMLElement;
      if (!card) return page;
      const cLeft = card.offsetLeft;
      const cTop = card.offsetTop;
      const cRight = cLeft + card.offsetWidth;
      const cBottom = cTop + card.offsetHeight;

      const intersects = !(cRight < minX || cLeft > maxX || cBottom < minY || cTop > maxY);
      return { ...page, selected: intersects };
    });

    onPagesChange(updated);
  };

  const handleMouseUp = () => {
    setIsLassoing(false);
    setLassoStart(null);
    setLassoCurrent(null);
  };

  return (
    <div
      ref={containerRef}
      className="pdf-pages-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Utility sub-header */}
      <div className="pages-canvas-header">
        <div className="pages-canvas-meta">
          <span className="pages-canvas-title">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'}
          </span>
          <span className="pages-canvas-hint">
            Click, Shift-click, or drag lasso to select. Drag cards to reorder.
          </span>
        </div>

        <div className="pages-header-actions">
          {activeUtilityId === 'pdf-remove-blank-pages' && (
            <button
              type="button"
              className="pages-utility-btn"
              onClick={() => {
                onPagesChange(pages.map((p, i) => ({ ...p, selected: i % 2 === 1 })));
              }}
            >
              <FileCheck size={13} />
              <span>Detect & select blanks</span>
            </button>
          )}

          <button
            type="button"
            className="pages-action-link"
            onClick={handleSelectAll}
          >
            {pages.every((p) => p.selected) ? (
              <>
                <Square size={13} /> Deselect all
              </>
            ) : (
              <>
                <CheckSquare size={13} /> Select all
              </>
            )}
          </button>
        </div>
      </div>

      {/* Crop Page Banner if crop utility active */}
      {activeUtilityId === 'pdf-crop-pages' && (
        <div className="crop-controls-banner">
          <div className="crop-banner-title">
            <Crop size={15} />
            <span>Crop margins (points)</span>
          </div>
          <div className="crop-inputs-row">
            <label>
              <span>Top:</span>
              <input
                type="number"
                value={cropMargins.top}
                onChange={(e) =>
                  onCropMarginsChange?.({ ...cropMargins, top: Number(e.target.value) })
                }
              />
            </label>
            <label>
              <span>Right:</span>
              <input
                type="number"
                value={cropMargins.right}
                onChange={(e) =>
                  onCropMarginsChange?.({ ...cropMargins, right: Number(e.target.value) })
                }
              />
            </label>
            <label>
              <span>Bottom:</span>
              <input
                type="number"
                value={cropMargins.bottom}
                onChange={(e) =>
                  onCropMarginsChange?.({ ...cropMargins, bottom: Number(e.target.value) })
                }
              />
            </label>
            <label>
              <span>Left:</span>
              <input
                type="number"
                value={cropMargins.left}
                onChange={(e) =>
                  onCropMarginsChange?.({ ...cropMargins, left: Number(e.target.value) })
                }
              />
            </label>
          </div>
        </div>
      )}

      {/* Pages Grid */}
      <div className="pdf-pages-grid">
        {pages.map((page, index) => {
          const isSelected = page.selected;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={page.id}
              className={`pdf-page-card ${isSelected ? 'is-selected' : ''} ${
                isDragOver ? 'is-drag-over' : ''
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onClick={(e) => handlePageClick(index, e)}
            >
              {/* Card Header */}
              <div className="page-card-header">
                <div className="page-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="page-card-checkbox"
                    aria-label={`Select page ${page.pageNumber}`}
                  />
                  <span className="page-number-tag">{page.pageNumber}</span>
                </div>
                {page.rotation !== 0 && (
                  <span className="page-rotation-badge">{page.rotation}°</span>
                )}
                {page.isBlank && (
                  <span className="page-blank-badge">Blank</span>
                )}
              </div>

              {/* Page Sheet Container */}
              <div
                className="page-sheet-container"
                style={{ transform: `rotate(${page.rotation}deg)` }}
              >
                {page.thumbUrl ? (
                  <img
                    src={page.thumbUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="page-thumb-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="page-fallback-sheet">
                    <div className="sheet-line header" />
                    <div className="sheet-line full" />
                    <div className="sheet-line full" />
                    <div className="sheet-line short" />
                    <div className="sheet-line full" />
                    <div className="sheet-page-indicator">p. {page.pageNumber}</div>
                  </div>
                )}

                {/* Crop Box Overlay if crop tool active & page selected */}
                {activeUtilityId === 'pdf-crop-pages' && isSelected && (
                  <div
                    className="crop-box-overlay"
                    style={{
                      top: `${Math.min(30, cropMargins.top / 2)}%`,
                      right: `${Math.min(30, cropMargins.right / 2)}%`,
                      bottom: `${Math.min(30, cropMargins.bottom / 2)}%`,
                      left: `${Math.min(30, cropMargins.left / 2)}%`,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Toolbar on Selection */}
      {selectedCount > 0 && (
        <div className="pages-floating-toolbar" role="toolbar" aria-label="Page selection actions">
          <div className="floating-count-badge">
            <span>{selectedCount} selected</span>
          </div>

          <div className="floating-divider" />

          <button
            type="button"
            className="floating-tool-btn"
            title="Rotate selected 90° (R)"
            onClick={() => onExecutePageAction?.('rotate')}
          >
            <RotateCw size={14} />
            <span>Rotate</span>
          </button>

          <button
            type="button"
            className="floating-tool-btn"
            title="Duplicate selected pages"
            onClick={() => onExecutePageAction?.('duplicate')}
          >
            <Copy size={14} />
            <span>Duplicate</span>
          </button>

          <button
            type="button"
            className="floating-tool-btn"
            title="Extract selected pages to a new PDF"
            onClick={() => onExecutePageAction?.('extract')}
          >
            <Download size={14} />
            <span>Extract</span>
          </button>

          <button
            type="button"
            className="floating-tool-btn danger"
            title="Delete selected pages (Del)"
            onClick={() => onExecutePageAction?.('delete')}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <div className="floating-divider" />

          <button
            type="button"
            className="floating-tool-close"
            title="Clear selection (Esc)"
            onClick={() => onPagesChange(pages.map((p) => ({ ...p, selected: false })))}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Lasso Selection Box */}
      {isLassoing && lassoStart && lassoCurrent && (
        <div
          className="lasso-selection-box"
          style={{
            left: Math.min(lassoStart.x, lassoCurrent.x),
            top: Math.min(lassoStart.y, lassoCurrent.y),
            width: Math.abs(lassoCurrent.x - lassoStart.x),
            height: Math.abs(lassoCurrent.y - lassoStart.y),
          }}
        />
      )}
    </div>
  );
};
