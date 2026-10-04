import React, { useState, useMemo, useEffect } from 'react';
import { Scissors, FileStack, AlertCircle } from 'lucide-react';
import { SelectedFile } from '../../file-system/FileDropzone';
import { renderPageThumbnail } from './pdfThumbnailService';
import './PdfMarkersCanvas.css';

interface MarkerPage {
  pageNumber: number; // 1-based
  thumbUrl?: string;
}

interface PdfMarkersCanvasProps {
  file: SelectedFile;
  pageCount: number;
  onSplitConfigChange: (config: {
    method: 'markers' | 'everyN' | 'ranges' | 'size';
    cutPoints: number[]; // 1-based page numbers after which a cut occurs
    everyN: number;
    ranges: string;
    partsCount: number;
  }) => void;
}

export const PdfMarkersCanvas: React.FC<PdfMarkersCanvasProps> = ({
  file,
  pageCount,
  onSplitConfigChange,
}) => {
  const [method, setMethod] = useState<'markers' | 'everyN' | 'ranges' | 'size'>('markers');
  const [manualCuts, setManualCuts] = useState<Set<number>>(new Set());
  const [everyN, setEveryN] = useState<number>(1);
  const [rangeString, setRangeString] = useState<string>('1-2, 3-4');
  const [targetSizeMb, setTargetSizeMb] = useState<number>(5);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});

  // Render thumbnails lazily
  useEffect(() => {
    if (!file.buffer || pageCount === 0) return;
    let isCancelled = false;

    const loadThumbs = async () => {
      for (let p = 1; p <= pageCount; p++) {
        if (isCancelled) break;
        if (!thumbs[p]) {
          try {
            const res = await renderPageThumbnail(file.buffer!, p, 130);
            if (!isCancelled && res) {
              setThumbs((prev) => ({ ...prev, [p]: res.dataUrl }));
            }
          } catch {}
        }
      }
    };

    loadThumbs();
    return () => {
      isCancelled = true;
    };
  }, [file.buffer, pageCount]);

  // Compute active cut points based on selected method
  const activeCutPoints = useMemo(() => {
    if (method === 'markers') {
      return Array.from(manualCuts).sort((a, b) => a - b);
    }
    if (method === 'everyN') {
      const cuts: number[] = [];
      const step = Math.max(1, everyN);
      for (let i = step; i < pageCount; i += step) {
        cuts.push(i);
      }
      return cuts;
    }
    if (method === 'ranges') {
      // Parse ranges: e.g. "1-2, 3-5"
      const cuts = new Set<number>();
      const parts = rangeString.split(',').map((p) => p.trim());
      for (const part of parts) {
        const match = part.match(/^(\d+)-(\d+)$/);
        if (match) {
          const end = parseInt(match[2], 10);
          if (end < pageCount) cuts.add(end);
        }
      }
      return Array.from(cuts).sort((a, b) => a - b);
    }
    if (method === 'size') {
      // Approximate size split
      const cuts: number[] = [];
      const totalMb = file.size / (1024 * 1024);
      const estParts = Math.max(1, Math.ceil(totalMb / Math.max(0.1, targetSizeMb)));
      const pagesPerPart = Math.max(1, Math.ceil(pageCount / estParts));
      for (let i = pagesPerPart; i < pageCount; i += pagesPerPart) {
        cuts.push(i);
      }
      return cuts;
    }
    return [];
  }, [method, manualCuts, everyN, rangeString, targetSizeMb, pageCount, file.size]);

  // Number of output files created
  const partsCount = activeCutPoints.length + 1;

  // Notify parent of updated split config
  useEffect(() => {
    onSplitConfigChange({
      method,
      cutPoints: activeCutPoints,
      everyN,
      ranges: rangeString,
      partsCount,
    });
  }, [method, activeCutPoints, everyN, rangeString, partsCount]);

  // Toggle manual cut point after pageNumber
  const toggleCut = (pageNumber: number) => {
    if (method !== 'markers') {
      setMethod('markers');
    }
    setManualCuts((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const pagesArray = useMemo(() => {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }, [pageCount]);

  return (
    <div className="pdf-markers-canvas">
      {/* Top Compact Control Bar */}
      <div className="markers-control-bar">
        <div className="markers-method-group">
          <button
            type="button"
            className={`marker-method-btn ${method === 'markers' ? 'is-active' : ''}`}
            onClick={() => setMethod('markers')}
          >
            Visual cut markers
          </button>
          <button
            type="button"
            className={`marker-method-btn ${method === 'everyN' ? 'is-active' : ''}`}
            onClick={() => setMethod('everyN')}
          >
            Every N pages
          </button>
          <button
            type="button"
            className={`marker-method-btn ${method === 'ranges' ? 'is-active' : ''}`}
            onClick={() => setMethod('ranges')}
          >
            Page ranges
          </button>
          <button
            type="button"
            className={`marker-method-btn ${method === 'size' ? 'is-active' : ''}`}
            onClick={() => setMethod('size')}
          >
            By file size
          </button>
        </div>

        {/* Dynamic method inputs */}
        <div className="markers-input-group">
          {method === 'everyN' && (
            <label className="marker-input-label">
              <span>Split every</span>
              <input
                type="number"
                min="1"
                max={Math.max(1, pageCount - 1)}
                value={everyN}
                onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="marker-num-input"
              />
              <span>pages</span>
            </label>
          )}

          {method === 'ranges' && (
            <label className="marker-input-label">
              <span>Ranges:</span>
              <input
                type="text"
                value={rangeString}
                onChange={(e) => setRangeString(e.target.value)}
                placeholder="1-2, 3-5, 6-8"
                className="marker-text-input"
              />
            </label>
          )}

          {method === 'size' && (
            <label className="marker-input-label">
              <span>Approx. max part size:</span>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={targetSizeMb}
                onChange={(e) => setTargetSizeMb(parseFloat(e.target.value) || 1)}
                className="marker-num-input"
              />
              <span>MB</span>
            </label>
          )}

          {method === 'markers' && (
            <span className="marker-hint">
              Click the line between pages to add or remove cut points.
            </span>
          )}
        </div>

        {/* Live Summary */}
        <div className="markers-live-summary">
          <Scissors size={14} className="scissors-icon" />
          <strong>
            {partsCount} {partsCount === 1 ? 'file' : 'files'} will be created
          </strong>
        </div>
      </div>

      {/* Pages with Interactive Cut Dividers */}
      <div className="markers-pages-flow">
        {pagesArray.map((pageNum, index) => {
          const hasCutAfter = activeCutPoints.includes(pageNum);
          const isLastPage = index === pagesArray.length - 1;

          return (
            <React.Fragment key={pageNum}>
              {/* Page Card */}
              <div className="marker-page-card">
                <div className="marker-card-top">
                  <span className="marker-page-num">P. {pageNum}</span>
                </div>
                <div className="marker-sheet-thumb">
                  {thumbs[pageNum] ? (
                    <img src={thumbs[pageNum]} alt={`Page ${pageNum}`} className="thumb-img" />
                  ) : (
                    <div className="mock-marker-sheet">
                      <div className="sheet-h" />
                      <div className="sheet-b" />
                      <div className="sheet-b" />
                    </div>
                  )}
                </div>
              </div>

              {/* Cut Marker Slot between pages */}
              {!isLastPage && (
                <div
                  className={`marker-cut-slot ${hasCutAfter ? 'is-active-cut' : ''}`}
                  onClick={() => toggleCut(pageNum)}
                  title={
                    hasCutAfter
                      ? `Remove cut after page ${pageNum}`
                      : `Add cut marker after page ${pageNum}`
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div className="cut-indicator-line" />
                  <div className="cut-marker-pill">
                    <Scissors size={11} />
                    <span>Cut</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
