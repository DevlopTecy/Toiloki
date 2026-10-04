import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Eye,
  Sliders,
  Crop,
  X,
  Plus,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SelectedFile } from '../../file-system/FileDropzone';
import './ImageCanvas.css';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCanvasProps {
  files: SelectedFile[];
  activeFileIndex: number;
  onSelectFileIndex: (index: number) => void;
  onAddMoreFiles: (newFiles: FileList | File[]) => void;
  onRemoveFile: (index: number) => void;
  activeUtilityId: string;
  originalBuffer?: Uint8Array;
  currentBuffer?: Uint8Array;
  cropRect?: CropRect;
  onCropChange?: (crop: CropRect) => void;
  cropAspect?: 'free' | '1:1' | '4:3' | '16:9' | '9:16';
  filterStyle?: React.CSSProperties;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  files,
  activeFileIndex,
  onSelectFileIndex,
  onAddMoreFiles,
  onRemoveFile,
  activeUtilityId,
  originalBuffer,
  currentBuffer,
  cropRect,
  onCropChange,
  cropAspect = 'free',
  filterStyle = {},
}) => {
  const currentFile = files[activeFileIndex];

  // Object URLs
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  // Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Before / After Mode
  const [compareMode, setCompareMode] = useState<'none' | 'split' | 'hold'>('none');
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [splitPos, setSplitPos] = useState<number>(50); // 0 to 100%
  const isDraggingSplit = useRef(false);

  // Natural Image Dimensions
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create & revoke object URLs for current and original buffers
  useEffect(() => {
    let currentObjUrl: string | null = null;
    let origObjUrl: string | null = null;

    if (currentBuffer && currentBuffer.length > 0) {
      const mime = currentFile?.name.endsWith('.png')
        ? 'image/png'
        : currentFile?.name.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';
      const blob = new Blob([currentBuffer], { type: mime });
      currentObjUrl = URL.createObjectURL(blob);
      setCurrentUrl(currentObjUrl);
    } else if (currentFile?.file) {
      currentObjUrl = URL.createObjectURL(currentFile.file);
      setCurrentUrl(currentObjUrl);
    }

    if (originalBuffer && originalBuffer.length > 0) {
      const blob = new Blob([originalBuffer]);
      origObjUrl = URL.createObjectURL(blob);
      setOriginalUrl(origObjUrl);
    } else if (currentFile?.file) {
      origObjUrl = URL.createObjectURL(currentFile.file);
      setOriginalUrl(origObjUrl);
    }

    return () => {
      if (currentObjUrl) URL.revokeObjectURL(currentObjUrl);
      if (origObjUrl) URL.revokeObjectURL(origObjUrl);
    };
  }, [currentBuffer, originalBuffer, currentFile]);

  // Load natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoom((z) => Math.max(0.25, Math.min(z + delta, 4)));
    }
  };

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on middle click or space+left click or when zoom > 1
    if (e.button === 1 || (e.button === 0 && zoom > 1 && !isDraggingSplit.current)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
    if (isDraggingSplit.current && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (relX / rect.width) * 100));
      setSplitPos(pct);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    isDraggingSplit.current = false;
  };

  // Crop interaction
  const isCropTool = activeUtilityId === 'img-crop';
  const effectiveCrop = cropRect || {
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  };

  const handleCropBoxDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!stageRef.current) return;
    const stage = stageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialCrop = { ...effectiveCrop };

    const onMove = (moveEvt: MouseEvent) => {
      const dxPct = ((moveEvt.clientX - startX) / stage.width) * 100;
      const dyPct = ((moveEvt.clientY - startY) / stage.height) * 100;

      let newX = Math.max(0, Math.min(100 - initialCrop.width, initialCrop.x + dxPct));
      let newY = Math.max(0, Math.min(100 - initialCrop.height, initialCrop.y + dyPct));

      onCropChange?.({
        x: Math.round(newX),
        y: Math.round(newY),
        width: initialCrop.width,
        height: initialCrop.height,
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleCropHandleDrag = (handlePos: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!stageRef.current) return;
    const stage = stageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initial = { ...effectiveCrop };

    const onMove = (moveEvt: MouseEvent) => {
      const dx = ((moveEvt.clientX - startX) / stage.width) * 100;
      const dy = ((moveEvt.clientY - startY) / stage.height) * 100;

      let { x, y, width, height } = initial;

      if (handlePos.includes('r')) {
        width = Math.max(10, Math.min(100 - x, initial.width + dx));
      }
      if (handlePos.includes('l')) {
        const potentialW = initial.width - dx;
        if (potentialW >= 10 && initial.x + dx >= 0) {
          x = initial.x + dx;
          width = potentialW;
        }
      }
      if (handlePos.includes('b')) {
        height = Math.max(10, Math.min(100 - y, initial.height + dy));
      }
      if (handlePos.includes('t')) {
        const potentialH = initial.height - dy;
        if (potentialH >= 10 && initial.y + dy >= 0) {
          y = initial.y + dy;
          height = potentialH;
        }
      }

      onCropChange?.({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Thumbnail generator helper
  const renderThumbnail = (file: SelectedFile, idx: number) => {
    const isSelected = idx === activeFileIndex;
    const blobUrl = file.buffer
      ? URL.createObjectURL(new Blob([file.buffer]))
      : file.file
      ? URL.createObjectURL(file.file)
      : '';

    const sizeStr = file.size
      ? file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
      : 'Ready';

    return (
      <div
        key={`${file.name}-${idx}`}
        className={`batch-thumb-item ${isSelected ? 'is-active' : ''}`}
        onClick={() => onSelectFileIndex(idx)}
        title={file.name}
      >
        <img src={blobUrl} alt={file.name} className="batch-thumb-preview" />
        <div className="batch-thumb-info">
          <span className="batch-thumb-name">{file.name}</span>
          <span className="batch-thumb-size">{sizeStr}</span>
        </div>
        {files.length > 1 && (
          <button
            className="batch-thumb-remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFile(idx);
            }}
            title="Remove from batch"
          >
            <X size={13} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="image-canvas-container" onWheel={handleWheel}>
      {/* Floating Top Control Toolbar */}
      <div className="image-canvas-toolbar">
        {/* Zoom controls */}
        <button className="canvas-tool-btn" onClick={handleZoomOut} title="Zoom out">
          <ZoomOut size={15} />
        </button>
        <span className="canvas-zoom-text">{Math.round(zoom * 100)}%</span>
        <button className="canvas-tool-btn" onClick={handleZoomIn} title="Zoom in">
          <ZoomIn size={15} />
        </button>
        <button className="canvas-tool-btn" onClick={handleResetZoom} title="Reset zoom (100%)">
          <Maximize2 size={14} />
        </button>

        <div className="canvas-toolbar-divider" />

        {/* Before / After toggle */}
        <button
          className={`canvas-tool-btn ${compareMode === 'split' ? 'is-active' : ''}`}
          onClick={() => setCompareMode(compareMode === 'split' ? 'none' : 'split')}
          title="Split before / after comparison"
        >
          <ArrowRightLeft size={14} />
          <span>Before / After</span>
        </button>

        <button
          className={`canvas-tool-btn ${isHoldingOriginal ? 'is-active' : ''}`}
          onMouseDown={() => setIsHoldingOriginal(true)}
          onMouseUp={() => setIsHoldingOriginal(false)}
          onMouseLeave={() => setIsHoldingOriginal(false)}
          title="Hold to view original image"
        >
          <Eye size={14} />
          <span>Hold original</span>
        </button>

        {imgNaturalSize.width > 0 && (
          <>
            <div className="canvas-toolbar-divider" />
            <span className="canvas-zoom-text" style={{ minWidth: 'auto', padding: '0 4px' }}>
              {imgNaturalSize.width} × {imgNaturalSize.height}
            </span>
          </>
        )}
      </div>

      {/* Main Interactive Viewport */}
      <div
        className={`image-canvas-viewport ${zoom > 1 ? 'is-panning' : ''} ${
          isPanning ? 'is-dragging' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {currentUrl && (
          <div
            ref={stageRef}
            className="image-stage"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {/* Split Comparison Mode */}
            {compareMode === 'split' && originalUrl ? (
              <div className="split-compare-container">
                <span className="split-badge before">BEFORE</span>
                <span className="split-badge after">AFTER</span>

                {/* Left side: Original Image */}
                <div
                  className="split-layer-before"
                  style={{ width: `${splitPos}%` }}
                >
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="stage-image"
                    style={{ width: stageRef.current ? `${stageRef.current.clientWidth}px` : 'auto' }}
                  />
                </div>

                {/* Right side: Current Edited Image */}
                <img
                  src={currentUrl}
                  alt="Edited"
                  className="stage-image"
                  onLoad={handleImageLoad}
                  style={filterStyle}
                />

                {/* Draggable Divider Line */}
                <div
                  className="split-divider-line"
                  style={{ left: `${splitPos}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    isDraggingSplit.current = true;
                  }}
                >
                  <div className="split-divider-handle">
                    <ArrowRightLeft size={14} />
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Single Image View (or Hold Original) */
              <div style={{ position: 'relative' }}>
                <img
                  src={isHoldingOriginal && originalUrl ? originalUrl : currentUrl}
                  alt={currentFile?.name || 'Image'}
                  className="stage-image"
                  onLoad={handleImageLoad}
                  style={isHoldingOriginal ? {} : filterStyle}
                />
                {isHoldingOriginal && (
                  <span className="split-badge before" style={{ left: 12, top: 12 }}>
                    ORIGINAL
                  </span>
                )}
              </div>
            )}

            {/* Interactive Canvas Crop Box Overlay */}
            {isCropTool && (
              <div className="canvas-crop-overlay">
                {/* Dimmed backdrop masks outside crop box */}
                <div
                  className="crop-dark-mask"
                  style={{ top: 0, left: 0, right: 0, height: `${effectiveCrop.y}%` }}
                />
                <div
                  className="crop-dark-mask"
                  style={{
                    top: `${effectiveCrop.y + effectiveCrop.height}%`,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                <div
                  className="crop-dark-mask"
                  style={{
                    top: `${effectiveCrop.y}%`,
                    left: 0,
                    width: `${effectiveCrop.x}%`,
                    height: `${effectiveCrop.height}%`,
                  }}
                />
                <div
                  className="crop-dark-mask"
                  style={{
                    top: `${effectiveCrop.y}%`,
                    left: `${effectiveCrop.x + effectiveCrop.width}%`,
                    right: 0,
                    height: `${effectiveCrop.height}%`,
                  }}
                />

                {/* Active Draggable Crop Box */}
                <div
                  className="crop-bounding-box"
                  style={{
                    left: `${effectiveCrop.x}%`,
                    top: `${effectiveCrop.y}%`,
                    width: `${effectiveCrop.width}%`,
                    height: `${effectiveCrop.height}%`,
                  }}
                  onMouseDown={handleCropBoxDrag}
                >
                  {/* Rule of Thirds grid lines */}
                  <div className="crop-grid-h" style={{ top: '33.33%' }} />
                  <div className="crop-grid-h" style={{ top: '66.66%' }} />
                  <div className="crop-grid-v" style={{ left: '33.33%' }} />
                  <div className="crop-grid-v" style={{ left: '66.66%' }} />

                  {/* 8 Resize Handles */}
                  <div className="crop-handle tl" onMouseDown={(e) => handleCropHandleDrag('tl', e)} />
                  <div className="crop-handle tr" onMouseDown={(e) => handleCropHandleDrag('tr', e)} />
                  <div className="crop-handle bl" onMouseDown={(e) => handleCropHandleDrag('bl', e)} />
                  <div className="crop-handle br" onMouseDown={(e) => handleCropHandleDrag('br', e)} />
                  <div className="crop-handle t"  onMouseDown={(e) => handleCropHandleDrag('t', e)} />
                  <div className="crop-handle b"  onMouseDown={(e) => handleCropHandleDrag('b', e)} />
                  <div className="crop-handle l"  onMouseDown={(e) => handleCropHandleDrag('l', e)} />
                  <div className="crop-handle r"  onMouseDown={(e) => handleCropHandleDrag('r', e)} />

                  {/* Dimension pill */}
                  {imgNaturalSize.width > 0 && (
                    <div className="crop-dimension-pill">
                      {Math.round((effectiveCrop.width / 100) * imgNaturalSize.width)} ×{' '}
                      {Math.round((effectiveCrop.height / 100) * imgNaturalSize.height)} px
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batch Thumbnail Strip at the Bottom */}
      <div className="image-batch-strip">
        {files.map((file, idx) => renderThumbnail(file, idx))}

        {/* Add more files button */}
        <button
          className="batch-add-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Add more images to batch"
        >
          <Plus size={14} />
          <span>Add image</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.bmp,.tiff,.svg,.heic,.avif"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddMoreFiles(e.target.files);
            }
          }}
        />
      </div>
    </div>
  );
};
