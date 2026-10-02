import React, { useState } from 'react';
import { Dialog } from './Dialog';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Code,
  Table as TableIcon,
} from 'lucide-react';
import './PreviewModal.css';

export type PreviewType = 'pdf' | 'image' | 'text' | 'data' | 'code';

export interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: PreviewType;
  title: string;
  // PDF specific
  pdfPages?: string[]; // array of page data URLs or placeholders
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Image specific
  imageUrl?: string;
  imageDimensions?: { width: number; height: number };
  fileSize?: number;
  // Text / Code specific
  textContent?: string;
  codeLanguage?: string;
  // Data specific
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
  treeData?: any;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  pdfPages = [],
  currentPage: propCurrentPage,
  totalPages = 1,
  onPageChange,
  imageUrl,
  imageDimensions,
  fileSize,
  textContent,
  codeLanguage = 'plaintext',
  tableData,
  treeData,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fitMode, setFitMode] = useState<'normal' | 'fit-width' | 'fit-page'>('normal');
  const [activePage, setActivePage] = useState<number>(propCurrentPage || 1);
  const [copied, setCopied] = useState<boolean>(false);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 25));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setFitMode('normal');
  };

  const handleCopyText = async () => {
    if (textContent) {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrevPage = () => {
    if (activePage > 1) {
      const next = activePage - 1;
      setActivePage(next);
      onPageChange?.(next);
    }
  };

  const handleNextPage = () => {
    if (activePage < totalPages) {
      const next = activePage + 1;
      setActivePage(next);
      onPageChange?.(next);
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'pdf':
        return <FileText size={16} />;
      case 'image':
        return <ImageIcon size={16} />;
      case 'data':
        return <TableIcon size={16} />;
      case 'code':
        return <Code size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${title}`}
      icon={getTypeIcon()}
      width="780px"
      footer={
        <div className="preview-modal-footer">
          <div className="preview-meta-info">
            {type === 'image' && imageDimensions && (
              <span>
                {imageDimensions.width} × {imageDimensions.height} px
                {fileSize ? ` • ${formatFileSize(fileSize)}` : ''}
              </span>
            )}
            {type === 'pdf' && (
              <span>
                Page {activePage} of {totalPages}
              </span>
            )}
            {(type === 'text' || type === 'code') && textContent && (
              <span>
                {textContent.length.toLocaleString()} characters •{' '}
                {textContent.split('\n').length.toLocaleString()} lines
              </span>
            )}
            {type === 'data' && tableData && (
              <span>
                {tableData.rows.length} rows • {tableData.headers.length} columns
              </span>
            )}
          </div>
          <button className="tool-btn secondary" onClick={onClose} type="button">
            Close
          </button>
        </div>
      }
    >
      <div className="preview-modal-container">
        {/* Top Preview Controls Toolbar */}
        <div className="preview-modal-toolbar">
          {/* Zoom controls for PDF / Image */}
          {(type === 'pdf' || type === 'image') && (
            <div className="toolbar-group">
              <button
                className="tool-btn secondary small-btn"
                onClick={handleZoomOut}
                title="Zoom Out"
                type="button"
              >
                <ZoomOut size={13} />
              </button>
              <span className="zoom-indicator">{zoomLevel}%</span>
              <button
                className="tool-btn secondary small-btn"
                onClick={handleZoomIn}
                title="Zoom In"
                type="button"
              >
                <ZoomIn size={13} />
              </button>
              <button
                className={`tool-btn secondary small-btn ${fitMode === 'fit-width' ? 'active' : ''}`}
                onClick={() => {
                  setFitMode(fitMode === 'fit-width' ? 'normal' : 'fit-width');
                  setZoomLevel(100);
                }}
                title="Fit Width"
                type="button"
              >
                Fit Width
              </button>
              <button
                className={`tool-btn secondary small-btn ${fitMode === 'fit-page' ? 'active' : ''}`}
                onClick={() => {
                  setFitMode(fitMode === 'fit-page' ? 'normal' : 'fit-page');
                  setZoomLevel(100);
                }}
                title="Fit Page"
                type="button"
              >
                Fit Page
              </button>
            </div>
          )}

          {/* PDF Page Navigator */}
          {type === 'pdf' && totalPages > 1 && (
            <div className="toolbar-group">
              <button
                className="tool-btn secondary small-btn"
                onClick={handlePrevPage}
                disabled={activePage <= 1}
                title="Previous Page"
                type="button"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="page-indicator">
                {activePage} / {totalPages}
              </span>
              <button
                className="tool-btn secondary small-btn"
                onClick={handleNextPage}
                disabled={activePage >= totalPages}
                title="Next Page"
                type="button"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Copy button for text / code / data */}
          {(type === 'text' || type === 'code' || type === 'data') && textContent && (
            <div className="toolbar-group">
              <button
                className="tool-btn secondary small-btn"
                onClick={handleCopyText}
                type="button"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Viewer Body */}
        <div className="preview-viewport-scroll">
          {/* IMAGE PREVIEW */}
          {type === 'image' && imageUrl && (
            <div className={`image-canvas-wrapper ${fitMode}`}>
              <img
                src={imageUrl}
                alt={title}
                style={{
                  transform: fitMode === 'normal' ? `scale(${zoomLevel / 100})` : undefined,
                  transformOrigin: 'top center',
                }}
                className={`preview-img ${fitMode}`}
              />
            </div>
          )}

          {/* PDF PREVIEW */}
          {type === 'pdf' && (
            <div className={`pdf-canvas-wrapper ${fitMode}`}>
              {pdfPages[activePage - 1] ? (
                <img
                  src={pdfPages[activePage - 1]}
                  alt={`PDF Page ${activePage}`}
                  style={{
                    transform: fitMode === 'normal' ? `scale(${zoomLevel / 100})` : undefined,
                    transformOrigin: 'top center',
                  }}
                  className={`preview-pdf-page ${fitMode}`}
                />
              ) : (
                <div className="pdf-page-simulated-view">
                  <div className="pdf-sheet">
                    <div className="sheet-header">Page {activePage}</div>
                    <div className="sheet-lines">
                      <div className="sim-line title" />
                      <div className="sim-line body" />
                      <div className="sim-line body" />
                      <div className="sim-line body short" />
                      <div className="sim-line body" />
                      <div className="sim-line body" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TEXT & CODE PREVIEW */}
          {(type === 'text' || type === 'code') && textContent && (
            <div className="text-preview-container">
              <pre className="text-preview-code">
                <code>{textContent}</code>
              </pre>
            </div>
          )}

          {/* DATA TABLE PREVIEW */}
          {type === 'data' && tableData && (
            <div className="data-table-scroll-container">
              <table className="preview-data-table">
                <thead>
                  <tr>
                    {tableData.headers.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.slice(0, 100).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TREE DATA PREVIEW */}
          {type === 'data' && !tableData && treeData && (
            <div className="tree-preview-container">
              <pre className="text-preview-code">
                <code>{JSON.stringify(treeData, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
