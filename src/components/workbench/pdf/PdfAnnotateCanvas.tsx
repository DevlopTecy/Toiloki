import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  FileText,
  Type,
  Stamp,
  Shield,
  EyeOff,
  PenTool,
  Highlighter,
  CheckSquare,
  Bookmark,
  Sparkles
} from 'lucide-react';
import { SelectedFile } from '../../file-system/FileDropzone';
import { renderPageThumbnail } from './pdfThumbnailService';
import './PdfAnnotateCanvas.css';

export interface PdfAnnotateCanvasProps {
  file: SelectedFile | undefined;
  activeUtilityId: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  // Live preview options
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkFontSize?: number;
  watermarkRotation?: number;
  pageNumberPosition?: 'bottom-center' | 'bottom-right' | 'top-right';
  pageNumberStart?: number;
  annotText?: string;
  annotFontSize?: number;
  annotColor?: string;
  stampPreset?: string;
  stampOpacity?: number;
  signName?: string;
  redactStyle?: 'black' | 'white';
  redactLabel?: string;
  shapeType?: 'rect' | 'circle' | 'line';
  shapeColor?: string;
  shapeBorderWidth?: number;
  highlightType?: 'highlight' | 'underline';
  highlightColor?: string;
}

export const PdfAnnotateCanvas: React.FC<PdfAnnotateCanvasProps> = ({
  file,
  activeUtilityId,
  currentPage,
  onPageChange,
  totalPages,
  watermarkText = 'CONFIDENTIAL',
  watermarkOpacity = 0.25,
  watermarkFontSize = 48,
  watermarkRotation = 45,
  pageNumberPosition = 'bottom-center',
  pageNumberStart = 1,
  annotText = 'Reviewed & Approved',
  annotFontSize = 16,
  annotColor = '#D4B06A',
  stampPreset = 'APPROVED',
  stampOpacity = 0.85,
  signName = 'Authorized Signer',
  redactStyle = 'black',
  redactLabel = '[ REDACTED ]',
  shapeType = 'rect',
  shapeColor = '#D4B06A',
  shapeBorderWidth = 2,
  highlightType = 'highlight',
  highlightColor = '#FACC15',
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [pageThumbUrl, setPageThumbUrl] = useState<string | null>(null);
  const [isLoadingThumb, setIsLoadingThumb] = useState<boolean>(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Render thumbnail for the current active page
  useEffect(() => {
    let isMounted = true;
    if (!file?.buffer) {
      setPageThumbUrl(null);
      return;
    }

    setIsLoadingThumb(true);
    renderPageThumbnail(file.buffer, currentPage, 540)
      .then((res) => {
        if (isMounted) {
          if (res?.dataUrl) {
            setPageThumbUrl(res.dataUrl);
          } else {
            setPageThumbUrl(null);
          }
          setIsLoadingThumb(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPageThumbUrl(null);
          setIsLoadingThumb(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [file?.buffer, currentPage]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60));
  const handleZoomReset = () => setZoom(100);

  const prevPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const nextPage = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const scale = zoom / 100;
  const actualPageNum = currentPage + pageNumberStart - 1;
  const actualTotal = totalPages + pageNumberStart - 1;

  return (
    <div className="pdf-annotate-canvas-root">
      {/* Canvas Viewport */}
      <div className="annotate-viewport" ref={viewportRef}>
        <div
          className="annotate-page-container"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {/* Base Page Sheet */}
          <div className="annotate-sheet">
            {pageThumbUrl ? (
              <img
                src={pageThumbUrl}
                alt={`Page ${currentPage}`}
                className="annotate-rendered-page-img"
              />
            ) : (
              <div className="annotate-page-fallback">
                <div className="fallback-header">
                  <FileText size={18} />
                  <span>Document Page {currentPage}</span>
                </div>
                <div className="fallback-content">
                  <div className="fallback-line line-header" />
                  <div className="fallback-line line-full" />
                  <div className="fallback-line line-full" />
                  <div className="fallback-line line-3-4" />
                  <div className="fallback-line line-half" />
                  <div className="fallback-line line-full" />
                  <div className="fallback-line line-3-4" />
                  <div className="fallback-line line-half" />
                </div>
              </div>
            )}

            {/* Live Interactive Overlays per activeUtilityId */}

            {/* 1. Watermark */}
            {activeUtilityId === 'watermark' && (
              <div
                className="annotate-overlay-watermark"
                style={{
                  opacity: watermarkOpacity,
                  fontSize: `${watermarkFontSize}px`,
                  transform: `translate(-50%, -50%) rotate(-${watermarkRotation}deg)`,
                }}
              >
                {watermarkText || 'CONFIDENTIAL'}
              </div>
            )}

            {/* 2. Page Numbers */}
            {activeUtilityId === 'page-numbers' && (
              <div className={`annotate-overlay-pagenum pos-${pageNumberPosition}`}>
                <span className="pagenum-tag">
                  Page {actualPageNum} of {actualTotal}
                </span>
              </div>
            )}

            {/* 3. Add Text Annotation */}
            {activeUtilityId === 'add-text' && (
              <div className="annotate-overlay-text-box">
                <div
                  className="interactive-text-bubble"
                  style={{
                    fontSize: `${annotFontSize}px`,
                    color: annotColor,
                  }}
                >
                  {annotText || 'Enter custom text...'}
                </div>
              </div>
            )}

            {/* 4. Add Image / Stamp */}
            {activeUtilityId === 'add-image' && (
              <div className="annotate-overlay-stamp-box">
                <div
                  className={`stamp-seal stamp-seal-${stampPreset.toLowerCase()}`}
                  style={{ opacity: stampOpacity }}
                >
                  <Stamp size={20} className="stamp-icon" />
                  <span>{stampPreset}</span>
                </div>
              </div>
            )}

            {/* 5. Draw Shapes */}
            {activeUtilityId === 'draw-shapes' && (
              <div className="annotate-overlay-shapes-box">
                {shapeType === 'rect' && (
                  <div
                    className="shape-rect-preview"
                    style={{
                      borderColor: shapeColor,
                      borderWidth: `${shapeBorderWidth}px`,
                    }}
                  />
                )}
                {shapeType === 'circle' && (
                  <div
                    className="shape-circle-preview"
                    style={{
                      borderColor: shapeColor,
                      borderWidth: `${shapeBorderWidth}px`,
                    }}
                  />
                )}
                {shapeType === 'line' && (
                  <div
                    className="shape-line-preview"
                    style={{
                      backgroundColor: shapeColor,
                      height: `${shapeBorderWidth}px`,
                    }}
                  />
                )}
              </div>
            )}

            {/* 6. Highlight & Underline */}
            {activeUtilityId === 'highlight-underline' && (
              <div className="annotate-overlay-highlight-box">
                {highlightType === 'highlight' ? (
                  <div
                    className="highlight-stripe"
                    style={{ backgroundColor: highlightColor }}
                  >
                    <span>Emphasized document text element</span>
                  </div>
                ) : (
                  <div
                    className="underline-stripe"
                    style={{ borderBottomColor: highlightColor }}
                  >
                    <span>Underlined document sentence</span>
                  </div>
                )}
              </div>
            )}

            {/* 7. Sign PDF */}
            {activeUtilityId === 'sign-pdf' && (
              <div className="annotate-overlay-signature-box">
                <div className="signature-badge">
                  <div className="sig-name">{signName || 'Authorized Signer'}</div>
                  <div className="sig-line" />
                  <div className="sig-meta">
                    <Shield size={11} />
                    <span>Toiloki Offline Local Verification</span>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Redact PDF */}
            {activeUtilityId === 'pdf-redact' && (
              <div className="annotate-overlay-redact-box">
                <div className={`redact-rectangle redact-${redactStyle}`}>
                  <EyeOff size={14} />
                  <span>{redactLabel || '[ REDACTED ]'}</span>
                </div>
              </div>
            )}

            {/* 9. Form Fields */}
            {activeUtilityId === 'pdf-fill-form-fields' && (
              <div className="annotate-overlay-form-preview">
                <div className="form-field-dummy">
                  <CheckSquare size={13} className="text-accent" />
                  <span>Interactive AcroForm Field Active</span>
                </div>
              </div>
            )}

            {/* 10. Bookmarks */}
            {activeUtilityId === 'pdf-bookmarks-editor' && (
              <div className="annotate-overlay-bookmark-preview">
                <div className="bookmark-tab">
                  <Bookmark size={14} />
                  <span>Chapter Outline Marker</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Canvas Dock (Bottom Center of Zone 1) */}
      <div className="annotate-floating-dock">
        <div className="dock-group">
          <button
            type="button"
            className="dock-btn"
            onClick={prevPage}
            disabled={currentPage <= 1}
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="dock-page-text">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="dock-btn"
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="dock-divider" />

        <div className="dock-group">
          <button
            type="button"
            className="dock-btn"
            onClick={handleZoomOut}
            disabled={zoom <= 60}
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="dock-zoom-text">{zoom}%</span>
          <button
            type="button"
            className="dock-btn"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            className="dock-btn"
            onClick={handleZoomReset}
            title="Reset zoom to 100%"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
