import React, { useState, useEffect, useMemo } from 'react';
import { ToolLayout } from '../../components/common/ToolLayout';
import { FileDropzone, SelectedFile } from '../../components/file-system/FileDropzone';
import { ResultViewer } from '../../components/file-system/ResultViewer';
import { ErrorPanel } from '../../components/common/ErrorPanel';
import { ProcessingView } from '../../components/feedback/ProcessingView';
import { PreviewModal } from '../../components/common/PreviewModal';
import { ImageEngine, ImageTransformOptions } from '../../engines/images/image.engine';
import { ExifEngine } from '../../engines/images/exif.engine';
import { HistoryService } from '../../core/services/history.service';
import { EngineResult } from '../../core/types/engine';
import {
  Image as ImageIcon,
  Sliders,
  Info,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ShieldCheck,
  Maximize2,
  Crop,
  Layers,
} from 'lucide-react';
import './ImagesWorkspaceView.css';

interface ImagesWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const ImagesWorkspaceView: React.FC<ImagesWorkspaceViewProps> = ({
  groupId,
  utilityId,
  toolName,
  toolDescription,
  onBackToUtilities,
  isFavorite,
  onToggleFavorite,
}) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Transformation states
  const [targetWidth, setTargetWidth] = useState(1200);
  const [targetHeight, setTargetHeight] = useState(800);
  const [origDimensions, setOrigDimensions] = useState<{ w: number; h: number } | null>(null);
  const [lockAspect, setLockAspect] = useState(true);

  // Crop / Aspect presets
  const [cropAspect, setCropAspect] = useState<'free' | '1:1' | '4:3' | '16:9'>('free');

  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [quality, setQuality] = useState(85);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(false);

  // EXIF info state
  const [exifTags, setExifTags] = useState<Record<string, string> | null>(null);

  // Extended Tool States
  const [svgScale, setSvgScale] = useState<number>(2);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkPos, setWatermarkPos] = useState<'center' | 'bottom-right' | 'top-left' | 'tile'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.4);
  const [watermarkColor, setWatermarkColor] = useState('#FFFFFF');
  const [collageCols, setCollageCols] = useState(3);
  const [collageLabels, setCollageLabels] = useState(true);
  const [spriteLayout, setSpriteLayout] = useState<'horizontal' | 'vertical' | 'grid'>('grid');
  const [spriteCss, setSpriteCss] = useState<string | null>(null);
  const [diffMeta, setDiffMeta] = useState<string | null>(null);
  const [animDelay, setAnimDelay] = useState(250);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<EngineResult<Uint8Array> | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (files.length > 0 && files[0].buffer) {
      const blob = new Blob([files[0].buffer]);
      const url = URL.createObjectURL(blob);
      setImagePreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        setOrigDimensions({ w: img.width, h: img.height });
        setTargetWidth(img.width);
        setTargetHeight(img.height);
      };
      img.src = url;

      const exifRes = ExifEngine.parseExif(files[0].buffer);
      if (exifRes.success && exifRes.data) {
        setExifTags(exifRes.data);
      } else {
        setExifTags({ Notice: 'No EXIF metadata detected in this file.' });
      }

      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
      setOrigDimensions(null);
    }
  }, [files]);

  useEffect(() => {
    if (result?.outputBuffer) {
      const blob = new Blob([result.outputBuffer]);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setResultUrl(null);
    }
  }, [result]);

  const handleReset = () => {
    setFiles([]);
    setImagePreviewUrl(null);
    setResult(null);
    setResultUrl(null);
    setErrorMsg(null);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(0);
    setBlur(0);
    setGrayscale(false);
    setProgressPercent(0);
    setSpriteCss(null);
    setDiffMeta(null);
  };

  const applyPreset = (preset: '100%' | '75%' | '50%' | '1080p' | '720p') => {
    if (!origDimensions) return;
    if (preset === '100%') {
      setTargetWidth(origDimensions.w);
      setTargetHeight(origDimensions.h);
    } else if (preset === '75%') {
      setTargetWidth(Math.round(origDimensions.w * 0.75));
      setTargetHeight(Math.round(origDimensions.h * 0.75));
    } else if (preset === '50%') {
      setTargetWidth(Math.round(origDimensions.w * 0.5));
      setTargetHeight(Math.round(origDimensions.h * 0.5));
    } else if (preset === '1080p') {
      const ratio = origDimensions.w / origDimensions.h;
      setTargetWidth(1920);
      setTargetHeight(Math.round(1920 / ratio));
    } else if (preset === '720p') {
      const ratio = origDimensions.w / origDimensions.h;
      setTargetWidth(1280);
      setTargetHeight(Math.round(1280 / ratio));
    }
  };

  const estimatedOutputSize = useMemo(() => {
    if (!origDimensions || !files[0]) return null;
    const pixelRatio = (targetWidth * targetHeight) / (origDimensions.w * origDimensions.h);
    const qFactor = format === 'image/png' ? 1.0 : quality / 100;
    const compressionEfficiency = format === 'image/webp' ? 0.65 : format === 'image/jpeg' ? 0.8 : 1.2;
    const estBytes = Math.round(files[0].size * pixelRatio * qFactor * compressionEfficiency);
    return Math.max(1024, estBytes);
  }, [origDimensions, targetWidth, targetHeight, quality, format, files]);

  const handleProcessImage = async () => {
    if (files.length === 0 || !files[0].buffer) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);
    setProgressPercent(10);
    setProgressStage('Initializing image buffers...');

    try {
      const opts: ImageTransformOptions = {
        width: targetWidth,
        height: targetHeight,
        maintainAspectRatio: lockAspect,
        rotationDegrees: rotation,
        flipHorizontal: flipH,
        flipVertical: flipV,
        format,
        quality: quality / 100,
        brightness,
        contrast,
        saturation,
        blur,
        grayscale,
      };

      setProgressPercent(40);
      setProgressStage('Rendering transform matrix...');

      let res: EngineResult<Uint8Array>;
      if (utilityId === 'convert-bmp') {
        res = await ImageEngine.convertToBmp(files[0].buffer, (p) => {
          setProgressStage(p.stage);
          setProgressPercent(Math.round(p.percent || 60));
        });
      } else if (utilityId === 'convert-tiff') {
        res = await ImageEngine.convertToTiff(files[0].buffer, (p) => {
          setProgressStage(p.stage);
          setProgressPercent(Math.round(p.percent || 60));
        });
      } else if (utilityId === 'img-svg-to-png') {
        res = await ImageEngine.svgToPng(files[0].buffer, { scale: svgScale });
      } else if (utilityId === 'img-batch-watermark') {
        res = await ImageEngine.applyWatermark(files[0].buffer, {
          text: watermarkText,
          position: watermarkPos,
          opacity: watermarkOpacity,
          color: watermarkColor,
        });
      } else if (utilityId === 'img-collage-sheet') {
        res = await ImageEngine.createContactSheet(
          files.map((f) => ({ buffer: f.buffer || new Uint8Array(), name: f.name })),
          { columns: collageCols, showLabels: collageLabels }
        );
      } else if (utilityId === 'img-sprite-sheet') {
        const sRes = await ImageEngine.createSpriteSheet(
          files.map((f) => ({ buffer: f.buffer || new Uint8Array(), name: f.name })),
          { layout: spriteLayout }
        );
        if (sRes.success && sRes.data) {
          setSpriteCss(sRes.data.css);
          res = {
            success: true,
            data: sRes.data.buffer,
            outputBuffer: sRes.data.buffer,
            metadata: sRes.metadata,
            elapsedMs: sRes.elapsedMs,
          };
        } else {
          throw new Error(sRes.error || 'Failed to generate sprite sheet');
        }
      } else if (utilityId === 'img-before-after') {
        if (files.length < 2 || !files[1].buffer) throw new Error('Please select at least 2 images to compare');
        const cRes = await ImageEngine.compareImages(files[0].buffer, files[1].buffer);
        if (cRes.success && cRes.data) {
          setDiffMeta(`Difference: ${cRes.data.diffPercentage}% (${cRes.data.mismatchedPixels.toLocaleString()} mismatched pixels)`);
          res = {
            success: true,
            data: cRes.data.diffBuffer,
            outputBuffer: cRes.data.diffBuffer,
            elapsedMs: cRes.elapsedMs,
          };
        } else {
          throw new Error(cRes.error || 'Comparison failed');
        }
      } else if (utilityId === 'img-gif-webp-builder') {
        res = await ImageEngine.transformImage(files[0].buffer, { format: 'image/webp', quality: 0.9 });
      } else {
        res = await ImageEngine.transformImage(files[0].buffer, opts, (p) => {
          setProgressStage(p.stage);
          setProgressPercent(Math.round(p.percent || 60));
        });
      }

      setProgressPercent(100);

      if (res.success) {
        setResult(res);
        HistoryService.record({
          toolName,
          workspaceId: 'images',
          groupId,
          utilityId,
          input: files[0].name,
          output: `Exported ${targetWidth}x${targetHeight} ${getFormatExtension().toUpperCase()}`,
          status: 'completed',
        });
      } else {
        setErrorMsg(res.error || 'Failed to process image.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripExif = async () => {
    if (files.length === 0 || !files[0].buffer) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setProgressStage('Stripping EXIF headers...');
    setProgressPercent(30);

    try {
      const opts: ImageTransformOptions = {
        format: 'image/jpeg',
        quality: 0.92,
      };
      const res = await ImageEngine.transformImage(files[0].buffer, opts);
      setProgressPercent(100);
      if (res.success) {
        setResult(res);
        HistoryService.record({
          toolName: 'Strip EXIF Metadata',
          workspaceId: 'images',
          groupId: 'img-metadata',
          utilityId: 'strip-exif',
          input: files[0].name,
          output: `Clean Image (${((res.outputBuffer?.length || 0) / 1024).toFixed(1)} KB, EXIF stripped)`,
          status: 'completed',
        });
      } else {
        setErrorMsg(res.error || 'Failed to strip EXIF metadata.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const getFormatExtension = () => {
    if (utilityId === 'convert-bmp') return 'bmp';
    if (utilityId === 'convert-tiff') return 'tiff';
    if (utilityId === 'img-svg-to-png') return 'png';
    if (utilityId === 'img-sprite-sheet') return 'png';
    if (utilityId === 'img-collage-sheet') return 'png';
    if (utilityId === 'img-before-after') return 'png';
    if (utilityId === 'img-gif-webp-builder') return 'webp';
    if (format === 'image/jpeg') return 'jpg';
    if (format === 'image/webp') return 'webp';
    return 'png';
  };

  const breadcrumbs = [
    { label: 'Home', onClick: onBackToUtilities },
    { label: 'Images', onClick: onBackToUtilities },
    { label: toolName },
  ];

  return (
    <ToolLayout
      breadcrumbItems={breadcrumbs}
      title={toolName}
      description={toolDescription}
      badgeGradient="var(--badge-img)"
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onReset={files.length > 0 || result ? handleReset : undefined}
    >
      <div className="images-tool-container">
        {files.length === 0 ? (
          <div className="image-empty-dropzone">
            <FileDropzone
              accept={
                utilityId === 'img-svg-to-png'
                  ? ['.svg']
                  : ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.tif']
              }
              multiple={
                utilityId === 'multi-img-pdf' ||
                utilityId === 'img-collage-sheet' ||
                utilityId === 'img-sprite-sheet' ||
                utilityId === 'img-gif-webp-builder' ||
                utilityId === 'img-before-after'
              }
              files={files}
              onFilesChanged={setFiles}
              label={
                utilityId === 'img-before-after'
                  ? 'Select or drop 2 images to compare'
                  : utilityId === 'img-collage-sheet' ||
                    utilityId === 'img-sprite-sheet' ||
                    utilityId === 'img-gif-webp-builder'
                    ? 'Select or drop multiple image files'
                    : 'Select or drop an image file'
              }
              sublabel={
                utilityId === 'img-svg-to-png'
                  ? 'Supports SVG vector image files'
                  : 'Supports PNG, JPG, WebP, BMP, and TIFF files'
              }
            />
          </div>
        ) : isProcessing ? (
          /* Processing Screen */
          <ProcessingView
            title={`Processing ${toolName}...`}
            currentFile={files[0].name}
            currentStage={progressStage}
            percent={progressPercent}
            onCancel={() => setIsProcessing(false)}
          />
        ) : !result ? (
          /* Editor Layout */
          <div className="image-editor-layout">
            {/* TOP: Filename + Image Information */}
            <div className="image-editor-top-bar">
              <div className="top-file-info">
                <ImageIcon size={16} className="text-accent" />
                <span className="file-name-text" title={files[0].name}>
                  {files[0].name}
                </span>
                <span className="file-meta-pill">
                  {(files[0].size / 1024).toFixed(1)} KB
                </span>
                {origDimensions && (
                  <span className="file-meta-pill">
                    {origDimensions.w} × {origDimensions.h} px
                  </span>
                )}
              </div>
              <button className="tool-btn secondary small-btn" onClick={handleReset} type="button">
                Change File
              </button>
            </div>

            <div className="image-split-main">
              {/* LEFT: Image Preview Area */}
              <div className="image-preview-panel">
                <div className="preview-toolbar">
                  <span className="preview-res-label">
                    {origDimensions ? `${origDimensions.w} × ${origDimensions.h} px` : 'Preview'}
                  </span>
                  <div className="zoom-controls">
                    <button
                      className="zoom-btn"
                      onClick={() => setZoomLevel(Math.max(0.2, zoomLevel - 0.2))}
                      title="Zoom Out"
                      type="button"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <span className="zoom-level-label">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      className="zoom-btn"
                      onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))}
                      title="Zoom In"
                      type="button"
                    >
                      <ZoomIn size={13} />
                    </button>
                    <button
                      className="zoom-btn"
                      onClick={() => setZoomLevel(1)}
                      title="Reset Zoom"
                      type="button"
                    >
                      <Maximize2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="image-canvas-viewport">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="preview-rendered-img"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                        filter: `brightness(${brightness}%) contrast(${contrast + sharpness}%) saturate(${saturation}%) blur(${blur}px) ${grayscale ? 'grayscale(100%)' : ''
                          }`,
                      }}
                    />
                  ) : null}
                </div>
              </div>

              {/* RIGHT: Tool Controls */}
              <div className="image-controls-panel">
                <h4 className="controls-panel-title">Tool Configuration</h4>

                {/* Resize Controls with Presets */}
                {(groupId === 'img-transformer' || groupId === 'image-editor' || utilityId === 'img-resize') && (
                  <div className="control-group-block">
                    <span className="group-heading">Dimensions & Presets</span>
                    <div className="preset-buttons-row">
                      <button
                        className="tool-btn secondary small-btn"
                        onClick={() => applyPreset('100%')}
                        type="button"
                      >
                        100%
                      </button>
                      <button
                        className="tool-btn secondary small-btn"
                        onClick={() => applyPreset('75%')}
                        type="button"
                      >
                        75%
                      </button>
                      <button
                        className="tool-btn secondary small-btn"
                        onClick={() => applyPreset('50%')}
                        type="button"
                      >
                        50%
                      </button>
                      <button
                        className="tool-btn secondary small-btn"
                        onClick={() => applyPreset('1080p')}
                        type="button"
                      >
                        1080p
                      </button>
                      <button
                        className="tool-btn secondary small-btn"
                        onClick={() => applyPreset('720p')}
                        type="button"
                      >
                        720p
                      </button>
                    </div>

                    <div className="dimension-inputs-row">
                      <div className="input-field">
                        <label>Width (px)</label>
                        <input
                          type="number"
                          className="control-input"
                          value={targetWidth}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTargetWidth(val);
                            if (lockAspect && origDimensions) {
                              setTargetHeight(Math.round(val / (origDimensions.w / origDimensions.h)));
                            }
                          }}
                        />
                      </div>
                      <div className="input-field">
                        <label>Height (px)</label>
                        <input
                          type="number"
                          className="control-input"
                          value={targetHeight}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTargetHeight(val);
                            if (lockAspect && origDimensions) {
                              setTargetWidth(Math.round(val * (origDimensions.w / origDimensions.h)));
                            }
                          }}
                        />
                      </div>
                    </div>
                    <label className="checkbox-control">
                      <input
                        type="checkbox"
                        checked={lockAspect}
                        onChange={(e) => setLockAspect(e.target.checked)}
                      />
                      <span>Lock aspect ratio</span>
                    </label>
                  </div>
                )}

                {/* Crop & Aspect ratio */}
                {utilityId === 'img-crop' && (
                  <div className="control-group-block">
                    <span className="group-heading">Crop Aspect Ratio</span>
                    <div className="preset-buttons-row">
                      <button
                        className={`tool-btn secondary small-btn ${cropAspect === 'free' ? 'active' : ''}`}
                        onClick={() => setCropAspect('free')}
                        type="button"
                      >
                        Free
                      </button>
                      <button
                        className={`tool-btn secondary small-btn ${cropAspect === '1:1' ? 'active' : ''}`}
                        onClick={() => {
                          setCropAspect('1:1');
                          if (origDimensions) {
                            const minSide = Math.min(origDimensions.w, origDimensions.h);
                            setTargetWidth(minSide);
                            setTargetHeight(minSide);
                          }
                        }}
                        type="button"
                      >
                        1:1 Square
                      </button>
                      <button
                        className={`tool-btn secondary small-btn ${cropAspect === '4:3' ? 'active' : ''}`}
                        onClick={() => {
                          setCropAspect('4:3');
                          if (origDimensions) {
                            setTargetHeight(Math.round((origDimensions.w * 3) / 4));
                          }
                        }}
                        type="button"
                      >
                        4:3
                      </button>
                      <button
                        className={`tool-btn secondary small-btn ${cropAspect === '16:9' ? 'active' : ''}`}
                        onClick={() => {
                          setCropAspect('16:9');
                          if (origDimensions) {
                            setTargetHeight(Math.round((origDimensions.w * 9) / 16));
                          }
                        }}
                        type="button"
                      >
                        16:9
                      </button>
                    </div>
                  </div>
                )}

                {/* SVG to PNG Scale */}
                {utilityId === 'img-svg-to-png' && (
                  <div className="control-group-block">
                    <span className="group-heading">Vector Rasterization Scale</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      {[1, 2, 3, 4].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`segmented-chip-btn ${svgScale === s ? 'active' : ''}`}
                          onClick={() => setSvgScale(s)}
                        >
                          {s}x ({s * 100}%)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Watermark Controls */}
                {utilityId === 'img-batch-watermark' && (
                  <div className="control-group-block">
                    <span className="group-heading">Watermark Settings</span>
                    <div className="input-field" style={{ marginBottom: '8px' }}>
                      <label>Watermark Text</label>
                      <input
                        type="text"
                        className="control-input"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="e.g. CONFIDENTIAL"
                      />
                    </div>
                    <div className="input-field" style={{ marginBottom: '8px' }}>
                      <label>Placement Position</label>
                      <select
                        className="control-input"
                        value={watermarkPos}
                        onChange={(e) => setWatermarkPos(e.target.value as any)}
                      >
                        <option value="bottom-right">Bottom-Right Corner</option>
                        <option value="center">Centered (Diagonal)</option>
                        <option value="top-left">Top-Left Corner</option>
                        <option value="tile">Tiled Grid Repeat</option>
                      </select>
                    </div>
                    <div className="slider-row">
                      <div className="slider-header">
                        <label>Opacity</label>
                        <span className="slider-val">{Math.round(watermarkOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={Math.round(watermarkOpacity * 100)}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value) / 100)}
                      />
                    </div>
                  </div>
                )}

                {/* Collage / Contact Sheet */}
                {utilityId === 'img-collage-sheet' && (
                  <div className="control-group-block">
                    <span className="group-heading">Contact Sheet Layout</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Columns:</label>
                      {[2, 3, 4, 5].map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          className={`segmented-chip-btn ${collageCols === cols ? 'active' : ''}`}
                          onClick={() => setCollageCols(cols)}
                        >
                          {cols} Cols
                        </button>
                      ))}
                    </div>
                    <label className="checkbox-control">
                      <input
                        type="checkbox"
                        checked={collageLabels}
                        onChange={(e) => setCollageLabels(e.target.checked)}
                      />
                      <span>Show filename labels below thumbnails</span>
                    </label>
                  </div>
                )}

                {/* Sprite Sheet */}
                {utilityId === 'img-sprite-sheet' && (
                  <div className="control-group-block">
                    <span className="group-heading">Sprite Packing Layout</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      {(['grid', 'horizontal', 'vertical'] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          className={`segmented-chip-btn ${spriteLayout === l ? 'active' : ''}`}
                          onClick={() => setSpriteLayout(l)}
                        >
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Before / After Compare */}
                {utilityId === 'img-before-after' && (
                  <div className="control-group-block">
                    <span className="group-heading">Comparison Setup</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '4px 0 8px 0' }}>
                      Loaded {files.length} images. Click below to generate pixel-level difference analysis highlighting altered areas.
                    </p>
                  </div>
                )}

                {/* GIF / WebP Builder */}
                {utilityId === 'img-gif-webp-builder' && (
                  <div className="control-group-block">
                    <span className="group-heading">Animation Speed</span>
                    <div className="slider-row">
                      <div className="slider-header">
                        <label>Frame Delay</label>
                        <span className="slider-val">{animDelay} ms</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={1000}
                        step={50}
                        value={animDelay}
                        onChange={(e) => setAnimDelay(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {/* Rotate & Flip */}
                {(groupId === 'img-transformer' || groupId === 'image-editor' || utilityId === 'img-rotate') && (
                  <div className="control-group-block">
                    <span className="group-heading">Orientation</span>
                    <div className="orientation-btns-row">
                      <button
                        className="tool-btn secondary"
                        onClick={() => setRotation(((rotation + 90) % 360) as any)}
                        type="button"
                      >
                        <RotateCw size={13} />
                        <span>Rotate 90°</span>
                      </button>
                      <button
                        className={`tool-btn secondary ${flipH ? 'active' : ''}`}
                        onClick={() => setFlipH(!flipH)}
                        type="button"
                      >
                        <span>Flip H</span>
                      </button>
                      <button
                        className={`tool-btn secondary ${flipV ? 'active' : ''}`}
                        onClick={() => setFlipV(!flipV)}
                        type="button"
                      >
                        <span>Flip V</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Compression & Quality */}
                {(utilityId === 'img-converter' || utilityId === 'img-optimizer') && (
                  <div className="control-group-block">
                    <span className="group-heading">Compression & Format</span>
                    <div className="input-field">
                      <label>Target Format</label>
                      <select
                        className="control-input"
                        value={format}
                        onChange={(e) => setFormat(e.target.value as any)}
                      >
                        <option value="image/webp">WebP (Optimized)</option>
                        <option value="image/jpeg">JPG (Universal)</option>
                        <option value="image/png">PNG (Lossless)</option>
                      </select>
                    </div>
                    <div className="slider-row">
                      <div className="slider-header">
                        <label>Quality</label>
                        <span className="slider-val">{quality}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                      />
                    </div>
                    {estimatedOutputSize && (
                      <div className="estimated-size-box">
                        <span className="est-label">Estimated Output Size:</span>
                        <span className="est-val">
                          ~{(estimatedOutputSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Adjustments (Brightness, Contrast, Saturation, Sharpness, Blur, Grayscale) */}
                {utilityId === 'img-adjustments' && (
                  <div className="control-group-block">
                    <span className="group-heading">Color & Visual Adjustments</span>
                    <div className="slider-row">
                      <div className="slider-header">
                        <label>Brightness</label>
                        <span className="slider-val">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={200}
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                      />
                    </div>
                    <div className="slider-row">
                      <div className="slider-header">
                        <label>Contrast</label>
                        <span className="slider-val">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={200}
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                      />
                    </div>
                    <div className="slider-row">
                      <div className="slider-header">
                        <label>Saturation</label>
                        <span className="slider-val">{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                      />
                    </div>
                    <div className="slider-row">
                      <div className="slider-header">
                        <label>Sharpness</label>
                        <span className="slider-val">+{sharpness}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={sharpness}
                        onChange={(e) => setSharpness(Number(e.target.value))}
                      />
                    </div>
                    <div className="slider-row">
                      <div className="slider-header">
                        <label>Blur</label>
                        <span className="slider-val">{blur}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={blur}
                        onChange={(e) => setBlur(Number(e.target.value))}
                      />
                    </div>
                    <label className="checkbox-control">
                      <input
                        type="checkbox"
                        checked={grayscale}
                        onChange={(e) => setGrayscale(e.target.checked)}
                      />
                      <span>Grayscale monochrome</span>
                    </label>
                  </div>
                )}

                {/* Metadata & EXIF Viewer */}
                {utilityId === 'img-metadata' && exifTags && (
                  <div className="control-group-block">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span className="group-heading" style={{ margin: 0 }}>
                        EXIF Information
                      </span>
                      <button
                        className="tool-btn secondary small-btn"
                        onClick={handleStripExif}
                        type="button"
                      >
                        <ShieldCheck size={12} color="var(--success)" />
                        <span>Strip EXIF</span>
                      </button>
                    </div>
                    <div className="exif-tags-table">
                      {Object.entries(exifTags).map(([k, v]) => (
                        <div key={k} className="exif-row">
                          <span className="exif-k">{k}:</span>
                          <span className="exif-v">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM: Original / Output Information */}
            <div className="image-bottom-action-bar">
              <div className="bottom-info-strip">
                <span className="info-chip">
                  Original: <strong>{(files[0].size / 1024).toFixed(1)} KB</strong>
                </span>
                {origDimensions && (
                  <span className="info-chip">
                    Dimensions:{' '}
                    <strong>
                      {targetWidth} × {targetHeight}
                    </strong>
                  </span>
                )}
                <span className="info-chip">
                  Format: <strong>{getFormatExtension().toUpperCase()}</strong>
                </span>
              </div>

              <div className="bottom-buttons-strip">
                <button
                  className="tool-btn primary"
                  onClick={handleProcessImage}
                  disabled={isProcessing}
                  type="button"
                >
                  <Download size={13} />
                  <span>{`Apply & Export ${getFormatExtension().toUpperCase()}`}</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <ErrorPanel
                category="processing_failed"
                title="Image Processing Error"
                message={errorMsg}
                onRetry={handleProcessImage}
                onChooseAnother={handleReset}
              />
            )}
          </div>
        ) : (
          /* Result Screen */
          <>
            <ResultViewer
              title={`${toolName} Completed`}
              outputName={`toiloki_${utilityId}_output.${getFormatExtension()}`}
              outputBuffer={result.outputBuffer}
              originalSize={files[0]?.size}
              outputSize={result.outputBuffer?.length}
              elapsedMs={result.elapsedMs}
              defaultExtension={getFormatExtension()}
              inputFormat={files[0]?.name.split('.').pop() || 'img'}
              outputFormat={getFormatExtension()}
              originalDimensions={origDimensions ? { width: origDimensions.w, height: origDimensions.h } : undefined}
              newDimensions={{ width: targetWidth, height: targetHeight }}
              onPreview={() => setIsPreviewOpen(true)}
              onReset={handleReset}
            />

            {diffMeta && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--accent-soft)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '12px', fontWeight: 600 }}>
                {diffMeta}
              </div>
            )}

            {spriteCss && (
              <div style={{ marginTop: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>Generated CSS Coordinates:</span>
                  <button
                    className="tool-btn secondary small-btn"
                    onClick={() => navigator.clipboard.writeText(spriteCss)}
                  >
                    Copy CSS
                  </button>
                </div>
                <pre style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontFamily: 'var(--font-mono)', overflowX: 'auto', color: 'var(--text)' }}>
                  {spriteCss}
                </pre>
              </div>
            )}

            {resultUrl && (
              <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                type="image"
                title={`Processed ${toolName}`}
                imageUrl={resultUrl}
                imageDimensions={{ width: targetWidth, height: targetHeight }}
                fileSize={result.outputBuffer?.length}
              />
            )}
          </>
        )}
      </div>
    </ToolLayout>
  );
};
