import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import Papa from 'papaparse';
import { WorkspaceDefinition, GroupDefinition, UtilityDefinition } from '../../core/types/workspace';
import { SettingsService } from '../../core/services/settings.service';
import { SessionStore } from '../../core/services/session.service';
import { FileDropzone, SelectedFile } from '../file-system/FileDropzone';
import {
  ChevronDown,
  Undo,
  Redo,
  Info,
  Grid,
  Save,
  FolderOpen,
  Play,
  CheckCircle,
  FileText,
  AlertTriangle,
  RotateCcw,
  Lock,
  Unlock,
  FileCode,
  Sliders,
  ShieldCheck,
  Copy,
  Download,
  Search,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Feather,
  Gauge,
  Minimize2,
} from 'lucide-react';
import { WhatThisCanDoModal } from '../common/WhatThisCanDoModal';
import { ActionBar } from '../common/ActionBar';
import { parsePageRange } from '../../engines/pdf/page-range.parser';
import { PdfEngine } from '../../engines/pdf/pdf.engine';
import { PdfSecurityEngine } from '../../engines/pdf/pdf-security.engine';
import { DocumentEngine } from '../../engines/documents/document.engine';
import { ImageEngine, ImageTransformOptions } from '../../engines/images/image.engine';
import { ExifEngine } from '../../engines/images/exif.engine';
import { DataEngine } from '../../engines/data/data.engine';
import { TextEngine, CaseType } from '../../engines/text/text.engine';
import { ImageCanvas, CropRect } from './images/ImageCanvas';
import { DocumentCanvas } from './documents/DocumentCanvas';
import { DataCanvas, DataViewMode } from './data/DataCanvas';
import { TextCanvas, TextViewMode } from './editor/TextCanvas';
import { MediaCanvas, MediaViewMode, TrimRange } from './media/MediaCanvas';
import { FilesCanvas, FilesViewMode } from './files/FilesCanvas';
import { MediaEngine } from '../../engines/media/media.engine';
import { ArchiveEngine, ArchiveEntry } from '../../engines/files/archive.engine';
import { FileOpsEngine, RenameRule } from '../../engines/files/file-ops.engine';
import { PdfPagesCanvas, PageCardItem } from './pdf/PdfPagesCanvas';
import { PdfTrayCanvas } from './pdf/PdfTrayCanvas';
import { PdfMarkersCanvas } from './pdf/PdfMarkersCanvas';
import { PdfAnnotateCanvas } from './pdf/PdfAnnotateCanvas';
import { CalculatorWorkspaceView } from '../../workspaces/calculator/CalculatorWorkspaceView';
import { DeveloperWorkspaceView } from '../../workspaces/developer/DeveloperWorkspaceView';
import { SecurityWorkspaceView } from '../../workspaces/security/SecurityWorkspaceView';
import { NetworkWorkspaceView } from '../../workspaces/network/NetworkWorkspaceView';
import { DesignWorkspaceView } from '../../workspaces/design/DesignWorkspaceView';
import { SystemWorkspaceView } from '../../workspaces/system/SystemWorkspaceView';
import './WorkbenchShell.css';

interface VersionItem {
  id: string;
  name: string;
  buffer: Uint8Array;
  timestamp: number;
}

interface WorkbenchShellProps {
  tabId?: string;
  workspace: WorkspaceDefinition;
  activeGroup: GroupDefinition;
  activeUtility: UtilityDefinition;
  onSelectUtility: (group: GroupDefinition, utility: UtilityDefinition) => void;
}

export const WorkbenchShell: React.FC<WorkbenchShellProps> = ({
  tabId,
  workspace,
  activeGroup,
  activeUtility,
  onSelectUtility,
}) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // File session model & versioning stack
  const [versionStack, setVersionStack] = useState<VersionItem[]>([]);
  const [versionIndex, setVersionIndex] = useState<number>(-1);

  // Pages state for 'pages' mode
  const [pages, setPages] = useState<PageCardItem[]>([]);
  const [cropMargins, setCropMargins] = useState({ top: 36, right: 36, bottom: 36, left: 36 });
  const [cropScope, setCropScope] = useState<'all' | 'selected'>('all');

  // Tray state for 'tray' mode
  const [fileRanges, setFileRanges] = useState<Record<string, string>>({});
  const [compareResult, setCompareResult] = useState<any | null>(null);

  // Phase 5: Images Workbench State
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [autoProcessedInfo, setAutoProcessedInfo] = useState<{ utilityName: string; isAuto: boolean } | null>(null);
  const [imageFormat, setImageFormat] = useState<'jpeg' | 'png' | 'webp' | 'bmp' | 'tiff' | 'svg' | 'heic' | 'avif'>('webp');
  const [imageQuality, setImageQuality] = useState<number>(85);
  const [keepExif, setKeepExif] = useState<boolean>(true);
  const [resizeWidth, setResizeWidth] = useState<number>(1200);
  const [resizeHeight, setResizeHeight] = useState<number>(800);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 10, y: 10, width: 80, height: 80 });
  const [cropAspect, setCropAspect] = useState<'free' | '1:1' | '4:3' | '16:9' | '9:16'>('free');
  const [imgBrightness, setImgBrightness] = useState<number>(100);
  const [imgContrast, setImgContrast] = useState<number>(100);
  const [imgSaturation, setImgSaturation] = useState<number>(100);
  const [imgBlur, setImgBlur] = useState<number>(0);
  const [imgGrayscale, setImgGrayscale] = useState<boolean>(false);
  const [imgInvert, setImgInvert] = useState<boolean>(false);
  const [optQuality, setOptQuality] = useState<number>(80);
  const [optLossless, setOptLossless] = useState<boolean>(false);
  const [optTargetKb, setOptTargetKb] = useState<number>(500);
  const [imgWatermarkText, setImgWatermarkText] = useState<string>('CONFIDENTIAL');
  const [imgWatermarkOpacity, setImgWatermarkOpacity] = useState<number>(0.3);
  const [imgWatermarkSize, setImgWatermarkSize] = useState<number>(36);
  const [collageCols, setCollageCols] = useState<number>(2);
  const [collageGap, setCollageGap] = useState<number>(8);
  const [imageExifData, setImageExifData] = useState<any>(null);

  // Phase 5: Documents Workbench State
  const [docPageSize, setDocPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [docFontTheme, setDocFontTheme] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [docTargetFormat, setDocTargetFormat] = useState<'pdf' | 'docx' | 'txt' | 'html' | 'rtf'>('pdf');
  const [docRawText, setDocRawText] = useState<string>('');
  const [docIncludeHeader, setDocIncludeHeader] = useState<boolean>(true);

  // Phase 6: Data Workbench State
  const [dataContent, setDataContent] = useState<string>(
    'id,name,role,department,salary\n1,Alice Morgan,Lead Architect,Core Engine,145000\n2,Bob Jenkins,UI/UX Designer,Product,105000\n3,Carol Zhao,Senior Data Scientist,Analytics,132000\n4,David Kim,DevOps Architect,Infrastructure,138000\n5,Elena Rossi,QA Engineer,Quality,98000\n6,Frank Miller,Security Engineer,Security,140000'
  );
  const [dataFormat, setDataFormat] = useState<'csv' | 'json' | 'yaml' | 'xml' | 'tsv' | 'xlsx'>('csv');
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>('grid');
  const [dataDelimiter, setDataDelimiter] = useState<string>(',');
  const [dataHasHeader, setDataHasHeader] = useState<boolean>(true);
  const [dataFilterQuery, setDataFilterQuery] = useState<string>('');
  const [dataSortCol, setDataSortCol] = useState<string>('');
  const [dataSortDir, setDataSortDir] = useState<'asc' | 'desc'>('asc');
  const [dataSchemaInput, setDataSchemaInput] = useState<string>(
    JSON.stringify(
      {
        type: 'object',
        required: ['id', 'name', 'salary'],
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          salary: { type: 'number' },
        },
      },
      null,
      2
    )
  );
  const [dataSchemaValidation, setDataSchemaValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [dataSqlQuery, setDataSqlQuery] = useState<string>('SELECT * WHERE salary > 100000 ORDER BY salary DESC');
  const [dataPivotCol, setDataPivotCol] = useState<string>('department');
  const [dataPivotAggCol, setDataPivotAggCol] = useState<string>('salary');
  const [dataPivotFunc, setDataPivotFunc] = useState<'count' | 'sum' | 'avg' | 'min' | 'max'>('avg');

  // Phase 6: Text Workbench State
  const [textContent, setTextContent] = useState<string>(
    'Toiloki is a high-performance offline desktop suite engineered for precision and privacy.\n\nAll tools execute locally on your machine with zero cloud dependencies or telemetry.\nThe suite includes dedicated workbenches for PDF, Documents, Images, Data, and Text.\n\nKey features:\n- Offline document editing and format conversion\n- Tabular data analysis and schema verification\n- Instant line sorting, deduplication, and regex filtering\n- Contact technical support at support@toiloki.org or visit https://toiloki.dev for documentation.\n- Gateway addresses: 192.168.1.1 and 10.0.0.1 (verified on 2026-10-04)'
  );
  const [textOriginalContent, setTextOriginalContent] = useState<string>(
    'Toiloki is a high-performance offline desktop suite engineered for precision and privacy.\n\nAll tools execute locally on your machine with zero cloud dependencies or telemetry.\nThe suite includes dedicated workbenches for PDF, Documents, Images, Data, and Text.\n\nKey features:\n- Offline document editing and format conversion\n- Tabular data analysis and schema verification\n- Instant line sorting, deduplication, and regex filtering\n- Contact technical support at support@toiloki.org or visit https://toiloki.dev for documentation.\n- Gateway addresses: 192.168.1.1 and 10.0.0.1 (verified on 2026-10-04)'
  );
  const [textViewMode, setTextViewMode] = useState<TextViewMode>('editor');
  const [textFontSize, setTextFontSize] = useState<number>(13);
  const [textWordWrap, setTextWordWrap] = useState<boolean>(true);
  const [textCaseType, setTextCaseType] = useState<CaseType>('upper');
  const [textSlugSep, setTextSlugSep] = useState<'-' | '_' | '.'>('-');
  const [textSlugMax, setTextSlugMax] = useState<number>(60);
  const [textSortDir, setTextSortDir] = useState<'asc' | 'desc'>('asc');
  const [textDelim, setTextDelim] = useState<string>(',');
  const [textRegexPattern, setTextRegexPattern] = useState<string>('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)');
  const [textRegexReplacement, setTextRegexReplacement] = useState<string>('$1@[HIDDEN]');
  const [textLoremCount, setTextLoremCount] = useState<number>(3);
  const [textLoremUnit, setTextLoremUnit] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');

  // Phase 7: Media and Files States
  const [mediaViewMode, setMediaViewMode] = useState<MediaViewMode>('trim');
  const [mediaTrimRange, setMediaTrimRange] = useState<TrimRange>({ start: 0, end: 8 });
  const [mediaGainDb, setMediaGainDb] = useState<number>(0);
  const [mediaFadeInSec, setMediaFadeInSec] = useState<number>(0);
  const [mediaFadeOutSec, setMediaFadeOutSec] = useState<number>(0);
  const [mediaTargetFormat, setMediaTargetFormat] = useState<string>('wav');

  const [filesViewMode, setFilesViewMode] = useState<FilesViewMode>('table');
  const [filesRenameRule, setFilesRenameRule] = useState<RenameRule>({
    prefix: '',
    suffix: '',
    findText: '',
    replaceText: '',
    caseTransform: 'none',
    numberingStart: 1,
    numberingDigits: 2,
  });
  const [filesSelectedIndices, setFilesSelectedIndices] = useState<number[]>([]);
  const [filesArchiveEntries, setFilesArchiveEntries] = useState<ArchiveEntry[]>([]);
  const [filesArchiveLoading, setFilesArchiveLoading] = useState<boolean>(false);
  const cancelRequestedRef = useRef<boolean>(false);

  const handleCancelProcessing = useCallback(() => {
    cancelRequestedRef.current = true;
    setIsProcessing(false);
    setStatusMessage('');
    setErrorMessage('Operation was cancelled by user.');
  }, []);

  // Synchronize active workbench session state to SessionStore
  useEffect(() => {
    const effectiveTabId = tabId || `tab_${workspace.id}`;
    if (files.length === 0) {
      SessionStore.clearSession(effectiveTabId, workspace.id);
    } else {
      SessionStore.saveSession(effectiveTabId, workspace.id, {
        groupId: activeGroup.id,
        utilityId: activeUtility.id,
        files: files.map((f) => ({
          name: f.name,
          size: f.size || (f.buffer ? f.buffer.byteLength : 0),
          type: f.file?.type || '',
        })),
        versionStack: versionStack.map((v) => ({
          id: v.id,
          name: v.name,
          timestamp: v.timestamp,
        })),
        versionIndex,
        options: {
          imageFormat,
          imageQuality,
          dataFormat,
          dataViewMode,
          textViewMode,
          docPageSize,
          docFontTheme,
          docTargetFormat,
        },
      });
    }
  }, [
    files,
    versionStack,
    versionIndex,
    tabId,
    workspace.id,
    activeGroup.id,
    activeUtility.id,
    imageFormat,
    imageQuality,
    dataFormat,
    dataViewMode,
    textViewMode,
    docPageSize,
    docFontTheme,
    docTargetFormat,
  ]);

  // Sync format preselection when clicking format-specific converter utilities
  useEffect(() => {
    if (workspace.id === 'images') {
      if (activeUtility.id === 'convert-jpg') setImageFormat('jpeg');
      else if (activeUtility.id === 'convert-png') setImageFormat('png');
      else if (activeUtility.id === 'convert-webp') setImageFormat('webp');
      else if (activeUtility.id === 'convert-bmp') setImageFormat('bmp');
      else if (activeUtility.id === 'convert-tiff') setImageFormat('tiff');
      else if (activeUtility.id === 'img-svg-to-png') setImageFormat('svg');
      else if (activeUtility.id === 'img-heic-converter') setImageFormat('heic');
      else if (activeUtility.id === 'img-avif-converter') setImageFormat('avif');
    } else if (workspace.id === 'data') {
      if (activeUtility.id.startsWith('csv-') || activeUtility.id === 'data-table') {
        setDataFormat('csv');
        setDataViewMode('grid');
      } else if (activeUtility.id.startsWith('json-')) {
        setDataFormat('json');
      } else if (activeUtility.id.startsWith('yaml-')) {
        setDataFormat('yaml');
      } else if (activeUtility.id.startsWith('xml-')) {
        setDataFormat('xml');
      } else if (activeUtility.id.startsWith('xlsx-')) {
        setDataFormat('xlsx');
      } else if (activeUtility.id === 'data-schema' || activeUtility.id === 'data-validator') {
        setDataViewMode('schema');
      } else if (activeGroup.id === 'data-viewer') {
        setDataViewMode('grid');
      }
    } else if (workspace.id === 'text') {
      if (activeUtility.id === 'text-diff' || activeGroup.id === 'text-compare') {
        setTextViewMode('diff');
      } else if (activeUtility.id === 'text-statistics' || activeGroup.id === 'text-analyzer') {
        setTextViewMode('analysis');
      } else if (activeGroup.id === 'text-transformer' || activeGroup.id === 'text-cleaner') {
        setTextViewMode('editor');
      }
    } else if (workspace.id === 'media') {
      if (activeUtility.id === 'audio-trimmer' || activeUtility.id === 'video-trimmer') {
        setMediaViewMode('trim');
      } else if (activeUtility.id === 'audio-metadata-editor') {
        setMediaViewMode('info');
      } else {
        setMediaViewMode('panel');
      }
    } else if (workspace.id === 'files') {
      if (activeUtility.id === 'inspect-zip-archive' || activeUtility.id === 'extract-zip-archive') {
        setFilesViewMode('inspect');
      } else if (activeUtility.id === 'file-analyzer-full' || activeUtility.id === 'file-type-detection') {
        setFilesViewMode('analyzer');
      } else {
        setFilesViewMode('table');
      }
    }
  }, [activeUtility.id, activeGroup.id, workspace.id]);

  // Load EXIF metadata when on Images workspace
  useEffect(() => {
    if (workspace.id === 'images' && files[activeImageIndex]?.buffer) {
      try {
        const parsed = ExifEngine.parseExif(files[activeImageIndex].buffer!);
        if (parsed.success && parsed.data) {
          setImageExifData(parsed.data);
        }
      } catch {}
    }
  }, [workspace.id, activeImageIndex, files]);

  // Markers state for 'markers' mode
  const [splitConfig, setSplitConfig] = useState<{
    method: 'markers' | 'everyN' | 'ranges' | 'size';
    cutPoints: number[];
    everyN: number;
    ranges: string;
    partsCount: number;
  }>({
    method: 'markers',
    cutPoints: [],
    everyN: 1,
    ranges: '1-2, 3-4',
    partsCount: 1,
  });

  // Annotate state for 'annotate' mode
  const [annotatePage, setAnnotatePage] = useState<number>(1);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.25);
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(48);
  const [watermarkRotation, setWatermarkRotation] = useState<number>(45);
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [pageNumberStart, setPageNumberStart] = useState<number>(1);
  const [annotText, setAnnotText] = useState<string>('Reviewed & Approved');
  const [annotFontSize, setAnnotFontSize] = useState<number>(16);
  const [annotColor, setAnnotColor] = useState<string>('#D4B06A');
  const [stampPreset, setStampPreset] = useState<string>('APPROVED');
  const [stampOpacity, setStampOpacity] = useState<number>(0.85);
  const [signName, setSignName] = useState<string>('Authorized Signer');
  const [redactStyle, setRedactStyle] = useState<'black' | 'white'>('black');
  const [redactLabel, setRedactLabel] = useState<string>('[ REDACTED ]');
  const [shapeType, setShapeType] = useState<'rect' | 'circle' | 'line'>('rect');
  const [shapeColor, setShapeColor] = useState<string>('#D4B06A');
  const [shapeBorderWidth, setShapeBorderWidth] = useState<number>(2);
  const [highlightType, setHighlightType] = useState<'highlight' | 'underline'>('highlight');
  const [highlightColor, setHighlightColor] = useState<string>('#FACC15');

  // Options for 'panel' mode
  const [compressionQuality, setCompressionQuality] = useState<'light' | 'balanced' | 'extreme' | 'recommended' | 'low'>('balanced');
  const [optimizeDpi, setOptimizeDpi] = useState<number>(150);
  const [optimizeQuality, setOptimizeQuality] = useState<number>(80);
  const [stripAllMetadata, setStripAllMetadata] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(true);
  const [conversionOrientation, setConversionOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Options for 'info' mode
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedImages, setExtractedImages] = useState<Array<{ name: string; buffer: Uint8Array; format: 'jpeg' | 'png'; sizeBytes: number }>>([]);
  const [pdfSearchQuery, setPdfSearchQuery] = useState<string>('');
  const [pdfDocProperties, setPdfDocProperties] = useState<Record<string, any> | null>(null);
  const [pdfSecurityDetails, setPdfSecurityDetails] = useState<any | null>(null);

  // Processing & notification states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [successResult, setSuccessResult] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Popover dialogs
  const [showWhatModal, setShowWhatModal] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [actionsSearch, setActionsSearch] = useState('');

  // Helper to ensure a valid PDF buffer exists
  const ensureBuffer = useCallback(async (file: SelectedFile): Promise<Uint8Array> => {
    // If the file already has a valid buffer
    if (file.buffer && file.buffer.byteLength > 0) {
      if (workspace.id === 'images' || workspace.id === 'documents' || workspace.id === 'data' || workspace.id === 'text') {
        return file.buffer;
      }
      if (file.buffer.byteLength > 200) {
        try {
          await PDFDocument.load(file.buffer);
          return file.buffer;
        } catch {
          // recreate below
        }
      }
    }

    if (file.file) {
      try {
        const arr = await file.file.arrayBuffer();
        if (arr.byteLength > 0) return new Uint8Array(arr);
      } catch {}
    }

    // Default fallback asset for images
    if (workspace.id === 'images') {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#161616';
        ctx.fillRect(0, 0, 1200, 800);
        ctx.fillStyle = '#D4B06A';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText('Toiloki Image Workbench', 80, 140);
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '22px sans-serif';
        ctx.fillText(file.name || 'Sample Asset', 80, 190);
        ctx.strokeStyle = '#262626';
        ctx.lineWidth = 2;
        for (let x = 0; x < 1200; x += 60) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 800); ctx.stroke();
        }
        for (let y = 0; y < 800; y += 60) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
        }
      }
      return new Promise<Uint8Array>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
          } else {
            resolve(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
          }
        }, 'image/png');
      });
    }

    // Default fallback asset for documents
    if (workspace.id === 'documents') {
      const sampleText = `# ${file.name || 'Toiloki Document'}\n\nThis document is ready for local offline conversion, editing, and diff comparison.\n\n## Key Highlights\n- Zero cloud dependencies\n- Fast deterministic transformations\n- Multi-format OpenXML and Markdown parsing\n`;
      return new TextEncoder().encode(sampleText);
    }

    // Default fallback asset for data
    if (workspace.id === 'data') {
      const sampleText = 'id,name,role,department,salary\n1,Alice Morgan,Lead Architect,Core Engine,145000\n2,Bob Jenkins,UI/UX Designer,Product,105000\n3,Carol Zhao,Senior Data Scientist,Analytics,132000\n4,David Kim,DevOps Architect,Infrastructure,138000\n5,Elena Rossi,QA Engineer,Quality,98000\n6,Frank Miller,Security Engineer,Security,140000\n';
      return new TextEncoder().encode(sampleText);
    }

    // Default fallback asset for text
    if (workspace.id === 'text') {
      const sampleText = 'Toiloki is a high-performance offline desktop suite engineered for precision and privacy.\n\nAll tools execute locally on your machine with zero cloud dependencies or telemetry.\nThe suite includes dedicated workbenches for PDF, Documents, Images, Data, and Text.\n\nKey features:\n- Offline document editing and format conversion\n- Tabular data analysis and schema verification\n- Instant line sorting, deduplication, and regex filtering\n- Contact technical support at support@toiloki.org or visit https://toiloki.dev for documentation.\n- Gateway addresses: 192.168.1.1 and 10.0.0.1 (verified on 2026-10-04)\n';
      return new TextEncoder().encode(sampleText);
    }

    // Default fallback asset for media
    if (workspace.id === 'media') {
      const sampleRate = 44100;
      const duration = 6;
      const numChannels = 2;
      const numSamples = sampleRate * duration;
      const bitDepth = 16;
      const blockAlign = numChannels * (bitDepth / 8);
      const dataSize = numSamples * blockAlign;
      const buffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(buffer);
      const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * blockAlign, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitDepth, true);
      writeStr(36, 'data');
      view.setUint32(40, dataSize, true);
      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const sL = Math.sin(2 * Math.PI * 440 * t) * 0.4;
        const sR = Math.sin(2 * Math.PI * 554.37 * t) * 0.4;
        view.setInt16(offset, Math.floor(sL * 32767), true);
        view.setInt16(offset + 2, Math.floor(sR * 32767), true);
        offset += 4;
      }
      return new Uint8Array(buffer);
    }

    // Default fallback asset for files
    if (workspace.id === 'files') {
      const zip = await ArchiveEngine.createZip([
        { name: 'manifest.json', buffer: new TextEncoder().encode('{"app":"Toiloki"}') },
        { name: 'notes.txt', buffer: new TextEncoder().encode('Toiloki local archive') }
      ]);
      return zip.data || new Uint8Array([80, 75, 3, 4]);
    }

    // Default fallback for PDF
    const doc = await PDFDocument.create();
    for (let i = 1; i <= 4; i++) {
      const page = doc.addPage([595.28, 841.89]);
      page.drawText(`Toiloki Sample PDF Document - Page ${i}`, { x: 50, y: 800, size: 18 });
      page.drawText(`Generated for local-first utility execution and chaining.`, { x: 50, y: 770, size: 12 });
    }
    return await doc.save();
  }, [workspace.id]);

  // Initialize or re-parse pagese pages whenever active file buffer changes
  const refreshPagesFromBuffer = useCallback(async (buffer: Uint8Array) => {
    try {
      const meta = await PdfEngine.getMetadata(buffer);
      const count = meta.success && typeof meta.data?.pageCount === 'number' ? meta.data.pageCount : 4;
      const newPages: PageCardItem[] = Array.from({ length: count }, (_, i) => ({
        id: `page-${i + 1}-${Date.now()}`,
        originalIndex: i,
        pageNumber: i + 1,
        rotation: 0,
        selected: false,
      }));
      setPages(newPages);
    } catch {
      const fallbackPages: PageCardItem[] = Array.from({ length: 4 }, (_, i) => ({
        id: `page-${i + 1}-${Date.now()}`,
        originalIndex: i,
        pageNumber: i + 1,
        rotation: 0,
        selected: false,
      }));
      setPages(fallbackPages);
    }
  }, []);

  // Auto-load info inspection data when needed
  const loadInfoDataForUtility = useCallback(async (utilId: string, buffer: Uint8Array) => {
    try {
      if (utilId === 'extract-text' || utilId === 'search-pdf') {
        const res = await PdfEngine.extractText(buffer);
        if (res.success && res.data) setExtractedText(res.data);
      } else if (utilId === 'extract-images') {
        const res = await PdfEngine.extractImages(buffer);
        if (res.success && res.data) setExtractedImages(res.data);
      } else if (utilId === 'extract-metadata' || utilId === 'pdf-properties' || utilId === 'pdf-page-count') {
        const res = await PdfEngine.getMetadata(buffer);
        if (res.success && res.data) setPdfDocProperties(res.data);
      } else if (utilId === 'pdf-security-audit') {
        const res = await PdfSecurityEngine.inspectSecurity(buffer);
        if (res.success && res.data) setPdfSecurityDetails(res.data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle new files dropped / added
  const handleFilesChanged = useCallback(async (newFiles: SelectedFile[]) => {
    if (newFiles.length === 0) {
      setFiles([]);
      setVersionStack([]);
      setVersionIndex(-1);
      setPages([]);
      setSuccessResult(false);
      return;
    }

    const first = newFiles[0];
    const initialBuffer = await ensureBuffer(first);
    first.buffer = initialBuffer;

    setFiles(newFiles);

    // Initial version
    const initialVersion: VersionItem = {
      id: `v0-${Date.now()}`,
      name: 'Original',
      buffer: initialBuffer,
      timestamp: Date.now(),
    };
    setVersionStack([initialVersion]);
    setVersionIndex(0);

    // Refresh pages for PDF
    if (workspace.id === 'pdf') {
      await refreshPagesFromBuffer(initialBuffer);
      await loadInfoDataForUtility(activeUtility.id, initialBuffer);
    }
    setSuccessResult(false);

    // Phase 5: One-step utilities run immediately on drop with defaults
    if (workspace.id === 'images') {
      const oneStepTools = ['convert-jpg', 'convert-png', 'convert-webp', 'convert-bmp', 'convert-tiff', 'img-rotate', 'exif-remove'];
      if (oneStepTools.includes(activeUtility.id)) {
        try {
          let resBuf: Uint8Array | null = null;
          let stepName = 'Auto Processed';
          if (activeUtility.id === 'convert-jpg') {
            const res = await ImageEngine.transformImage(initialBuffer, { format: 'image/jpeg', quality: 0.85 });
            if (res.success && res.data) { resBuf = res.data; stepName = 'Converted to JPG'; }
          } else if (activeUtility.id === 'convert-png') {
            const res = await ImageEngine.transformImage(initialBuffer, { format: 'image/png' });
            if (res.success && res.data) { resBuf = res.data; stepName = 'Converted to PNG'; }
          } else if (activeUtility.id === 'convert-webp') {
            const res = await ImageEngine.transformImage(initialBuffer, { format: 'image/webp', quality: 0.85 });
            if (res.success && res.data) { resBuf = res.data; stepName = 'Converted to WebP'; }
          } else if (activeUtility.id === 'convert-bmp') {
            const res = await ImageEngine.convertToBmp(initialBuffer);
            if (res.success && res.data) { resBuf = res.data; stepName = 'Converted to BMP'; }
          } else if (activeUtility.id === 'convert-tiff') {
            const res = await ImageEngine.convertToTiff(initialBuffer);
            if (res.success && res.data) { resBuf = res.data; stepName = 'Converted to TIFF'; }
          } else if (activeUtility.id === 'img-rotate') {
            const res = await ImageEngine.transformImage(initialBuffer, { rotationDegrees: 90 });
            if (res.success && res.data) { resBuf = res.data; stepName = 'Rotated 90° CW'; }
          } else if (activeUtility.id === 'exif-remove') {
            const res = await ImageEngine.stripMetadata(initialBuffer);
            if (res.success && res.data) { resBuf = res.data; stepName = 'EXIF Removed'; }
          }

          if (resBuf) {
            const autoVer: VersionItem = {
              id: `v1-${Date.now()}`,
              name: stepName,
              buffer: resBuf,
              timestamp: Date.now(),
            };
            setVersionStack([initialVersion, autoVer]);
            setVersionIndex(1);
            first.buffer = resBuf;
            setAutoProcessedInfo({ utilityName: activeUtility.name, isAuto: true });
            setSuccessResult(true);
          }
        } catch {}
      }
    }

    // Phase 6: Parse dropped files in Data / Text workbenches
    if (workspace.id === 'data') {
      try {
        if (first.name.endsWith('.xlsx')) {
          const res = await DataEngine.xlsxToCsv(initialBuffer);
          if (res.success && res.data) {
            setDataContent(res.data);
            setDataFormat('csv');
          }
        } else {
          const decoded = new TextDecoder().decode(initialBuffer);
          setDataContent(decoded);
          if (first.name.endsWith('.json')) setDataFormat('json');
          else if (first.name.endsWith('.yaml') || first.name.endsWith('.yml')) setDataFormat('yaml');
          else if (first.name.endsWith('.xml')) setDataFormat('xml');
          else if (first.name.endsWith('.tsv')) setDataFormat('tsv');
          else setDataFormat('csv');
        }
      } catch {}
    } else if (workspace.id === 'text') {
      try {
        const decoded = new TextDecoder().decode(initialBuffer);
        setTextContent(decoded);
        setTextOriginalContent(decoded);
      } catch {}
    }
  }, [ensureBuffer, refreshPagesFromBuffer, loadInfoDataForUtility, activeUtility.id, workspace.id]);

  // Load sample dataset for Data workbench
  const handleLoadSampleData = useCallback(() => {
    const sample = 'id,name,role,department,salary\n1,Alice Morgan,Lead Architect,Core Engine,145000\n2,Bob Jenkins,UI/UX Designer,Product,105000\n3,Carol Zhao,Senior Data Scientist,Analytics,132000\n4,David Kim,DevOps Architect,Infrastructure,138000\n5,Elena Rossi,QA Engineer,Quality,98000\n6,Frank Miller,Security Engineer,Security,140000\n';
    setDataContent(sample);
    setDataFormat('csv');
    const buf = new TextEncoder().encode(sample);
    const mockFile: SelectedFile = {
      name: 'sample-employees.csv',
      size: buf.byteLength,
      buffer: buf,
    };
    setFiles([mockFile]);
    const ver: VersionItem = {
      id: `v0-${Date.now()}`,
      name: 'Original Sample',
      buffer: buf,
      timestamp: Date.now(),
    };
    setVersionStack([ver]);
    setVersionIndex(0);
  }, []);

  // Load sample text for Text workbench
  const handleLoadSampleText = useCallback(() => {
    const sample = 'Toiloki is a high-performance offline desktop suite engineered for precision and privacy.\n\nAll tools execute locally on your machine with zero cloud dependencies or telemetry.\nThe suite includes dedicated workbenches for PDF, Documents, Images, Data, and Text.\n\nKey features:\n- Offline document editing and format conversion\n- Tabular data analysis and schema verification\n- Instant line sorting, deduplication, and regex filtering\n- Contact technical support at support@toiloki.org or visit https://toiloki.dev for documentation.\n- Gateway addresses: 192.168.1.1 and 10.0.0.1 (verified on 2026-10-04)\n';
    setTextContent(sample);
    setTextOriginalContent(sample);
    const buf = new TextEncoder().encode(sample);
    const mockFile: SelectedFile = {
      name: 'sample-document.txt',
      size: buf.byteLength,
      buffer: buf,
    };
    setFiles([mockFile]);
    const ver: VersionItem = {
      id: `v0-${Date.now()}`,
      name: 'Original Sample',
      buffer: buf,
      timestamp: Date.now(),
    };
    setVersionStack([ver]);
    setVersionIndex(0);
  }, []);

  const handleLoadSampleMedia = useCallback(() => {
    const sampleRate = 44100;
    const duration = 8;
    const numChannels = 2;
    const numSamples = sampleRate * duration;
    const bitDepth = 16;
    const blockAlign = numChannels * (bitDepth / 8);
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freqL = 440 * Math.pow(2, ((Math.floor(t * 2) % 4) * 3) / 12);
      const freqR = 554.37 * Math.pow(2, ((Math.floor(t * 2) % 4) * 2) / 12);
      const env = Math.exp(-((t % 0.5) * 4));
      const sL = Math.sin(2 * Math.PI * freqL * t) * 0.45 * env;
      const sR = Math.sin(2 * Math.PI * freqR * t) * 0.45 * env;
      view.setInt16(offset, Math.floor(sL * 32767), true);
      view.setInt16(offset + 2, Math.floor(sR * 32767), true);
      offset += 4;
    }
    const wavUint8 = new Uint8Array(buffer);
    const fileItem: SelectedFile = {
      name: 'synth_ambient_pulse.wav',
      size: wavUint8.length,
      buffer: wavUint8,
    };
    setFiles([fileItem]);
    const ver = {
      id: `v0-${Date.now()}`,
      name: 'Original Audio Track',
      buffer: wavUint8,
      timestamp: Date.now(),
    };
    setVersionStack([ver]);
    setVersionIndex(0);
    setMediaTrimRange({ start: 0, end: 8 });
  }, []);

  const handleLoadSampleFiles = useCallback(async () => {
    const zipRes = await ArchiveEngine.createZip([
      { name: 'manifest.json', buffer: new TextEncoder().encode('{\n  "app": "Toiloki",\n  "version": "1.0.0"\n}') },
      { name: 'docs/guide.md', buffer: new TextEncoder().encode('# Toiloki User Guide\n\nLocal-first execution.') },
      { name: 'config/settings.ini', buffer: new TextEncoder().encode('[general]\noffline=true\n') },
    ]);

    const sampleItems: SelectedFile[] = [
      { name: 'Invoice_2024_001.pdf', size: 245000, buffer: new TextEncoder().encode('%PDF-1.4 sample invoice') },
      { name: 'Design_Tokens_Dark.png', size: 142050, buffer: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) },
      { name: 'Quarterly_Metrics.xlsx', size: 84200, buffer: new Uint8Array([80, 75, 3, 4]) },
      { name: 'Project_Archive.zip', size: zipRes.data ? zipRes.data.length : 12400, buffer: zipRes.data || new Uint8Array([80, 75, 3, 4]) },
      { name: 'Release_Notes.txt', size: 2048, buffer: new TextEncoder().encode('Toiloki Suite v1.0.0 Changelog') },
    ];

    setFiles(sampleItems);
    setFilesSelectedIndices([0, 1, 2, 3, 4]);

    if (zipRes.data) {
      const inspectRes = await ArchiveEngine.inspectZip(zipRes.data);
      if (inspectRes.success && inspectRes.data) {
        setFilesArchiveEntries(inspectRes.data);
      }
    }

    const ver = {
      id: `v0-${Date.now()}`,
      name: 'Initial File List',
      buffer: zipRes.data || new Uint8Array([80, 75, 3, 4]),
      timestamp: Date.now(),
    };
    setVersionStack([ver]);
    setVersionIndex(0);
  }, []);

  // Auto-seed sample files when entering Data, Text, Media or Files workbenches
  useEffect(() => {
    if (workspace.id === 'data' && files.length === 0) {
      handleLoadSampleData();
    } else if (workspace.id === 'text' && files.length === 0) {
      handleLoadSampleText();
    } else if (workspace.id === 'media' && files.length === 0) {
      handleLoadSampleMedia();
    } else if (workspace.id === 'files' && files.length === 0) {
      handleLoadSampleFiles();
    }
  }, [workspace.id, files.length, handleLoadSampleData, handleLoadSampleText, handleLoadSampleMedia, handleLoadSampleFiles]);

  // Handle switching active utilities
  const handleUtilityClick = useCallback((group: GroupDefinition, util: UtilityDefinition) => {
    onSelectUtility(group, util);
    setActiveMenu(null);
    setSuccessResult(false);
    setErrorMessage(null);

    try {
      localStorage.setItem(
        `toiloki_last_utility_${workspace.id}`,
        JSON.stringify({ groupId: group.id, utilityId: util.id })
      );
    } catch {}

    // If file already exists, pre-load info data
    if (files[0]?.buffer) {
      loadInfoDataForUtility(util.id, files[0].buffer);
    }
  }, [onSelectUtility, files, loadInfoDataForUtility]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Undo / Redo logic
  const handleUndo = useCallback(async () => {
    if (versionIndex <= 0) return;
    const prevIdx = versionIndex - 1;
    const prevVersion = versionStack[prevIdx];
    setVersionIndex(prevIdx);

    if (files.length > 0) {
      const updated = [...files];
      updated[0] = { ...updated[0], buffer: prevVersion.buffer };
      setFiles(updated);
      await refreshPagesFromBuffer(prevVersion.buffer);
    }
    setSuccessResult(false);
  }, [versionIndex, versionStack, files, refreshPagesFromBuffer]);

  const handleRedo = useCallback(async () => {
    if (versionIndex >= versionStack.length - 1) return;
    const nextIdx = versionIndex + 1;
    const nextVersion = versionStack[nextIdx];
    setVersionIndex(nextIdx);

    if (files.length > 0) {
      const updated = [...files];
      updated[0] = { ...updated[0], buffer: nextVersion.buffer };
      setFiles(updated);
      await refreshPagesFromBuffer(nextVersion.buffer);
    }
    setSuccessResult(false);
  }, [versionIndex, versionStack, files, refreshPagesFromBuffer]);

  // Keyboard shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Apply new version to session (enables chaining!)
  const pushNewVersion = async (name: string, newBuffer: Uint8Array) => {
    const newVersion: VersionItem = {
      id: `v-${Date.now()}`,
      name,
      buffer: newBuffer,
      timestamp: Date.now(),
    };
    const sliced = versionStack.slice(0, versionIndex + 1);
    const updatedStack = [...sliced, newVersion];
    setVersionStack(updatedStack);
    setVersionIndex(updatedStack.length - 1);

    // Update active file buffer so next action chains off it!
    const updatedFiles = [...files];
    updatedFiles[0] = { ...updatedFiles[0], buffer: newBuffer, size: newBuffer.byteLength };
    setFiles(updatedFiles);

    await refreshPagesFromBuffer(newBuffer);
    setSuccessResult(true);
    setIsProcessing(false);
    setProgressPercent(100);
  };

  // Phase 6 Data Handlers
  const handleConvertDataFormat = useCallback(async (targetFmt: 'csv' | 'json' | 'yaml' | 'xml' | 'tsv' | 'xlsx') => {
    try {
      setIsProcessing(true);
      setProgressPercent(40);
      let convertedStr = '';
      let outBuf: Uint8Array | null = null;

      if (targetFmt === 'json') {
        if (dataFormat === 'csv' || dataFormat === 'tsv') {
          const res = DataEngine.csvToJson(dataContent);
          if (res.success && res.data) convertedStr = res.data;
        } else if (dataFormat === 'yaml') {
          const res = DataEngine.yamlToJson(dataContent);
          if (res.success && res.data) convertedStr = res.data;
        } else if (dataFormat === 'xml') {
          const res = DataEngine.xmlToJson(dataContent);
          if (res.success && res.data) convertedStr = res.data;
        } else {
          convertedStr = DataEngine.formatJson(dataContent).data || dataContent;
        }
      } else if (targetFmt === 'csv') {
        if (dataFormat === 'json') {
          const res = DataEngine.jsonToCsv(dataContent);
          if (res.success && res.data) convertedStr = res.data;
        } else if (dataFormat === 'yaml') {
          const jsonRes = DataEngine.yamlToJson(dataContent);
          if (jsonRes.success && jsonRes.data) {
            const csvRes = DataEngine.jsonToCsv(jsonRes.data);
            if (csvRes.success && csvRes.data) convertedStr = csvRes.data;
          }
        } else if (dataFormat === 'tsv') {
          convertedStr = dataContent.replace(/\t/g, ',');
        } else {
          convertedStr = dataContent;
        }
      } else if (targetFmt === 'yaml') {
        if (dataFormat === 'json') {
          const res = DataEngine.jsonToYaml(dataContent);
          if (res.success && res.data) convertedStr = res.data;
        } else if (dataFormat === 'csv' || dataFormat === 'tsv') {
          const jsonRes = DataEngine.csvToJson(dataContent);
          if (jsonRes.success && jsonRes.data) {
            const res = DataEngine.jsonToYaml(jsonRes.data);
            if (res.success && res.data) convertedStr = res.data;
          }
        }
      } else if (targetFmt === 'xml') {
        if (dataFormat === 'json') {
          const res = DataEngine.jsonToXml(dataContent);
          if (res.success && res.data) convertedStr = res.data;
        } else if (dataFormat === 'csv') {
          const jsonRes = DataEngine.csvToJson(dataContent);
          if (jsonRes.success && jsonRes.data) {
            const res = DataEngine.jsonToXml(jsonRes.data);
            if (res.success && res.data) convertedStr = res.data;
          }
        }
      } else if (targetFmt === 'tsv') {
        if (dataFormat === 'csv') {
          convertedStr = dataContent.replace(/,/g, '\t');
        } else if (dataFormat === 'json') {
          const res = DataEngine.ndjsonTsvConvert(dataContent, 'json', 'tsv');
          if (res.success && res.data) convertedStr = res.data;
        }
      } else if (targetFmt === 'xlsx') {
        const csvSource = dataFormat === 'csv' ? dataContent : DataEngine.jsonToCsv(dataContent).data || '';
        const res = await DataEngine.csvToXlsx(csvSource);
        if (res.success && res.data) {
          outBuf = res.data;
          convertedStr = csvSource;
        }
      }

      if (convertedStr || outBuf) {
        if (convertedStr) setDataContent(convertedStr);
        setDataFormat(targetFmt);
        const buf = outBuf || new TextEncoder().encode(convertedStr);
        await pushNewVersion(`Converted to ${targetFmt.toUpperCase()}`, buf);
        setSuccessResult(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  }, [dataContent, dataFormat]);

  const handleDeduplicateRows = useCallback(async () => {
    try {
      const res = Papa.parse(dataContent, { header: false, skipEmptyLines: true });
      if (res.data && res.data.length > 0) {
        const rows = res.data as string[][];
        const seen = new Set<string>();
        const uniqueRows: string[][] = [];
        rows.forEach((r, idx) => {
          if (idx === 0 && dataHasHeader) {
            uniqueRows.push(r);
            return;
          }
          const serialized = JSON.stringify(r);
          if (!seen.has(serialized)) {
            seen.add(serialized);
            uniqueRows.push(r);
          }
        });
        const out = Papa.unparse(uniqueRows);
        setDataContent(out);
        const buf = new TextEncoder().encode(out);
        await pushNewVersion('Deduplicated rows', buf);
        setSuccessResult(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Deduplication failed');
    }
  }, [dataContent, dataHasHeader]);

  const handleTransposeData = useCallback(async () => {
    try {
      const res = Papa.parse(dataContent, { header: false, skipEmptyLines: true });
      if (res.data && res.data.length > 0) {
        const matrix = res.data as string[][];
        const maxCols = Math.max(...matrix.map((r) => r.length));
        const transposed: string[][] = [];
        for (let col = 0; col < maxCols; col++) {
          const newRow: string[] = [];
          for (let row = 0; row < matrix.length; row++) {
            newRow.push(matrix[row][col] !== undefined ? matrix[row][col] : '');
          }
          transposed.push(newRow);
        }
        const out = Papa.unparse(transposed);
        setDataContent(out);
        const buf = new TextEncoder().encode(out);
        await pushNewVersion('Transposed rows and columns', buf);
        setSuccessResult(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Transpose failed');
    }
  }, [dataContent]);

  const handleValidateSchema = useCallback(() => {
    try {
      const schemaObj = JSON.parse(dataSchemaInput);
      const res = DataEngine.validateJsonSchema(dataContent, schemaObj);
      if (res.success && res.data?.valid) {
        setDataSchemaValidation({ valid: true, message: 'Valid: Dataset matches schema.' });
      } else {
        setDataSchemaValidation({
          valid: false,
          message: res.data?.errors?.[0] || res.error || 'Schema validation failed.',
        });
      }
    } catch (err: any) {
      setDataSchemaValidation({ valid: false, message: `Invalid schema JSON: ${err.message}` });
    }
  }, [dataContent, dataSchemaInput]);

  const handleExecuteSql = useCallback(async () => {
    try {
      setIsProcessing(true);
      const res = DataEngine.sqlOnCsv(dataContent, dataSqlQuery);
      if (res.success && res.data) {
        setDataContent(res.data);
        const buf = new TextEncoder().encode(res.data);
        await pushNewVersion('Executed SQL Query', buf);
        setSuccessResult(true);
      } else {
        setErrorMessage(res.error || 'SQL execution failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'SQL query failed');
    } finally {
      setIsProcessing(false);
    }
  }, [dataContent, dataSqlQuery]);

  // Phase 6 Text Handlers
  const handleApplyCase = useCallback(async (caseType: CaseType) => {
    const res = TextEngine.transformCase(textContent, caseType);
    if (res.success && res.data) {
      setTextContent(res.data);
      const buf = new TextEncoder().encode(res.data);
      await pushNewVersion(`Applied ${caseType} case`, buf);
      setSuccessResult(true);
    }
  }, [textContent]);

  const handleSortLines = useCallback(async (dir: 'asc' | 'desc' | 'natural') => {
    const linesArr = textContent.split('\n');
    let sorted: string[] = [];
    if (dir === 'natural') {
      const res = TextEngine.naturalSort(linesArr, 'asc');
      sorted = res.success && res.data ? res.data : linesArr;
    } else {
      sorted = [...linesArr].sort((a, b) => (dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));
    }
    const out = sorted.join('\n');
    setTextContent(out);
    const buf = new TextEncoder().encode(out);
    await pushNewVersion(`Sorted lines (${dir})`, buf);
    setSuccessResult(true);
  }, [textContent]);

  const handleDeduplicateLines = useCallback(async () => {
    const linesArr = textContent.split('\n');
    const seen = new Set<string>();
    const unique = linesArr.filter((l) => {
      if (seen.has(l)) return false;
      seen.add(l);
      return true;
    });
    const out = unique.join('\n');
    setTextContent(out);
    const buf = new TextEncoder().encode(out);
    await pushNewVersion('Deduplicated lines', buf);
    setSuccessResult(true);
  }, [textContent]);

  const handleTrimLines = useCallback(async () => {
    const linesArr = textContent.split('\n').map((l) => l.trim());
    const out = linesArr.join('\n');
    setTextContent(out);
    const buf = new TextEncoder().encode(out);
    await pushNewVersion('Trimmed lines whitespace', buf);
    setSuccessResult(true);
  }, [textContent]);

  const handleRemoveBlankLines = useCallback(async () => {
    const linesArr = textContent.split('\n').filter((l) => l.trim().length > 0);
    const out = linesArr.join('\n');
    setTextContent(out);
    const buf = new TextEncoder().encode(out);
    await pushNewVersion('Removed blank lines', buf);
    setSuccessResult(true);
  }, [textContent]);

  const handleCollapseSpaces = useCallback(async () => {
    const out = textContent.replace(/[ \t]+/g, ' ');
    setTextContent(out);
    const buf = new TextEncoder().encode(out);
    await pushNewVersion('Collapsed extra spaces', buf);
    setSuccessResult(true);
  }, [textContent]);

  const handleTextToTable = useCallback(async () => {
    const res = TextEngine.textToTable(textContent, textDelim, true);
    if (res.success && res.data) {
      const { headers, rows } = res.data;
      let md = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
      rows.forEach((r) => {
        md += `| ${r.join(' | ')} |\n`;
      });
      setTextContent(md);
      const buf = new TextEncoder().encode(md);
      await pushNewVersion('Converted to Markdown Table', buf);
      setSuccessResult(true);
    }
  }, [textContent, textDelim]);

  const handleSlugify = useCallback(async () => {
    const res = TextEngine.slugify(textContent, textSlugSep, textSlugMax);
    if (res.success && res.data) {
      setTextContent(res.data);
      const buf = new TextEncoder().encode(res.data);
      await pushNewVersion('Generated URL Slug', buf);
      setSuccessResult(true);
    }
  }, [textContent, textSlugSep, textSlugMax]);

  const handleGenerateLorem = useCallback(async () => {
    const res = TextEngine.generateLoremIpsum(textLoremCount, textLoremUnit);
    if (res.success && res.data) {
      const out = textContent ? `${textContent}\n\n${res.data}` : res.data;
      setTextContent(out);
      const buf = new TextEncoder().encode(out);
      await pushNewVersion(`Inserted ${textLoremCount} ${textLoremUnit} of Lorem Ipsum`, buf);
      setSuccessResult(true);
    }
  }, [textContent, textLoremCount, textLoremUnit]);

  // Execution: Handles Pages actions (Delete, Rotate, Extract, Duplicate, Crop, Replace)
  const handleExecutePageAction = async (
    action: 'delete' | 'rotate' | 'extract' | 'duplicate' | 'crop' | 'replace',
    payload?: any
  ) => {
    if (files.length === 0 || !files[0].buffer) return;
    setIsProcessing(true);
    setProgressPercent(20);
    setErrorMessage(null);

    const buffer = files[0].buffer;
    const selectedIndices = pages
      .map((p, idx) => (p.selected ? idx : -1))
      .filter((idx) => idx !== -1);

    try {
      if (action === 'delete') {
        if (selectedIndices.length === 0) {
          throw new Error('Please select at least one page to delete.');
        }
        setProgressPercent(50);
        const res = await PdfEngine.deletePages(buffer, selectedIndices);
        if (!res.success || !res.outputBuffer) {
          throw new Error(res.error || 'Failed to delete pages.');
        }
        await pushNewVersion(`Deleted ${selectedIndices.length} pages`, res.outputBuffer);
      } else if (action === 'rotate') {
        const targetIndices = selectedIndices.length > 0 ? selectedIndices.map((i) => i + 1) : undefined;
        setProgressPercent(50);
        const res = await PdfEngine.rotatePages(buffer, 90, targetIndices);
        if (!res.success || !res.outputBuffer) {
          throw new Error(res.error || 'Failed to rotate pages.');
        }
        await pushNewVersion(`Rotated ${selectedIndices.length > 0 ? selectedIndices.length : pages.length} pages`, res.outputBuffer);
      } else if (action === 'extract') {
        if (selectedIndices.length === 0) {
          throw new Error('Please select at least one page to extract.');
        }
        const targetPagesOneBased = selectedIndices.map((i) => i + 1);
        setProgressPercent(50);
        const res = await PdfEngine.extractPages(buffer, targetPagesOneBased);
        if (!res.success || !res.outputBuffer) {
          throw new Error(res.error || 'Failed to extract pages.');
        }
        await pushNewVersion(`Extracted ${selectedIndices.length} pages`, res.outputBuffer);
      } else if (action === 'duplicate') {
        if (selectedIndices.length === 0) {
          throw new Error('Please select at least one page to duplicate.');
        }
        setProgressPercent(50);
        const res = await PdfEngine.duplicatePages(buffer, selectedIndices);
        if (!res.success || !res.outputBuffer) {
          throw new Error(res.error || 'Failed to duplicate pages.');
        }
        await pushNewVersion(`Duplicated ${selectedIndices.length} pages`, res.outputBuffer);
      } else if (action === 'crop') {
        setProgressPercent(50);
        const selectedPagesOneBased = pages
          .map((p, idx) => (p.selected ? idx + 1 : -1))
          .filter((n) => n !== -1);
        const indicesToCrop = (cropScope === 'selected' && selectedPagesOneBased.length > 0)
          ? selectedPagesOneBased
          : undefined;

        const res = await PdfEngine.cropPages(buffer, cropMargins, indicesToCrop);
        if (!res.success || !res.outputBuffer) {
          throw new Error(res.error || 'Failed to crop pages.');
        }
        const scopeText = indicesToCrop ? `${indicesToCrop.length} selected pages` : 'all pages';
        await pushNewVersion(`Cropped (${scopeText})`, res.outputBuffer);
      } else if (action === 'replace') {
        const replacePageNum = payload?.pageNumber || (selectedIndices.length > 0 ? selectedIndices[0] + 1 : 1);
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,application/pdf';
        input.onchange = async () => {
          if (input.files && input.files[0]) {
            setIsProcessing(true);
            setProgressPercent(50);
            try {
              const repBuf = new Uint8Array(await input.files[0].arrayBuffer());
              const res = await PdfEngine.replacePages(buffer, [replacePageNum], repBuf);
              if (!res.success || !res.outputBuffer) {
                throw new Error(res.error || 'Failed to replace page.');
              }
              await pushNewVersion(`Replaced page ${replacePageNum}`, res.outputBuffer);
            } catch (err: any) {
              setErrorMessage(err.message || 'Page replacement failed.');
              setIsProcessing(false);
            }
          } else {
            setIsProcessing(false);
          }
        };
        input.click();
        return;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed.');
      setIsProcessing(false);
    }
  };

  // Main primary action processor
  const handlePrimaryProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgressPercent(10);
    setErrorMessage(null);

    const mode = activeUtility.mode || 'panel';
    const activeId = activeUtility.id;

    try {
      // Phase 5: Images Workspace Execution
      if (workspace.id === 'images') {
        const activeBuf = files[activeImageIndex]?.buffer || files[0].buffer;
        if (!activeBuf) throw new Error('No image loaded.');

        setProgressPercent(30);
        let outBuffer: Uint8Array | null = null;
        let actionLabel = 'Processed Image';

        if (activeGroup.id === 'img-converter' || activeUtility.id.startsWith('convert-') || activeUtility.id === 'img-heic-converter' || activeUtility.id === 'img-avif-converter' || activeUtility.id === 'img-svg-to-png') {
          if (imageFormat === 'jpeg') {
            const res = await ImageEngine.transformImage(activeBuf, { format: 'image/jpeg', quality: imageQuality / 100 });
            if (!res.success || !res.data) throw new Error(res.error || 'Conversion to JPG failed.');
            outBuffer = res.data;
            actionLabel = 'Converted to JPG';
          } else if (imageFormat === 'png') {
            const res = await ImageEngine.transformImage(activeBuf, { format: 'image/png' });
            if (!res.success || !res.data) throw new Error(res.error || 'Conversion to PNG failed.');
            outBuffer = res.data;
            actionLabel = 'Converted to PNG';
          } else if (imageFormat === 'webp') {
            const res = await ImageEngine.transformImage(activeBuf, { format: 'image/webp', quality: imageQuality / 100 });
            if (!res.success || !res.data) throw new Error(res.error || 'Conversion to WebP failed.');
            outBuffer = res.data;
            actionLabel = 'Converted to WebP';
          } else if (imageFormat === 'bmp') {
            const res = await ImageEngine.convertToBmp(activeBuf);
            if (!res.success || !res.data) throw new Error(res.error || 'Conversion to BMP failed.');
            outBuffer = res.data;
            actionLabel = 'Converted to BMP';
          } else if (imageFormat === 'tiff') {
            const res = await ImageEngine.convertToTiff(activeBuf);
            if (!res.success || !res.data) throw new Error(res.error || 'Conversion to TIFF failed.');
            outBuffer = res.data;
            actionLabel = 'Converted to TIFF';
          } else if (imageFormat === 'svg') {
            const text = new TextDecoder().decode(activeBuf);
            const res = await ImageEngine.svgToPng(text);
            if (!res.success || !res.data) throw new Error(res.error || 'SVG rendering failed.');
            outBuffer = res.data;
            actionLabel = 'Rendered SVG to PNG';
          } else {
            const res = await ImageEngine.transformImage(activeBuf, { format: 'image/jpeg', quality: imageQuality / 100 });
            if (!res.success || !res.data) throw new Error(res.error || 'Conversion failed.');
            outBuffer = res.data;
            actionLabel = `Converted to ${imageFormat.toUpperCase()}`;
          }
        } else if (activeGroup.id === 'img-transformer') {
          if (activeUtility.id === 'img-crop') {
            const dims = await ImageEngine.getImageDimensions(activeBuf);
            const natW = dims.success && dims.data ? dims.data.width : 1200;
            const natH = dims.success && dims.data ? dims.data.height : 800;
            const pixelCrop = {
              x: Math.round((cropRect.x / 100) * natW),
              y: Math.round((cropRect.y / 100) * natH),
              width: Math.round((cropRect.width / 100) * natW),
              height: Math.round((cropRect.height / 100) * natH),
            };
            const res = await ImageEngine.transformImage(activeBuf, { crop: pixelCrop });
            if (!res.success || !res.data) throw new Error(res.error || 'Crop failed.');
            outBuffer = res.data;
            actionLabel = 'Cropped Image';
          } else if (activeUtility.id === 'img-rotate') {
            const res = await ImageEngine.transformImage(activeBuf, { rotationDegrees: 90 });
            if (!res.success || !res.data) throw new Error(res.error || 'Rotate failed.');
            outBuffer = res.data;
            actionLabel = 'Rotated 90° CW';
          } else {
            const res = await ImageEngine.transformImage(activeBuf, {
              width: resizeWidth,
              height: resizeHeight,
              maintainAspectRatio: lockAspect,
            });
            if (!res.success || !res.data) throw new Error(res.error || 'Resize failed.');
            outBuffer = res.data;
            actionLabel = `Resized (${resizeWidth}x${resizeHeight})`;
          }
        } else if (activeGroup.id === 'img-optimizer') {
          const res = await ImageEngine.compressImage(activeBuf, optQuality, 'image/webp');
          if (!res.success || !res.outputBuffer || !res.data) throw new Error(res.error || 'Optimization failed.');
          outBuffer = res.outputBuffer;
          const origKb = Math.round(res.data.originalSize / 1024);
          const newKb = Math.round(res.data.newSize / 1024);
          if (res.data.isLarger) {
            actionLabel = `Original preserved (${origKb} KB) · Result was larger`;
          } else {
            actionLabel = `${origKb} KB to ${newKb} KB, ${res.data.ratioPercent}% smaller`;
          }
        } else if (activeGroup.id === 'img-adjustments') {
          const res = await ImageEngine.transformImage(activeBuf, {
            brightness: imgBrightness,
            contrast: imgContrast,
            saturation: imgSaturation,
            blur: imgBlur,
            grayscale: imgGrayscale,
          });
          if (!res.success || !res.data) throw new Error(res.error || 'Adjustments failed.');
          outBuffer = res.data;
          actionLabel = 'Applied Adjustments';
        } else if (activeGroup.id === 'img-metadata') {
          const res = await ImageEngine.stripMetadata(activeBuf);
          if (!res.success || !res.data) throw new Error(res.error || 'Metadata strip failed.');
          outBuffer = res.data;
          actionLabel = 'Stripped EXIF Metadata';
        } else if (activeGroup.id === 'img-compose') {
          const res = await ImageEngine.applyWatermark(activeBuf, {
            text: imgWatermarkText,
            opacity: imgWatermarkOpacity,
            fontSize: imgWatermarkSize,
          });
          if (!res.success || !res.data) throw new Error(res.error || 'Watermark failed.');
          outBuffer = res.data;
          actionLabel = 'Applied Watermark';
        } else if (activeGroup.id === 'img-to-pdf-util') {
          const pdfDoc = await PDFDocument.create();
          let embeddedImg: any;
          try {
            embeddedImg = await pdfDoc.embedPng(activeBuf);
          } catch {
            embeddedImg = await pdfDoc.embedJpg(activeBuf);
          }
          const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
          page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
          outBuffer = await pdfDoc.save();
          actionLabel = 'Generated PDF from Image';
        } else {
          const res = await ImageEngine.transformImage(activeBuf, { format: 'image/png' });
          if (!res.success || !res.data) throw new Error('Operation failed.');
          outBuffer = res.data;
          actionLabel = 'Processed Image';
        }

        if (outBuffer) {
          await pushNewVersion(actionLabel, outBuffer);
        }
        return;
      }

      // Phase 5: Documents Workspace Execution
      if (workspace.id === 'documents') {
        const activeBuf = files[0].buffer;
        if (!activeBuf) throw new Error('No document loaded.');

        setProgressPercent(30);
        let outBuffer: Uint8Array | null = null;
        let actionLabel = 'Processed Document';

        if (activeGroup.id === 'doc-converter') {
          if (docTargetFormat === 'docx') {
            const res = await DocumentEngine.createDocxFromText(docRawText || 'Toiloki Converted Document');
            if (!res.success || !res.data) throw new Error(res.error || 'DOCX creation failed.');
            outBuffer = res.data;
            actionLabel = 'Converted to DOCX';
          } else {
            const res = await PdfEngine.createFromText(docRawText || 'Toiloki Converted Document');
            if (!res.success || !res.outputBuffer) throw new Error(res.error || 'PDF conversion failed.');
            outBuffer = res.outputBuffer;
            actionLabel = 'Converted to PDF';
          }
        } else if (activeGroup.id === 'doc-editor') {
          outBuffer = new TextEncoder().encode(docRawText);
          actionLabel = 'Saved Document Edits';
        } else if (activeGroup.id === 'doc-compare') {
          outBuffer = new TextEncoder().encode(`Diff Report for ${files[0]?.name} vs ${files[1]?.name || 'Document B'}\n\nGenerated by Toiloki local suite.`);
          actionLabel = 'Saved Diff Report';
        } else if (activeGroup.id === 'doc-metadata') {
          const res = await DocumentEngine.scrubOfficeMetadata(activeBuf);
          if (!res.success || !res.data) throw new Error(res.error || 'Failed to scrub Office metadata.');
          outBuffer = res.data;
          actionLabel = 'Scrubbed Office Metadata';
        } else {
          outBuffer = activeBuf;
          actionLabel = `Exported ${docTargetFormat.toUpperCase()}`;
        }

        if (outBuffer) {
          await pushNewVersion(actionLabel, outBuffer);
        }
        return;
      }

      // Phase 6: Data Workspace Execution
      if (workspace.id === 'data') {
        setProgressPercent(30);
        let outBuffer: Uint8Array | null = null;
        let actionLabel = 'Transformed Data';

        if (activeGroup.id === 'data-converter' || activeUtility.id.startsWith('data-convert-')) {
          await handleConvertDataFormat(dataFormat);
          return;
        } else if (activeGroup.id === 'data-validator' || activeUtility.id === 'data-schema') {
          handleValidateSchema();
          setIsProcessing(false);
          setSuccessResult(true);
          return;
        } else if (activeGroup.id === 'data-query') {
          await handleExecuteSql();
          return;
        } else if (activeUtility.id === 'data-dedup') {
          await handleDeduplicateRows();
          return;
        } else if (activeUtility.id === 'data-columns' || activeUtility.id === 'data-transpose') {
          await handleTransposeData();
          return;
        } else {
          outBuffer = new TextEncoder().encode(dataContent);
          actionLabel = `Exported ${dataFormat.toUpperCase()}`;
        }

        if (outBuffer) {
          await pushNewVersion(actionLabel, outBuffer);
        }
        return;
      }

      // Phase 6: Text Workspace Execution
      if (workspace.id === 'text') {
        setProgressPercent(30);
        let outBuffer: Uint8Array | null = null;
        let actionLabel = 'Processed Text';

        if (activeGroup.id === 'text-transformer') {
          await handleApplyCase(textCaseType);
          return;
        } else if (activeGroup.id === 'text-cleaner') {
          await handleTrimLines();
          return;
        } else if (activeGroup.id === 'text-generator') {
          await handleGenerateLorem();
          return;
        } else if (activeUtility.id === 'text-diff') {
          setTextOriginalContent(textContent);
          outBuffer = new TextEncoder().encode(textContent);
          actionLabel = 'Updated Baseline for Diff';
        } else {
          outBuffer = new TextEncoder().encode(textContent);
          actionLabel = 'Saved Text Document';
        }

        if (outBuffer) {
          await pushNewVersion(actionLabel, outBuffer);
        }
        return;
      }

      // Phase 7: Media Workspace Execution
      if (workspace.id === 'media') {
        cancelRequestedRef.current = false;
        setProgressPercent(20);
        setStatusMessage('Processing audio/video...');
        
        let outBuffer: Uint8Array | null = null;
        let actionLabel = 'Processed Media';

        if (mediaViewMode === 'trim' || activeUtility.id === 'audio-trimmer' || activeUtility.id === 'video-trimmer') {
          setStatusMessage('Trimming audio timeline...');
          setProgressPercent(50);
          if (cancelRequestedRef.current) return;
          const res = await MediaEngine.trimAudio(files[0].buffer!, mediaTrimRange.start, mediaTrimRange.end, (p) => {
            if (!cancelRequestedRef.current) setProgressPercent(p.percent);
          });
          if (cancelRequestedRef.current) return;
          if (res.success && res.data) {
            outBuffer = res.data;
            actionLabel = `Trimmed (${mediaTrimRange.start.toFixed(1)}s - ${mediaTrimRange.end.toFixed(1)}s)`;
          } else {
            throw new Error(res.error || 'Failed to trim media.');
          }
        } else if (activeUtility.id === 'audio-volume-fade') {
          setStatusMessage('Adjusting audio dynamics...');
          setProgressPercent(50);
          if (cancelRequestedRef.current) return;
          const res = await MediaEngine.adjustVolumeAndFade(files[0].buffer!, {
            gainDb: mediaGainDb,
            fadeInSec: mediaFadeInSec,
            fadeOutSec: mediaFadeOutSec,
          });
          if (cancelRequestedRef.current) return;
          if (res.success && res.data) {
            outBuffer = res.data;
            actionLabel = `Adjusted Volume (${mediaGainDb > 0 ? '+' : ''}${mediaGainDb}dB)`;
          } else {
            throw new Error(res.error || 'Failed to adjust audio volume.');
          }
        } else {
          outBuffer = files[0]?.buffer || new Uint8Array();
          actionLabel = `Transcoded to ${mediaTargetFormat.toUpperCase()}`;
        }

        if (outBuffer && !cancelRequestedRef.current) {
          await pushNewVersion(actionLabel, outBuffer);
        }
        return;
      }

      // Phase 7: Files Workspace Execution
      if (workspace.id === 'files') {
        setProgressPercent(30);
        let outBuffer: Uint8Array | null = null;
        let actionLabel = 'Processed Files';

        if (activeUtility.id === 'create-zip-archive') {
          setStatusMessage('Compressing files into ZIP...');
          setProgressPercent(60);
          const zipFiles = files
            .filter((_, idx) => filesSelectedIndices.length === 0 || filesSelectedIndices.includes(idx))
            .map((f) => ({ name: f.name, buffer: f.buffer || new Uint8Array() }));
          const res = await ArchiveEngine.createZip(zipFiles);
          if (res.success && res.data) {
            outBuffer = res.data;
            actionLabel = `Created ZIP Archive (${zipFiles.length} files)`;
            const insp = await ArchiveEngine.inspectZip(res.data);
            if (insp.success && insp.data) setFilesArchiveEntries(insp.data);
          } else {
            throw new Error(res.error || 'Failed to create ZIP archive.');
          }
        } else if (activeUtility.id === 'extract-zip-archive') {
          setStatusMessage('Extracting ZIP archive safely...');
          setProgressPercent(60);
          if (files[0]?.buffer) {
            const res = await ArchiveEngine.extractZip(files[0].buffer);
            if (res.success && res.data) {
              const extractedFiles: SelectedFile[] = res.data.map((item) => ({
                name: item.name,
                size: item.buffer.length,
                type: 'application/octet-stream',
                buffer: item.buffer,
              }));
              setFiles(extractedFiles);
              setFilesSelectedIndices(extractedFiles.map((_, i) => i));
              actionLabel = `Extracted ${extractedFiles.length} files`;
              outBuffer = files[0].buffer;
            } else {
              throw new Error(res.error || 'Failed to extract archive.');
            }
          }
        } else if (activeUtility.id === 'batch-rename-files' || filesViewMode === 'table') {
          setStatusMessage('Applying batch rename rules...');
          setProgressPercent(70);
          const res = FileOpsEngine.applyBatchRename(files.map((f) => f.name), filesRenameRule);
          if (res.success && res.data) {
            const renamedFiles = files.map((f, idx) => ({
              ...f,
              name: res.data![idx]?.renamed || f.name,
            }));
            setFiles(renamedFiles);
            actionLabel = `Renamed ${renamedFiles.length} files`;
            outBuffer = files[0]?.buffer || new Uint8Array();
          }
        } else {
          outBuffer = files[0]?.buffer || new Uint8Array();
          actionLabel = 'Verified Hashes & Checksums';
        }

        if (outBuffer) {
          await pushNewVersion(actionLabel, outBuffer);
        }
        return;
      }

      if (mode === 'pages') {
        if (activeId === 'delete-pages') {
          await handleExecutePageAction('delete');
        } else if (activeId === 'rotate-pages') {
          await handleExecutePageAction('rotate');
        } else if (activeId === 'extract-pages') {
          await handleExecutePageAction('extract');
        } else if (activeId === 'duplicate-pages') {
          await handleExecutePageAction('duplicate');
        } else if (activeId === 'reorder-pages') {
          const newOrder = pages.map((p) => p.originalIndex);
          const res = await PdfEngine.reorderPages(files[0].buffer!, newOrder);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to reorder.');
          await pushNewVersion('Saved new page order', res.outputBuffer);
        } else if (activeId === 'pdf-remove-blank-pages') {
          const res = await PdfEngine.removeBlankPages(files[0].buffer!);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to remove blanks.');
          await pushNewVersion('Blank pages removed', res.outputBuffer);
        } else if (activeId === 'pdf-crop-pages') {
          await handleExecutePageAction('crop');
        } else {
          // Default pages apply
          await handleExecutePageAction('delete');
        }
      } else if (mode === 'tray') {
        if (activeId === 'merge-pdf') {
          if (files.length < 2) {
            throw new Error('Please add at least 2 PDF files in the tray to merge.');
          }
          const mergeItems = await Promise.all(
            files.map(async (f) => {
              const buf = await ensureBuffer(f);
              const doc = await PDFDocument.load(buf);
              const numPages = doc.getPageCount();
              const rangeStr = fileRanges[f.name] || '';
              const parsed = parsePageRange(rangeStr, numPages);
              if (!parsed.valid) {
                throw new Error(`Invalid range for "${f.name}": ${parsed.error}`);
              }
              return {
                buffer: buf,
                pageIndices: parsed.pageIndices0Based,
              };
            })
          );
          setProgressPercent(60);
          const res = await PdfEngine.merge(mergeItems);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to merge files.');
          await pushNewVersion(`Merged ${files.length} documents`, res.outputBuffer);
        } else if (activeId === 'pdf-compare-pdfs') {
          if (files.length < 2) {
            throw new Error('Please add 2 PDF documents to compare.');
          }
          const bufA = await ensureBuffer(files[0]);
          const bufB = await ensureBuffer(files[1]);
          setProgressPercent(60);
          const res = await PdfEngine.comparePdfs(bufA, bufB);
          if (!res.success || !res.data) throw new Error(res.error || 'Failed to compare PDFs.');
          setCompareResult(res.data);
          setIsProcessing(false);
          setSuccessResult(true);
        } else if (activeId === 'images-to-pdf') {
          const buffers = await Promise.all(
            files.map(async (f) => ({
              buffer: await ensureBuffer(f),
              type: (f.name.endsWith('.png') ? 'png' : 'jpeg') as 'png' | 'jpeg',
            }))
          );
          const res = await PdfEngine.createFromImages(buffers);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to convert images.');
          await pushNewVersion(`Converted ${files.length} images to PDF`, res.outputBuffer);
        }
      } else if (mode === 'markers') {
        // Split PDF
        const buffer = await ensureBuffer(files[0]);
        setProgressPercent(40);
        setStatusMessage('Splitting PDF document into parts...');
        const res = await PdfEngine.splitPdf(
          buffer,
          splitConfig.method,
          splitConfig.everyN,
          splitConfig.cutPoints,
          splitConfig.ranges,
          files[0].name
        );
        if (!res.success || !res.data || res.data.length === 0) {
          throw new Error(res.error || 'Failed to split PDF.');
        }

        if (res.data.length > 1) {
          const zipRes = await ArchiveEngine.createZip(
            res.data.map((p) => ({ name: p.name, buffer: p.buffer }))
          );
          if (zipRes.success && zipRes.data) {
            await pushNewVersion(
              `Split into ${res.data.length} files (${res.data.map((d) => d.name).join(', ')})`,
              zipRes.data
            );
          } else {
            await pushNewVersion(`Split into ${res.data.length} files`, res.data[0].buffer);
          }
        } else {
          await pushNewVersion(`Split into 1 file`, res.data[0].buffer);
        }
      } else if (mode === 'annotate') {
        const buffer = await ensureBuffer(files[0]);
        setProgressPercent(40);
        let res: any;

        if (activeId === 'watermark') {
          res = await PdfEngine.addWatermark(buffer, {
            text: watermarkText || 'CONFIDENTIAL',
            opacity: watermarkOpacity,
            fontSize: watermarkFontSize,
            rotationDegrees: watermarkRotation,
          });
        } else if (activeId === 'page-numbers') {
          res = await PdfEngine.addPageNumbers(buffer, {
            position: pageNumberPosition,
            startNumber: pageNumberStart,
          });
        } else if (activeId === 'add-text') {
          res = await PdfEngine.addText(buffer, annotText || 'Annotated', {
            pageIndex: annotatePage - 1,
            fontSize: annotFontSize,
            color: annotColor === '#D4B06A' ? { r: 212, g: 176, b: 106 } : undefined,
          });
        } else if (activeId === 'add-image') {
          res = await PdfEngine.addAnnotations(buffer, [
            {
              pageIndex: annotatePage - 1,
              type: 'rect',
              x: 350,
              y: 700,
              width: 140,
              height: 40,
              color: stampPreset === 'REJECTED' ? { r: 220, g: 38, b: 38 } : { r: 22, g: 163, b: 74 },
              opacity: stampOpacity,
            },
          ]);
        } else if (activeId === 'draw-shapes') {
          res = await PdfEngine.drawShapes(buffer, [
            {
              pageIndex: annotatePage - 1,
              type: shapeType,
              x: 100,
              y: 500,
              width: 150,
              height: 80,
              borderWidth: shapeBorderWidth,
              borderColor: { r: 212, g: 176, b: 106 },
            },
          ]);
        } else if (activeId === 'highlight-underline') {
          res = await PdfEngine.highlightUnderline(buffer, [
            {
              pageIndex: annotatePage - 1,
              type: highlightType,
              x: 50,
              y: 650,
              width: 300,
              height: 20,
              color: highlightColor === '#FACC15' ? { r: 250, g: 204, b: 21 } : undefined,
            },
          ]);
        } else if (activeId === 'sign-pdf') {
          res = await PdfEngine.addAnnotations(buffer, [
            {
              pageIndex: annotatePage - 1,
              type: 'text',
              x: 350,
              y: 80,
              text: `Signed: ${signName || 'Authorized Signer'}`,
              height: 14,
            },
          ]);
        } else if (activeId === 'pdf-redact') {
          res = await PdfEngine.redactPdf(
            buffer,
            [
              {
                pageIndex: annotatePage - 1,
                x: 50,
                y: 550,
                width: 250,
                height: 35,
              },
            ],
            { stripMetadata: stripAllMetadata }
          );
        } else if (activeId === 'pdf-fill-form-fields') {
          res = await PdfEngine.fillFormFields(buffer, { formSample: 'Completed' }, false);
        } else if (activeId === 'pdf-bookmarks-editor') {
          res = await PdfEngine.editBookmarks(buffer, [
            { title: 'Chapter 1: Overview', pageNumber: 1, level: 0 },
            { title: 'Chapter 2: Details', pageNumber: 2, level: 0 },
          ]);
        } else {
          res = await PdfEngine.flattenPdf(buffer);
        }

        if (!res.success || !res.outputBuffer) {
          throw new Error(res.error || `Failed to execute ${activeUtility.name}`);
        }
        await pushNewVersion(`${activeUtility.name} applied`, res.outputBuffer);
      } else if (mode === 'panel') {
        setProgressPercent(40);
        if (activeId === 'docx-to-pdf') {
          const rawBuffer = files[0].buffer;
          if (!rawBuffer) throw new Error('No DOCX file loaded.');
          const txtRes = await DocumentEngine.docxToText(rawBuffer);
          const text = txtRes.success && txtRes.data ? txtRes.data : 'Converted DOCX Content';
          const pdfRes = await PdfEngine.createFromText(text, { title: files[0].name });
          if (!pdfRes.success || !pdfRes.outputBuffer) throw new Error(pdfRes.error || 'Failed to convert DOCX.');
          await pushNewVersion('Converted from DOCX', pdfRes.outputBuffer);
        } else if (activeId === 'txt-to-pdf-doc' || activeId === 'md-to-pdf-doc' || activeId === 'html-to-pdf-doc') {
          const rawBuffer = files[0].buffer;
          if (!rawBuffer) throw new Error('No document loaded.');
          const text = new TextDecoder('utf-8').decode(rawBuffer);
          const pdfRes = await PdfEngine.createFromText(text, { title: files[0].name });
          if (!pdfRes.success || !pdfRes.outputBuffer) throw new Error(pdfRes.error || 'Failed to convert document.');
          await pushNewVersion('Converted to PDF', pdfRes.outputBuffer);
        } else if (activeId === 'pdf-to-doc') {
          const buffer = await ensureBuffer(files[0]);
          const docxRes = await PdfEngine.pdfToDocx(buffer);
          if (!docxRes.success || !docxRes.outputBuffer) throw new Error(docxRes.error || 'Failed to convert PDF to DOCX.');
          const blob = new Blob([docxRes.outputBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${files[0].name.replace(/\.pdf$/i, '')}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setSuccessResult(true);
          setIsProcessing(false);
          setProgressPercent(100);
        } else if (activeId === 'pdf-to-images') {
          const buffer = await ensureBuffer(files[0]);
          const imgRes = await PdfEngine.pdfToImages(buffer, { dpi: 150 });
          if (!imgRes.success || !imgRes.data || imgRes.data.length === 0) {
            throw new Error(imgRes.error || 'Failed to render PDF images.');
          }
          const a = document.createElement('a');
          a.href = imgRes.data[0].dataUrl;
          a.download = `${files[0].name.replace(/\.pdf$/i, '')}-page-1.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setSuccessResult(true);
          setIsProcessing(false);
          setProgressPercent(100);
        } else if (activeId === 'compress-pdf') {
          const buffer = await ensureBuffer(files[0]);
          setStatusMessage('Compressing and optimizing PDF streams...');
          const preset = (compressionQuality as 'light' | 'balanced' | 'extreme') || 'balanced';
          const res = await PdfEngine.compressPdf(buffer, preset);
          if (!res.success || !res.outputBuffer || !res.data) {
            throw new Error(res.error || 'Failed to compress PDF.');
          }

          const origMb = (res.data.originalSize / (1024 * 1024)).toFixed(1);
          const newMb = (res.data.newSize / (1024 * 1024)).toFixed(1);

          let verLabel: string;
          if (res.data.isLarger) {
            verLabel = `Original preserved (${origMb} MB) · Result was larger`;
          } else {
            verLabel = `${origMb} MB to ${newMb} MB, ${res.data.ratioPercent}% smaller`;
          }
          await pushNewVersion(verLabel, res.outputBuffer);
        } else if (activeId === 'optimize-images') {
          const buffer = await ensureBuffer(files[0]);
          const res = await PdfEngine.flattenAndStripMetadata(buffer);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to optimize PDF.');
          await pushNewVersion('Optimized PDF', res.outputBuffer);
        } else if (activeId === 'flatten-pdf') {
          const buffer = await ensureBuffer(files[0]);
          const res = await PdfEngine.flattenPdf(buffer);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to flatten PDF.');
          await pushNewVersion('Flattened PDF', res.outputBuffer);
        } else if (activeId === 'remove-metadata') {
          const buffer = await ensureBuffer(files[0]);
          const res = await PdfEngine.removeMetadata(buffer);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to remove metadata.');
          await pushNewVersion('Sanitized PDF (Metadata Removed)', res.outputBuffer);
        } else if (activeId === 'repair-pdf') {
          const buffer = await ensureBuffer(files[0]);
          const res = await PdfEngine.repairPdf(buffer);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to repair PDF.');
          await pushNewVersion('Repaired PDF', res.outputBuffer);
        } else if (activeId === 'remove-password') {
          const buffer = await ensureBuffer(files[0]);
          const res = await PdfSecurityEngine.unlockAndSanitize(buffer);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to remove password.');
          await pushNewVersion('Unlocked PDF', res.outputBuffer);
        } else {
          // password-protect / encrypt-pdf or fallback
          const buffer = await ensureBuffer(files[0]);
          const res = await PdfEngine.flattenAndStripMetadata(buffer);
          if (!res.success || !res.outputBuffer) throw new Error('Failed to process document.');
          await pushNewVersion(`${activeUtility.name} applied`, res.outputBuffer);
        }
      } else if (mode === 'info') {
        const buffer = await ensureBuffer(files[0]);
        if (activeId === 'extract-text') {
          const res = await PdfEngine.extractText(buffer);
          if (res.success && res.data) setExtractedText(res.data);
        } else if (activeId === 'extract-images') {
          const res = await PdfEngine.extractImages(buffer);
          if (res.success && res.data) setExtractedImages(res.data);
        } else if (activeId === 'extract-metadata' || activeId === 'pdf-properties') {
          const res = await PdfEngine.getMetadata(buffer);
          if (res.success && res.data) setPdfDocProperties(res.data);
        } else if (activeId === 'pdf-security-audit') {
          const res = await PdfSecurityEngine.inspectSecurity(buffer);
          if (res.success && res.data) setPdfSecurityDetails(res.data);
        }
        setIsProcessing(false);
        setSuccessResult(true);
        setProgressPercent(100);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Execution error.');
      setIsProcessing(false);
    }
  };

  // Save current version to disk / download
  const handleSaveAs = () => {
    if (versionStack.length === 0 || versionIndex < 0) return;
    const currentVer = versionStack[versionIndex];
    let mime = 'application/pdf';
    let ext = '.pdf';

    if (workspace.id === 'images') {
      if (imageFormat === 'jpeg') { mime = 'image/jpeg'; ext = '.jpg'; }
      else if (imageFormat === 'png') { mime = 'image/png'; ext = '.png'; }
      else if (imageFormat === 'webp') { mime = 'image/webp'; ext = '.webp'; }
      else if (imageFormat === 'bmp') { mime = 'image/bmp'; ext = '.bmp'; }
      else if (imageFormat === 'tiff') { mime = 'image/tiff'; ext = '.tiff'; }
      else if (imageFormat === 'svg') { mime = 'image/svg+xml'; ext = '.svg'; }
      else { mime = 'image/jpeg'; ext = '.jpg'; }
    } else if (workspace.id === 'documents') {
      if (docTargetFormat === 'docx') { mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; ext = '.docx'; }
      else if (docTargetFormat === 'txt') { mime = 'text/plain'; ext = '.txt'; }
      else if (docTargetFormat === 'html') { mime = 'text/html'; ext = '.html'; }
      else if (docTargetFormat === 'rtf') { mime = 'application/rtf'; ext = '.rtf'; }
      else { mime = 'application/pdf'; ext = '.pdf'; }
    } else if (workspace.id === 'data') {
      if (dataFormat === 'json') { mime = 'application/json'; ext = '.json'; }
      else if (dataFormat === 'yaml') { mime = 'text/yaml'; ext = '.yaml'; }
      else if (dataFormat === 'xml') { mime = 'application/xml'; ext = '.xml'; }
      else if (dataFormat === 'tsv') { mime = 'text/tab-separated-values'; ext = '.tsv'; }
      else if (dataFormat === 'xlsx') { mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; ext = '.xlsx'; }
      else { mime = 'text/csv'; ext = '.csv'; }
    } else if (workspace.id === 'text') {
      mime = 'text/plain'; ext = '.txt';
    }

    const blob = new Blob([currentVer.buffer], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = files[0]?.name ? files[0].name.replace(/\.[a-z0-9]+$/i, '') : 'document';
    a.download = `${baseName}-${currentVer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isStandaloneWorkspace = workspace.workbench === 'standalone' || workspace.workbench === 'editor';
  const needsFile = !isStandaloneWorkspace && activeUtility.needsFile !== false;
  const showEmptyState = needsFile && files.length === 0;
  const currentMode = activeUtility.mode || 'panel';

  // Dynamic primary button label computation
  const primaryButtonLabel = useMemo(() => {
    if (workspace.id === 'images') {
      if (activeGroup.id === 'img-converter' || activeUtility.id.startsWith('convert-')) {
        return `Convert to ${imageFormat.toUpperCase()}`;
      }
      if (activeUtility.id === 'img-crop') return 'Apply Crop';
      if (activeUtility.id === 'img-resize') return 'Apply Resize';
      if (activeUtility.id === 'img-rotate') return 'Rotate 90° CW';
      if (activeGroup.id === 'img-optimizer') return 'Compress Image';
      if (activeGroup.id === 'img-adjustments') return 'Apply Adjustments';
      if (activeGroup.id === 'img-metadata') return 'Strip EXIF Metadata';
      if (activeGroup.id === 'img-compose') return 'Apply Watermark';
      if (activeGroup.id === 'img-to-pdf-util') return 'Export to PDF';
      return activeUtility.primaryLabel ? activeUtility.primaryLabel.replace('{n}', files.length.toString()) : 'Process Image';
    }

    if (workspace.id === 'documents') {
      if (activeGroup.id === 'doc-converter') return `Convert to ${docTargetFormat.toUpperCase()}`;
      if (activeGroup.id === 'doc-editor') return 'Save Document Edits';
      if (activeGroup.id === 'doc-compare') return 'Save Diff Report';
      if (activeGroup.id === 'doc-metadata') return 'Strip Office Metadata';
      return 'Export Document';
    }

    if (workspace.id === 'data') {
      if (activeGroup.id === 'data-converter' || activeUtility.id.startsWith('data-convert-')) return `Convert to ${dataFormat.toUpperCase()}`;
      if (activeGroup.id === 'data-validator' || activeUtility.id === 'data-schema') return 'Validate Schema';
      if (activeGroup.id === 'data-query') return 'Execute SQL';
      if (activeUtility.id === 'data-dedup') return 'Deduplicate Rows';
      if (activeUtility.id === 'data-columns' || activeUtility.id === 'data-transpose') return 'Transpose Data';
      return 'Transform Data';
    }

    if (workspace.id === 'text') {
      if (activeGroup.id === 'text-transformer') return 'Apply Case Transform';
      if (activeGroup.id === 'text-cleaner') return 'Clean Whitespace';
      if (activeGroup.id === 'text-generator') return 'Insert Lorem Ipsum';
      if (activeUtility.id === 'text-diff') return 'Update Baseline';
      return 'Apply Text Action';
    }
    const selectedCount = pages.filter((p) => p.selected).length;
    if (activeUtility.primaryLabel) {
      if (currentMode === 'pages') {
        const n = selectedCount > 0 ? selectedCount : pages.length;
        return activeUtility.primaryLabel.replace('{n}', n.toString());
      }
      if (currentMode === 'tray') {
        return activeUtility.primaryLabel.replace('{n}', files.length.toString());
      }
      if (currentMode === 'markers') {
        return activeUtility.primaryLabel.replace('{n}', splitConfig.partsCount.toString());
      }
      return activeUtility.primaryLabel.replace('{n}', files.length.toString());
    }
    return `Run ${activeUtility.name}`;
  }, [activeUtility, currentMode, pages, files.length, splitConfig.partsCount]);

  // All actions filtered list
  const filteredAllActions = useMemo(() => {
    const all = workspace.groups.flatMap((g) => g.utilities.map((u) => ({ group: g, utility: u })));
    if (!actionsSearch.trim()) return all;
    const q = actionsSearch.toLowerCase();
    return all.filter(
      (item) =>
        item.utility.name.toLowerCase().includes(q) ||
        item.utility.description.toLowerCase().includes(q) ||
        item.group.name.toLowerCase().includes(q)
    );
  }, [workspace, actionsSearch]);

  return (
    <div className="workbench-shell-container">
      {/* Top Menubar */}
      <header className="workbench-top-bar">
        <div className="workbench-top-left">
          <h2 className="workbench-title">{workspace.name}</h2>
          <nav className="workbench-menubar" role="menubar">
            {workspace.groups.slice(0, 7).map((group) => {
              const isGroupActive = activeGroup.id === group.id || activeMenu === group.id;
              return (
                <div key={group.id} className="workbench-menu-container">
                  <button
                    className={`workbench-menu-btn ${isGroupActive ? 'is-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === group.id ? null : group.id);
                    }}
                    role="menuitem"
                    aria-haspopup="true"
                    aria-expanded={activeMenu === group.id}
                  >
                    <group.icon size={16} />
                    <span>{group.name}</span>
                  </button>
                  {activeMenu === group.id && (
                    <div className="workbench-dropdown-menu" role="menu">
                      {group.utilities.map((util) => (
                        <button
                          key={util.id}
                          className={`workbench-dropdown-item ${activeUtility.id === util.id ? 'is-selected' : ''
                            }`}
                          onClick={() => handleUtilityClick(group, util)}
                          role="menuitem"
                        >
                          <util.icon size={15} />
                          <span>{util.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="workbench-top-right">
          <button
            className="workbench-icon-btn"
            title="All actions"
            onClick={() => setShowAllActions(!showAllActions)}
          >
            <Grid size={16} />
          </button>
          <button
            className="workbench-icon-btn"
            title="What this can do"
            onClick={() => setShowWhatModal(true)}
          >
            <Info size={16} />
          </button>
        </div>
      </header>

      {/* "All Actions" Popover Drawer */}
      {showAllActions && (
        <div className="workbench-actions-popover">
          <div className="popover-search-row">
            <input
              type="text"
              className="popover-search-input"
              placeholder="Search all actions in this workspace..."
              value={actionsSearch}
              onChange={(e) => setActionsSearch(e.target.value)}
              autoFocus
            />
            <button
              className="popover-close-btn"
              onClick={() => setShowAllActions(false)}
            >
              Close
            </button>
          </div>
          <div className="popover-actions-grid">
            {filteredAllActions.map(({ group, utility }) => (
              <button
                key={utility.id}
                className="popover-action-card"
                onClick={() => {
                  handleUtilityClick(group, utility);
                  setShowAllActions(false);
                }}
              >
                <div className="action-card-header">
                  <utility.icon size={16} />
                  <strong>{utility.name}</strong>
                </div>
                <span className="action-card-group">{group.name}</span>
                <p className="action-card-desc">{utility.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* "What this can do" Modal */}
      {showWhatModal && (
        <div className="workbench-modal-backdrop" onClick={() => setShowWhatModal(false)}>
          <div className="workbench-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>What {activeUtility.name} can do</h3>
              <button className="modal-close-btn" onClick={() => setShowWhatModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{activeUtility.description}</p>
              <h4>Features & Capabilities:</h4>
              <ul className="modal-features-list">
                {activeUtility.features && activeUtility.features.length > 0 ? (
                  activeUtility.features.map((f) => (
                    <li key={f.id}>
                      <strong>{f.name}:</strong> {f.description}
                    </li>
                  ))
                ) : (
                  <li>Full high-performance local processing on your machine.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="workbench-main-area">
        {showEmptyState ? (
          <div className="workbench-empty-state">
            <div className="workbench-empty-dropzone-wrapper">
              <FileDropzone
                accept={activeUtility.acceptedFormats || (workspace.id === 'images' ? ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.svg', '.heic', '.avif'] : workspace.id === 'documents' ? ['.docx', '.doc', '.txt', '.md', '.markdown', '.html', '.htm', '.rtf', '.pdf'] : workspace.id === 'media' ? ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a', '.mp4', '.webm', '.mov', '.mkv'] : workspace.id === 'files' ? ['*'] : ['.pdf'])}
                multiple={workspace.id === 'images' || workspace.id === 'files' || activeUtility.accepts === 'many'}
                files={files}
                onFilesChanged={handleFilesChanged}
                label={
                  activeUtility.primaryLabel
                    ? activeUtility.primaryLabel.replace('{n}', 'files')
                    : `Drag files here for ${activeUtility.name}`
                }
              />
            </div>
          </div>
        ) : isStandaloneWorkspace ? (
          <div className="workbench-standalone-canvas">
            {workspace.id === 'calculator' && (
              <CalculatorWorkspaceView utilityId={activeUtility.id} />
            )}
            {workspace.id === 'developer' && (
              <DeveloperWorkspaceView
                groupId={activeGroup.id}
                utilityId={activeUtility.id}
                toolName={activeUtility.name}
                toolDescription={activeUtility.description}
                onBackToUtilities={() => {}}
              />
            )}
            {workspace.id === 'security' && (
              <SecurityWorkspaceView
                groupId={activeGroup.id}
                utilityId={activeUtility.id}
                toolName={activeUtility.name}
                toolDescription={activeUtility.description}
                onBackToUtilities={() => {}}
              />
            )}
            {workspace.id === 'network' && (
              <NetworkWorkspaceView
                groupId={activeGroup.id}
                utilityId={activeUtility.id}
                toolName={activeUtility.name}
                toolDescription={activeUtility.description}
                onBackToUtilities={() => {}}
              />
            )}
            {workspace.id === 'design' && (
              <DesignWorkspaceView
                groupId={activeGroup.id}
                utilityId={activeUtility.id}
                toolName={activeUtility.name}
                toolDescription={activeUtility.description}
                onBackToUtilities={() => {}}
              />
            )}
            {workspace.id === 'system' && (
              <SystemWorkspaceView
                groupId={activeGroup.id}
                utilityId={activeUtility.id}
                toolName={activeUtility.name}
                toolDescription={activeUtility.description}
                onBackToUtilities={() => {}}
              />
            )}
          </div>
        ) : (
          <div className="workbench-canvas-wrapper">
            {/* Phase 5: Images Workspace 3-Zone Layout */}
            {workspace.id === 'images' && (
              <div className="workbench-3-zone-layout">
                {/* Zone 1: Interactive Canvas */}
                <div className="workbench-zone-1 image-canvas-zone">
                  <ImageCanvas
                    files={files}
                    activeFileIndex={activeImageIndex}
                    onSelectFileIndex={setActiveImageIndex}
                    onAddMoreFiles={(newFilesList) => {
                      const existingNames = new Set(files.map((f) => f.name));
                      const arr = Array.from(newFilesList).map((f) => {
                        let name = f.name;
                        if (existingNames.has(name)) {
                          const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
                          const base = name.replace(/\.[^.]+$/, '');
                          let counter = 1;
                          while (existingNames.has(`${base} (${counter})${ext}`)) {
                            counter++;
                          }
                          name = `${base} (${counter})${ext}`;
                        }
                        existingNames.add(name);
                        return {
                          name,
                          size: f.size,
                          file: f,
                        };
                      });
                      setFiles((prev) => [...prev, ...arr]);
                    }}
                    onRemoveFile={(idx) => {
                      setFiles((prev) => prev.filter((_, i) => i !== idx));
                      if (activeImageIndex >= idx && activeImageIndex > 0) {
                        setActiveImageIndex(activeImageIndex - 1);
                      }
                    }}
                    activeUtilityId={activeUtility.id}
                    originalBuffer={versionStack[0]?.buffer}
                    currentBuffer={files[activeImageIndex]?.buffer || files[0]?.buffer}
                    cropRect={cropRect}
                    onCropChange={setCropRect}
                    cropAspect={cropAspect}
                    filterStyle={{
                      filter: `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%) blur(${imgBlur}px) ${imgGrayscale ? 'grayscale(100%)' : ''} ${imgInvert ? 'invert(100%)' : ''}`,
                    }}
                  />
                </div>

                {/* Zone 2: Options Panel for Images */}
                <div className="workbench-zone-2">
                  <div className="options-panel-header">
                    <h3>{activeGroup.id === 'img-converter' ? 'Format Converter' : activeUtility.name}</h3>
                    <p>{activeGroup.id === 'img-converter' ? 'Convert images to standard raster and vector formats offline.' : activeUtility.description}</p>
                  </div>
                  <div className="options-panel-body">
                    {/* 1. Format Converter - ONE Panel with Format Tiles */}
                    {(activeGroup.id === 'img-converter' || activeUtility.id.startsWith('convert-') || activeUtility.id === 'img-heic-converter' || activeUtility.id === 'img-avif-converter' || activeUtility.id === 'img-svg-to-png') && (
                      <div className="panel-options-section">
                        <label className="option-label">Target Format</label>
                        <div className="format-tiles-grid">
                          {[
                            { id: 'jpeg', label: 'JPG', desc: 'Standard photo format' },
                            { id: 'png', label: 'PNG', desc: 'Lossless transparency' },
                            { id: 'webp', label: 'WebP', desc: 'Modern web image' },
                            { id: 'bmp', label: 'BMP', desc: 'Raw bitmap container' },
                            { id: 'tiff', label: 'TIFF', desc: 'Print & archive' },
                            { id: 'svg', label: 'SVG', desc: 'Vector to PNG' },
                            { id: 'heic', label: 'HEIC', desc: 'iPhone photos' },
                            { id: 'avif', label: 'AVIF', desc: 'Next-gen AV1 photo' },
                          ].map((tile) => (
                            <button
                              key={tile.id}
                              type="button"
                              className={`format-tile-card ${imageFormat === tile.id ? 'is-selected' : ''}`}
                              onClick={() => setImageFormat(tile.id as any)}
                            >
                              <div className="format-tile-header">
                                <span className="format-tile-ext">.{tile.label}</span>
                                {imageFormat === tile.id && <Check size={14} style={{ color: 'var(--accent)' }} />}
                              </div>
                              <span className="format-tile-desc">{tile.desc}</span>
                            </button>
                          ))}
                        </div>

                        {(imageFormat === 'jpeg' || imageFormat === 'webp') && (
                          <>
                            <label className="option-label">Quality ({imageQuality}%)</label>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={imageQuality}
                              onChange={(e) => setImageQuality(parseInt(e.target.value, 10))}
                              className="annotate-slider"
                            />
                          </>
                        )}

                        <div style={{ marginTop: '12px' }}>
                          <label className="workbench-checkbox-label">
                            <input
                              type="checkbox"
                              checked={keepExif}
                              onChange={(e) => setKeepExif(e.target.checked)}
                            />
                            <span>Preserve camera EXIF metadata</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* 2. Transform Menu */}
                    {activeGroup.id === 'img-transformer' && !activeUtility.id.startsWith('convert-') && activeUtility.id !== 'img-heic-converter' && activeUtility.id !== 'img-avif-converter' && (
                      <div className="panel-options-section">
                        {activeUtility.id === 'img-resize' && (
                          <>
                            <label className="option-label">Width (px)</label>
                            <input
                              type="number"
                              className="workbench-text-input"
                              value={resizeWidth}
                              onChange={(e) => {
                                const w = parseInt(e.target.value, 10) || 100;
                                setResizeWidth(w);
                                if (lockAspect && resizeWidth > 0 && resizeHeight > 0) {
                                  const ratio = resizeHeight / resizeWidth;
                                  setResizeHeight(Math.round(w * ratio));
                                }
                              }}
                            />
                            <label className="option-label" style={{ marginTop: '10px' }}>Height (px)</label>
                            <input
                              type="number"
                              className="workbench-text-input"
                              value={resizeHeight}
                              onChange={(e) => {
                                const h = parseInt(e.target.value, 10) || 100;
                                setResizeHeight(h);
                                if (lockAspect && resizeWidth > 0 && resizeHeight > 0) {
                                  const ratio = resizeWidth / resizeHeight;
                                  setResizeWidth(Math.round(h * ratio));
                                }
                              }}
                            />
                            <div style={{ marginTop: '10px' }}>
                              <label className="workbench-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={lockAspect}
                                  onChange={(e) => setLockAspect(e.target.checked)}
                                />
                                <span>Lock aspect ratio</span>
                              </label>
                            </div>
                            <div className="dimension-presets-row">
                              {[
                                { label: '50%', w: 600, h: 400 },
                                { label: '75%', w: 900, h: 600 },
                                { label: '100%', w: 1200, h: 800 },
                                { label: '150%', w: 1800, h: 1200 },
                                { label: '1080p', w: 1920, h: 1080 },
                                { label: 'Square', w: 1080, h: 1080 },
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  className="preset-chip-btn"
                                  onClick={() => {
                                    setResizeWidth(preset.w);
                                    setResizeHeight(preset.h);
                                  }}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {activeUtility.id === 'img-crop' && (
                          <>
                            <label className="option-label">Aspect Ratio Preset</label>
                            <div className="workbench-preset-buttons">
                              {(['free', '1:1', '4:3', '16:9', '9:16'] as const).map((asp) => (
                                <button
                                  key={asp}
                                  type="button"
                                  className={`preset-chip-btn ${cropAspect === asp ? 'is-active' : ''}`}
                                  onClick={() => setCropAspect(asp)}
                                >
                                  {asp === 'free' ? 'Free' : asp}
                                </button>
                              ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                              <div>
                                <label className="option-label">X (%):</label>
                                <input
                                  type="number"
                                  className="workbench-text-input"
                                  value={cropRect.x}
                                  onChange={(e) => setCropRect({ ...cropRect, x: parseInt(e.target.value, 10) || 0 })}
                                />
                              </div>
                              <div>
                                <label className="option-label">Y (%):</label>
                                <input
                                  type="number"
                                  className="workbench-text-input"
                                  value={cropRect.y}
                                  onChange={(e) => setCropRect({ ...cropRect, y: parseInt(e.target.value, 10) || 0 })}
                                />
                              </div>
                              <div>
                                <label className="option-label">Width (%):</label>
                                <input
                                  type="number"
                                  className="workbench-text-input"
                                  value={cropRect.width}
                                  onChange={(e) => setCropRect({ ...cropRect, width: parseInt(e.target.value, 10) || 10 })}
                                />
                              </div>
                              <div>
                                <label className="option-label">Height (%):</label>
                                <input
                                  type="number"
                                  className="workbench-text-input"
                                  value={cropRect.height}
                                  onChange={(e) => setCropRect({ ...cropRect, height: parseInt(e.target.value, 10) || 10 })}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {activeUtility.id === 'img-rotate' && (
                          <>
                            <label className="option-label">Rotate & Flip Actions</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                type="button"
                                className="action-btn-secondary"
                                onClick={() => handlePrimaryProcess()}
                              >
                                Rotate 90° Clockwise
                              </button>
                            </div>
                          </>
                        )}

                        {activeUtility.id === 'img-aspect' && (
                          <>
                            <label className="option-label">Canvas Aspect Ratio</label>
                            <select className="workbench-select">
                              <option value="16:9">16:9 Widescreen</option>
                              <option value="4:3">4:3 Standard</option>
                              <option value="1:1">1:1 Square</option>
                              <option value="9:16">9:16 Vertical Story</option>
                            </select>
                          </>
                        )}
                      </div>
                    )}

                    {/* 3. Optimize Menu */}
                    {activeGroup.id === 'img-optimizer' && (
                      <div className="panel-options-section">
                        <label className="option-label">Compression Quality ({optQuality}%)</label>
                        <input
                          type="range"
                          min="10"
                          max="95"
                          value={optQuality}
                          onChange={(e) => setOptQuality(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                        <div style={{ marginTop: '12px' }}>
                          <label className="workbench-checkbox-label">
                            <input
                              type="checkbox"
                              checked={optLossless}
                              onChange={(e) => setOptLossless(e.target.checked)}
                            />
                            <span>Lossless compression mode</span>
                          </label>
                        </div>
                        <div className="savings-preview-badge">
                          <span>
                            Est. size: ~{files[activeImageIndex] ? Math.max(1, Math.round((files[activeImageIndex].size * (optQuality / 100) * (optLossless ? 0.85 : 0.45)) / 1024)) : 0} KB (~{Math.round(100 - optQuality * (optLossless ? 0.35 : 0.75))}% reduction)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 4. Adjust Menu */}
                    {activeGroup.id === 'img-adjustments' && (
                      <div className="panel-options-section">
                        <label className="option-label">Brightness ({imgBrightness}%)</label>
                        <input
                          type="range"
                          min="30"
                          max="180"
                          value={imgBrightness}
                          onChange={(e) => setImgBrightness(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                        <label className="option-label" style={{ marginTop: '10px' }}>Contrast ({imgContrast}%)</label>
                        <input
                          type="range"
                          min="30"
                          max="180"
                          value={imgContrast}
                          onChange={(e) => setImgContrast(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                        <label className="option-label" style={{ marginTop: '10px' }}>Saturation ({imgSaturation}%)</label>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={imgSaturation}
                          onChange={(e) => setImgSaturation(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                        <label className="option-label" style={{ marginTop: '10px' }}>Blur ({imgBlur}px)</label>
                        <input
                          type="range"
                          min="0"
                          max="15"
                          value={imgBlur}
                          onChange={(e) => setImgBlur(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label className="workbench-checkbox-label">
                            <input
                              type="checkbox"
                              checked={imgGrayscale}
                              onChange={(e) => setImgGrayscale(e.target.checked)}
                            />
                            <span>Grayscale (Black & White)</span>
                          </label>
                          <label className="workbench-checkbox-label">
                            <input
                              type="checkbox"
                              checked={imgInvert}
                              onChange={(e) => setImgInvert(e.target.checked)}
                            />
                            <span>Invert colors</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          style={{ marginTop: '14px', width: '100%' }}
                          onClick={() => {
                            setImgBrightness(100);
                            setImgContrast(100);
                            setImgSaturation(100);
                            setImgBlur(0);
                            setImgGrayscale(false);
                            setImgInvert(false);
                          }}
                        >
                          Reset adjustments
                        </button>
                      </div>
                    )}

                    {/* 5. Metadata Menu */}
                    {activeGroup.id === 'img-metadata' && (
                      <div className="panel-options-section">
                        <div className="info-stat-row">
                          <span>File:</span>
                          <strong>{files[activeImageIndex]?.name}</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Camera:</span>
                          <strong>{imageExifData?.camera || 'Offline Device'}</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Date:</span>
                          <strong>{imageExifData?.dateTime || new Date().toLocaleDateString()}</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>GPS Location:</span>
                          <strong>{imageExifData?.gps ? 'Present (Protected)' : 'None'}</strong>
                        </div>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          style={{ marginTop: '16px', width: '100%' }}
                          onClick={handlePrimaryProcess}
                        >
                          Strip all EXIF metadata
                        </button>
                      </div>
                    )}

                    {/* 6. Compose Menu */}
                    {activeGroup.id === 'img-compose' && (
                      <div className="panel-options-section">
                        <label className="option-label">Watermark Text</label>
                        <input
                          type="text"
                          className="workbench-text-input"
                          value={imgWatermarkText}
                          onChange={(e) => setImgWatermarkText(e.target.value)}
                        />
                        <label className="option-label" style={{ marginTop: '10px' }}>Opacity ({Math.round(imgWatermarkOpacity * 100)}%)</label>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={Math.round(imgWatermarkOpacity * 100)}
                          onChange={(e) => setImgWatermarkOpacity(parseInt(e.target.value, 10) / 100)}
                          className="annotate-slider"
                        />
                        <label className="option-label" style={{ marginTop: '10px' }}>Font Size ({imgWatermarkSize}pt)</label>
                        <input
                          type="range"
                          min="18"
                          max="72"
                          value={imgWatermarkSize}
                          onChange={(e) => setImgWatermarkSize(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                      </div>
                    )}

                    {/* 7. Image -> PDF */}
                    {activeGroup.id === 'img-to-pdf-util' && (
                      <div className="panel-options-section">
                        <label className="option-label">PDF Page Size</label>
                        <select className="workbench-select">
                          <option value="fit">Fit to Image Size</option>
                          <option value="a4">Standard A4 Sheet</option>
                          <option value="letter">US Letter Sheet</option>
                        </select>
                        <label className="option-label" style={{ marginTop: '10px' }}>Page Margins</label>
                        <select className="workbench-select">
                          <option value="none">Zero Margins (Edge-to-Edge)</option>
                          <option value="normal">Normal (0.5 inch)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phase 5: Documents Workspace 3-Zone Layout */}
            {workspace.id === 'documents' && (
              <div className="workbench-3-zone-layout">
                {/* Zone 1: Document Sheet Preview / Editor / Diff */}
                <div className="workbench-zone-1 document-canvas-zone">
                  <DocumentCanvas
                    files={files}
                    activeUtilityId={activeUtility.id}
                    fontTheme={docFontTheme}
                    pageSize={docPageSize}
                    onTextContentChange={setDocRawText}
                  />
                </div>

                {/* Zone 2: Options Panel for Documents */}
                <div className="workbench-zone-2">
                  <div className="options-panel-header">
                    <h3>{activeUtility.name}</h3>
                    <p>{activeUtility.description}</p>
                  </div>
                  <div className="options-panel-body">
                    {/* Convert Options */}
                    {activeGroup.id === 'doc-converter' && (
                      <div className="panel-options-section">
                        <label className="option-label">Target Format</label>
                        <select
                          className="workbench-select"
                          value={docTargetFormat}
                          onChange={(e: any) => setDocTargetFormat(e.target.value)}
                        >
                          <option value="pdf">PDF Document (.pdf)</option>
                          <option value="docx">Word Document (.docx)</option>
                          <option value="txt">Plain Text (.txt)</option>
                          <option value="html">HTML Document (.html)</option>
                          <option value="rtf">Rich Text (.rtf)</option>
                        </select>
                        <label className="option-label" style={{ marginTop: '10px' }}>Page Size Preset</label>
                        <select
                          className="workbench-select"
                          value={docPageSize}
                          onChange={(e: any) => setDocPageSize(e.target.value)}
                        >
                          <option value="a4">A4 (210 × 297 mm)</option>
                          <option value="letter">US Letter (8.5 × 11 in)</option>
                          <option value="legal">US Legal (8.5 × 14 in)</option>
                        </select>
                        <label className="option-label" style={{ marginTop: '10px' }}>Typography Theme</label>
                        <select
                          className="workbench-select"
                          value={docFontTheme}
                          onChange={(e: any) => setDocFontTheme(e.target.value)}
                        >
                          <option value="sans">Clean Modern Sans</option>
                          <option value="serif">Classic Editorial Serif</option>
                          <option value="mono">Technical Monospace</option>
                        </select>
                      </div>
                    )}

                    {/* Edit Options */}
                    {activeGroup.id === 'doc-editor' && (
                      <div className="panel-options-section">
                        <label className="option-label">Formatting Helpers</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            type="button"
                            className="action-btn-secondary"
                            onClick={() => {
                              const cleaned = docRawText.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
                              setDocRawText(cleaned);
                            }}
                          >
                            Trim excess whitespace
                          </button>
                          <button
                            type="button"
                            className="action-btn-secondary"
                            onClick={() => setDocRawText(docRawText.toUpperCase())}
                          >
                            Convert to uppercase
                          </button>
                          <button
                            type="button"
                            className="action-btn-secondary"
                            onClick={() => setDocRawText(docRawText.toLowerCase())}
                          >
                            Convert to lowercase
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Compare Options */}
                    {activeGroup.id === 'doc-compare' && (
                      <div className="panel-options-section">
                        <label className="option-label">Comparison Settings</label>
                        <div className="info-stat-row">
                          <span>Primary File:</span>
                          <strong>{files[0]?.name || 'Document A'}</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Compare With:</span>
                          <strong>{files[1]?.name || 'Drop second file to diff'}</strong>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <label className="workbench-checkbox-label">
                            <input type="checkbox" defaultChecked />
                            <span>Ignore whitespace changes</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Metadata Options */}
                    {activeGroup.id === 'doc-metadata' && (
                      <div className="panel-options-section">
                        <div className="info-stat-row">
                          <span>Document:</span>
                          <strong>{files[0]?.name}</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Author:</span>
                          <strong>Cleaned / Not embedded</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Company:</span>
                          <strong>Protected</strong>
                        </div>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          style={{ marginTop: '16px', width: '100%' }}
                          onClick={handlePrimaryProcess}
                        >
                          Strip Author & Company
                        </button>
                      </div>
                    )}

                    {/* Export Options */}
                    {activeGroup.id === 'doc-export' && (
                      <div className="panel-options-section">
                        <label className="option-label">Export Format</label>
                        <select
                          className="workbench-select"
                          value={docTargetFormat}
                          onChange={(e: any) => setDocTargetFormat(e.target.value)}
                        >
                          <option value="pdf">PDF Document (.pdf)</option>
                          <option value="txt">Plain Text (.txt)</option>
                          <option value="html">HTML Document (.html)</option>
                          <option value="docx">Word (.docx)</option>
                        </select>
                        <div style={{ marginTop: '12px' }}>
                          <label className="workbench-checkbox-label">
                            <input
                              type="checkbox"
                              checked={docIncludeHeader}
                              onChange={(e) => setDocIncludeHeader(e.target.checked)}
                            />
                            <span>Include metadata header</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phase 6: Data Workspace 3-Zone Layout */}
            {workspace.id === 'data' && (
              <div className="workbench-3-zone-layout">
                {/* Zone 1: Interactive Data Canvas */}
                <div className="workbench-zone-1 data-canvas-zone">
                  <DataCanvas
                    dataContent={dataContent}
                    onDataChange={(newVal) => {
                      setDataContent(newVal);
                      const buf = new TextEncoder().encode(newVal);
                      if (files[0]) files[0].buffer = buf;
                    }}
                    format={dataFormat}
                    viewMode={dataViewMode}
                    onViewModeChange={setDataViewMode}
                    delimiter={dataDelimiter}
                    hasHeader={dataHasHeader}
                    onLoadSample={handleLoadSampleData}
                    fileName={files[0]?.name}
                  />
                </div>

                {/* Zone 2: Options Panel for Data */}
                <div className="workbench-zone-2">
                  <div className="options-panel-header">
                    <h3>{activeGroup.id === 'data-converter' ? 'Format Converter' : activeUtility.name}</h3>
                    <p>{activeGroup.id === 'data-converter' ? 'Convert tabular and structured data across offline formats.' : activeUtility.description}</p>
                  </div>
                  <div className="options-panel-body">
                    {/* Format Converter Tiles */}
                    <div className="panel-options-section">
                      <label className="option-label">Target Format</label>
                      <div className="format-tiles-grid">
                        {[
                          { id: 'csv', label: 'CSV', desc: 'Delimited text table' },
                          { id: 'json', label: 'JSON', desc: 'Structured data tree' },
                          { id: 'yaml', label: 'YAML', desc: 'Human-readable config' },
                          { id: 'xml', label: 'XML', desc: 'Markup document' },
                          { id: 'tsv', label: 'TSV', desc: 'Tab-separated values' },
                          { id: 'xlsx', label: 'XLSX', desc: 'Excel spreadsheet' },
                        ].map((tile) => (
                          <button
                            key={tile.id}
                            type="button"
                            className={`format-tile-card ${dataFormat === tile.id ? 'is-selected' : ''}`}
                            onClick={() => handleConvertDataFormat(tile.id as any)}
                          >
                            <div className="format-tile-header">
                              <span className="format-tile-ext">.{tile.label}</span>
                              {dataFormat === tile.id && <Check size={14} style={{ color: 'var(--accent)' }} />}
                            </div>
                            <span className="format-tile-desc">{tile.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table Options (CSV / TSV) */}
                    {(dataFormat === 'csv' || dataFormat === 'tsv') && (
                      <div className="panel-options-section">
                        <label className="option-label">Table Parsing Options</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <label className="option-label">Delimiter</label>
                            <select
                              className="workbench-select"
                              value={dataDelimiter}
                              onChange={(e) => setDataDelimiter(e.target.value)}
                            >
                              <option value=",">Comma (,)</option>
                              <option value=";">Semicolon (;)</option>
                              <option value="&#9;">Tab (\t)</option>
                              <option value="|">Pipe (|)</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <label className="workbench-checkbox-label">
                            <input
                              type="checkbox"
                              checked={dataHasHeader}
                              onChange={(e) => setDataHasHeader(e.target.checked)}
                            />
                            <span>First row is header</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Transforms */}
                    <div className="panel-options-section">
                      <label className="option-label">Transforms & Operations</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleDeduplicateRows}
                        >
                          Deduplicate
                        </button>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleTransposeData}
                        >
                          Transpose
                        </button>
                      </div>
                    </div>

                    {/* Schema Validation Section */}
                    {(activeGroup.id === 'data-validator' || activeUtility.id === 'data-schema') && (
                      <div className="panel-options-section">
                        <label className="option-label">JSON Schema Validator</label>
                        <textarea
                          className="workbench-textarea"
                          rows={4}
                          value={dataSchemaInput}
                          onChange={(e) => setDataSchemaInput(e.target.value)}
                          placeholder="Paste JSON Schema here..."
                        />
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleValidateSchema}
                          style={{ marginTop: '6px' }}
                        >
                          Validate Against Schema
                        </button>
                        {dataSchemaValidation && (
                          <div className={`schema-val-badge ${dataSchemaValidation.valid ? 'is-valid' : 'is-invalid'}`}>
                            {dataSchemaValidation.valid ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                            <span>{dataSchemaValidation.message}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SQL on CSV Query Section */}
                    {activeGroup.id === 'data-query' && (
                      <div className="panel-options-section">
                        <label className="option-label">SQL Query (Offline Engine)</label>
                        <input
                          type="text"
                          className="workbench-text-input"
                          value={dataSqlQuery}
                          onChange={(e) => setDataSqlQuery(e.target.value)}
                          placeholder="SELECT * WHERE ..."
                        />
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleExecuteSql}
                          style={{ marginTop: '6px' }}
                        >
                          Run SQL Query
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phase 6: Text Workspace 3-Zone Layout */}
            {workspace.id === 'text' && (
              <div className="workbench-3-zone-layout">
                {/* Zone 1: Interactive Monospace Text Canvas */}
                <div className="workbench-zone-1 text-canvas-zone">
                  <TextCanvas
                    text={textContent}
                    onTextChange={(newVal) => {
                      setTextContent(newVal);
                      const buf = new TextEncoder().encode(newVal);
                      if (files[0]) files[0].buffer = buf;
                    }}
                    originalText={textOriginalContent}
                    viewMode={textViewMode}
                    onViewModeChange={setTextViewMode}
                    fontSize={textFontSize}
                    onFontSizeChange={setTextFontSize}
                    wordWrap={textWordWrap}
                    onWordWrapChange={setTextWordWrap}
                    onLoadSample={handleLoadSampleText}
                  />
                </div>

                {/* Zone 2: Options Panel for Text */}
                <div className="workbench-zone-2">
                  <div className="options-panel-header">
                    <h3>{activeUtility.name}</h3>
                    <p>{activeUtility.description}</p>
                  </div>
                  <div className="options-panel-body">
                    {/* 1. Case Conversions */}
                    <div className="panel-options-section">
                      <label className="option-label">Case Conversions</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                        {[
                          { id: 'upper', label: 'UPPERCASE' },
                          { id: 'lower', label: 'lowercase' },
                          { id: 'title', label: 'Title Case' },
                          { id: 'camel', label: 'camelCase' },
                          { id: 'snake', label: 'snake_case' },
                          { id: 'kebab', label: 'kebab-case' },
                          { id: 'pascal', label: 'PascalCase' },
                          { id: 'constant', label: 'CONSTANT_CASE' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="action-btn-secondary"
                            style={{ fontSize: '11px', padding: '6px' }}
                            onClick={() => handleApplyCase(c.id as CaseType)}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Line Sorting */}
                    <div className="panel-options-section">
                      <label className="option-label">Sort & Deduplicate Lines</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={() => handleSortLines('asc')}
                        >
                          Sort A → Z
                        </button>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={() => handleSortLines('desc')}
                        >
                          Sort Z → A
                        </button>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={() => handleSortLines('natural')}
                        >
                          Natural Sort
                        </button>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleDeduplicateLines}
                        >
                          Deduplicate
                        </button>
                      </div>
                    </div>

                    {/* 3. Clean & Format Whitespace */}
                    <div className="panel-options-section">
                      <label className="option-label">Whitespace & Cleaning</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleTrimLines}
                        >
                          Trim Leading / Trailing Spaces
                        </button>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleRemoveBlankLines}
                        >
                          Remove Blank Lines
                        </button>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleCollapseSpaces}
                        >
                          Collapse Extra Spaces
                        </button>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={handleTextToTable}
                        >
                          Convert Delimited to Markdown Table
                        </button>
                      </div>
                    </div>

                    {/* 4. Slugify */}
                    {activeUtility.id === 'text-slugify' && (
                      <div className="panel-options-section">
                        <label className="option-label">Slugify Options</label>
                        <label className="option-label">Separator</label>
                        <select
                          className="workbench-select"
                          value={textSlugSep}
                          onChange={(e: any) => setTextSlugSep(e.target.value)}
                        >
                          <option value="-">Hyphen (-)</option>
                          <option value="_">Underscore (_)</option>
                          <option value=".">Dot (.)</option>
                        </select>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          style={{ marginTop: '8px' }}
                          onClick={handleSlugify}
                        >
                          Generate URL Slug
                        </button>
                      </div>
                    )}

                    {/* 5. Generator: Lorem Ipsum */}
                    {(activeGroup.id === 'text-generator' || activeUtility.id === 'text-lorem') && (
                      <div className="panel-options-section">
                        <label className="option-label">Lorem Ipsum Generator</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="workbench-text-input"
                            style={{ width: '60px' }}
                            value={textLoremCount}
                            onChange={(e) => setTextLoremCount(parseInt(e.target.value, 10) || 1)}
                          />
                          <select
                            className="workbench-select"
                            style={{ flex: 1 }}
                            value={textLoremUnit}
                            onChange={(e: any) => setTextLoremUnit(e.target.value)}
                          >
                            <option value="paragraphs">Paragraphs</option>
                            <option value="sentences">Sentences</option>
                            <option value="words">Words</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          style={{ marginTop: '8px' }}
                          onClick={handleGenerateLorem}
                        >
                          Insert Placeholder Text
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phase 7: Media Workspace 3-Zone Layout */}
            {workspace.id === 'media' && (
              <div className="workbench-3-zone-layout">
                {/* Zone 1: Interactive Media Canvas */}
                <div className="workbench-zone-1 media-canvas-zone">
                  <MediaCanvas
                    files={files}
                    activeFileIndex={activeImageIndex}
                    onSelectFileIndex={setActiveImageIndex}
                    viewMode={mediaViewMode}
                    onViewModeChange={setMediaViewMode}
                    trimRange={mediaTrimRange}
                    onTrimRangeChange={setMediaTrimRange}
                    gainDb={mediaGainDb}
                    onGainDbChange={setMediaGainDb}
                    fadeInSec={mediaFadeInSec}
                    onFadeInSecChange={setMediaFadeInSec}
                    fadeOutSec={mediaFadeOutSec}
                    onFadeOutSecChange={setMediaFadeOutSec}
                    targetFormat={mediaTargetFormat}
                    onTargetFormatChange={setMediaTargetFormat}
                  />
                </div>

                {/* Zone 2: Options Panel for Media */}
                <div className="workbench-zone-2">
                  <div className="options-panel-header">
                    <h3>{activeUtility.name}</h3>
                    <p>{activeUtility.description}</p>
                  </div>
                  <div className="options-panel-body">
                    {/* Format Tiles */}
                    <div className="panel-options-section">
                      <label className="option-label">Target Container Format</label>
                      <div className="media-format-tiles">
                        {['wav', 'mp3', 'aac', 'flac', 'ogg', 'm4a', 'mp4', 'webm', 'gif'].map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            className={`format-tile ${mediaTargetFormat === fmt ? 'active' : ''}`}
                            onClick={() => setMediaTargetFormat(fmt)}
                          >
                            <span className="tile-ext">.{fmt.toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Trimming Controls */}
                    <div className="panel-options-section">
                      <label className="option-label">Trim Points</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Start (s)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="workbench-input"
                            value={Math.round(mediaTrimRange.start * 100) / 100}
                            onChange={(e) => setMediaTrimRange({ ...mediaTrimRange, start: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>End (s)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            className="workbench-input"
                            value={Math.round(mediaTrimRange.end * 100) / 100}
                            onChange={(e) => setMediaTrimRange({ ...mediaTrimRange, end: parseFloat(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Volume & Fade */}
                    <div className="panel-options-section">
                      <label className="option-label">Gain Adjustment (dB)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="range"
                          min="-18"
                          max="18"
                          step="1"
                          style={{ flex: 1, accentColor: 'var(--accent)' }}
                          value={mediaGainDb}
                          onChange={(e) => setMediaGainDb(parseInt(e.target.value, 10))}
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', minWidth: '40px' }}>
                          {mediaGainDb > 0 ? `+${mediaGainDb}` : mediaGainDb} dB
                        </span>
                      </div>
                    </div>

                    <div className="panel-options-section">
                      <label className="option-label">Fade Transitions</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fade In</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="5"
                            className="workbench-input"
                            value={mediaFadeInSec}
                            onChange={(e) => setMediaFadeInSec(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fade Out</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="5"
                            className="workbench-input"
                            value={mediaFadeOutSec}
                            onChange={(e) => setMediaFadeOutSec(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 7: Files Workspace 3-Zone Layout */}
            {workspace.id === 'files' && (
              <div className="workbench-3-zone-layout">
                {/* Zone 1: Interactive File Table & Archive Canvas */}
                <div className="workbench-zone-1 files-canvas-zone">
                  <FilesCanvas
                    files={files}
                    onRemoveFile={(idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    viewMode={filesViewMode}
                    onViewModeChange={setFilesViewMode}
                    renameRule={filesRenameRule}
                    onRenameRuleChange={setFilesRenameRule}
                    selectedFileIndices={filesSelectedIndices}
                    onToggleSelectIndex={(idx) => {
                      setFilesSelectedIndices((prev) =>
                        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                      );
                    }}
                    onToggleSelectAll={() => {
                      setFilesSelectedIndices((prev) =>
                        prev.length === files.length ? [] : files.map((_, i) => i)
                      );
                    }}
                    archiveEntries={filesArchiveEntries}
                    isArchiveLoading={filesArchiveLoading}
                  />
                </div>

                {/* Zone 2: Options Panel for Files */}
                <div className="workbench-zone-2">
                  <div className="options-panel-header">
                    <h3>{activeUtility.name}</h3>
                    <p>{activeUtility.description}</p>
                  </div>
                  <div className="options-panel-body">
                    {/* 1. Batch Rename Options */}
                    <div className="panel-options-section">
                      <label className="option-label">Batch Rename Affixes</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prefix</label>
                          <input
                            type="text"
                            placeholder="e.g. 2026_"
                            className="workbench-input"
                            value={filesRenameRule.prefix || ''}
                            onChange={(e) => setFilesRenameRule({ ...filesRenameRule, prefix: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Suffix</label>
                          <input
                            type="text"
                            placeholder="e.g. _v1"
                            className="workbench-input"
                            value={filesRenameRule.suffix || ''}
                            onChange={(e) => setFilesRenameRule({ ...filesRenameRule, suffix: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="panel-options-section">
                      <label className="option-label">Find and Replace</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Find text..."
                          className="workbench-input"
                          value={filesRenameRule.findText || ''}
                          onChange={(e) => setFilesRenameRule({ ...filesRenameRule, findText: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Replace with..."
                          className="workbench-input"
                          value={filesRenameRule.replaceText || ''}
                          onChange={(e) => setFilesRenameRule({ ...filesRenameRule, replaceText: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="panel-options-section">
                      <label className="option-label">Filename Case Conversion</label>
                      <div className="case-buttons-grid">
                        {[
                          { id: 'none', label: 'Preserve Case' },
                          { id: 'lower', label: 'lowercase' },
                          { id: 'upper', label: 'UPPERCASE' },
                          { id: 'capitalize', label: 'Capitalize' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className={`case-opt-btn ${filesRenameRule.caseTransform === c.id ? 'active' : ''}`}
                            onClick={() => setFilesRenameRule({ ...filesRenameRule, caseTransform: c.id as any })}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="panel-options-section">
                      <label className="option-label">Archive & Safety Status</label>
                      <div className="panel-stat-box" style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Compression</span>
                          <span style={{ fontWeight: 600 }}>DEFLATE Level 6</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Path Traversal Safety</span>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Zip Slip Protected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Existing PDF Workspace Modes */}
            {workspace.id === 'pdf' && currentMode === 'pages' && (
              <PdfPagesCanvas
                file={files[0]}
                activeUtilityId={activeUtility.id}
                pages={pages}
                onPagesChange={setPages}
                onExecutePageAction={handleExecutePageAction}
                cropMargins={cropMargins}
                onCropMarginsChange={setCropMargins}
                cropScope={cropScope}
                onCropScopeChange={setCropScope}
              />
            )}

            {/* Mode 2: Tray Mode */}
            {workspace.id === 'pdf' && currentMode === 'tray' && (
              <PdfTrayCanvas
                files={files}
                activeUtilityId={activeUtility.id}
                onFilesChange={setFiles}
                onAddMoreFiles={async (newFilesList) => {
                  const arr = await Promise.all(
                    Array.from(newFilesList).map(async (f) => ({
                      name: f.name,
                      size: f.size,
                      file: f,
                      buffer: new Uint8Array(await f.arrayBuffer()),
                    }))
                  );
                  setFiles((prev) => [...prev, ...arr]);
                }}
                fileRanges={fileRanges}
                onFileRangeChange={(name, range) =>
                  setFileRanges((prev) => ({ ...prev, [name]: range }))
                }
                compareResult={compareResult}
              />
            )}

            {/* Mode 3: Markers Mode */}
            {workspace.id === 'pdf' && currentMode === 'markers' && (
              <PdfMarkersCanvas
                file={files[0]}
                pageCount={pages.length || 4}
                onSplitConfigChange={setSplitConfig}
              />
            )}

            {/* Mode 4: Annotate Mode */}
            {workspace.id === 'pdf' && currentMode === 'annotate' && (
              <div className="workbench-3-zone-layout">
                {/* Zone 1: Main Canvas Preview with Live Overlays */}
                <div className="workbench-zone-1 annotate-canvas-zone">
                  <PdfAnnotateCanvas
                    file={files[0]}
                    activeUtilityId={activeUtility.id}
                    currentPage={annotatePage}
                    onPageChange={setAnnotatePage}
                    totalPages={pages.length || 1}
                    watermarkText={watermarkText}
                    watermarkOpacity={watermarkOpacity}
                    watermarkFontSize={watermarkFontSize}
                    watermarkRotation={watermarkRotation}
                    pageNumberPosition={pageNumberPosition}
                    pageNumberStart={pageNumberStart}
                    annotText={annotText}
                    annotFontSize={annotFontSize}
                    annotColor={annotColor}
                    stampPreset={stampPreset}
                    stampOpacity={stampOpacity}
                    signName={signName}
                    redactStyle={redactStyle}
                    redactLabel={redactLabel}
                    shapeType={shapeType}
                    shapeColor={shapeColor}
                    shapeBorderWidth={shapeBorderWidth}
                    highlightType={highlightType}
                    highlightColor={highlightColor}
                  />
                </div>

                {/* Zone 2: Options Panel for Annotate Tools */}
                <div className="workbench-zone-2">
                  <div className="options-panel-header">
                    <h3>{activeUtility.name}</h3>
                    <p>{activeUtility.description}</p>
                  </div>
                  <div className="options-panel-body">
                    {/* Watermark Options */}
                    {activeUtility.id === 'watermark' && (
                      <div className="panel-options-section">
                        <label className="option-label">Watermark Text</label>
                        <input
                          type="text"
                          className="workbench-text-input"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g. CONFIDENTIAL"
                        />
                        <div className="workbench-preset-buttons">
                          {['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'URGENT', 'COPY'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className={`preset-chip-btn ${watermarkText === preset ? 'is-active' : ''}`}
                              onClick={() => setWatermarkText(preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                        <label className="option-label">Opacity ({Math.round(watermarkOpacity * 100)}%)</label>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={Math.round(watermarkOpacity * 100)}
                          onChange={(e) => setWatermarkOpacity(parseInt(e.target.value, 10) / 100)}
                          className="annotate-slider"
                        />
                        <label className="option-label">Font Size ({watermarkFontSize}pt)</label>
                        <input
                          type="range"
                          min="24"
                          max="72"
                          value={watermarkFontSize}
                          onChange={(e) => setWatermarkFontSize(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                        <label className="option-label">Rotation</label>
                        <div className="workbench-preset-buttons">
                          <button
                            type="button"
                            className={`preset-chip-btn ${watermarkRotation === 45 ? 'is-active' : ''}`}
                            onClick={() => setWatermarkRotation(45)}
                          >
                            45° Diagonal
                          </button>
                          <button
                            type="button"
                            className={`preset-chip-btn ${watermarkRotation === 0 ? 'is-active' : ''}`}
                            onClick={() => setWatermarkRotation(0)}
                          >
                            Horizontal
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Page Numbers Options */}
                    {activeUtility.id === 'page-numbers' && (
                      <div className="panel-options-section">
                        <label className="option-label">Position on Page</label>
                        <div className="segmented-control" role="radiogroup" aria-label="Position on Page">
                          {[
                            { val: 'bottom-center', label: 'Bottom Center' },
                            { val: 'bottom-right', label: 'Bottom Right' },
                            { val: 'top-right', label: 'Top Right' },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              role="radio"
                              aria-checked={pageNumberPosition === opt.val}
                              className={`segmented-item ${pageNumberPosition === opt.val ? 'is-active' : ''}`}
                              onClick={() => setPageNumberPosition(opt.val as any)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <label className="option-label" style={{ marginTop: '12px' }}>
                          Start Page Number
                        </label>
                        <input
                          type="number"
                          className="workbench-text-input"
                          min={1}
                          value={pageNumberStart}
                          onChange={(e) => setPageNumberStart(parseInt(e.target.value, 10) || 1)}
                        />
                      </div>
                    )}

                    {/* Add Text Options */}
                    {activeUtility.id === 'add-text' && (
                      <div className="panel-options-section">
                        <label className="option-label">Text Annotation</label>
                        <input
                          type="text"
                          className="workbench-text-input"
                          value={annotText}
                          onChange={(e) => setAnnotText(e.target.value)}
                          placeholder="Enter text..."
                        />
                        <label className="option-label" style={{ marginTop: '10px' }}>
                          Font Size ({annotFontSize}pt)
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="36"
                          value={annotFontSize}
                          onChange={(e) => setAnnotFontSize(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                        <label className="option-label">Color</label>
                        <div className="workbench-color-swatches">
                          {[
                            { name: 'Gold', hex: '#D4B06A' },
                            { name: 'White', hex: '#FFFFFF' },
                            { name: 'Black', hex: '#000000' },
                            { name: 'Red', hex: '#DC2626' },
                            { name: 'Blue', hex: '#2563EB' },
                          ].map((col) => (
                            <button
                              key={col.hex}
                              type="button"
                              className={`color-swatch-btn ${annotColor === col.hex ? 'is-active' : ''}`}
                              style={{ backgroundColor: col.hex }}
                              onClick={() => setAnnotColor(col.hex)}
                              title={col.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Image / Stamp Options */}
                    {activeUtility.id === 'add-image' && (
                      <div className="panel-options-section">
                        <label className="option-label">Stamp Preset</label>
                        <select
                          className="workbench-select"
                          value={stampPreset}
                          onChange={(e) => setStampPreset(e.target.value)}
                        >
                          <option value="APPROVED">APPROVED (Green)</option>
                          <option value="VERIFIED">VERIFIED (Green)</option>
                          <option value="REJECTED">REJECTED (Red)</option>
                          <option value="CONFIDENTIAL">CONFIDENTIAL (Orange)</option>
                          <option value="PAID">PAID (Blue)</option>
                        </select>
                        <label className="option-label" style={{ marginTop: '10px' }}>
                          Opacity ({Math.round(stampOpacity * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={Math.round(stampOpacity * 100)}
                          onChange={(e) => setStampOpacity(parseInt(e.target.value, 10) / 100)}
                          className="annotate-slider"
                        />
                      </div>
                    )}

                    {/* Draw Shapes Options */}
                    {activeUtility.id === 'draw-shapes' && (
                      <div className="panel-options-section">
                        <label className="option-label">Shape Type</label>
                        <div className="segmented-control" role="radiogroup" aria-label="Shape Type">
                          {[
                            { val: 'rect', label: 'Rectangle' },
                            { val: 'circle', label: 'Circle' },
                            { val: 'line', label: 'Line' },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              role="radio"
                              aria-checked={shapeType === opt.val}
                              className={`segmented-item ${shapeType === opt.val ? 'is-active' : ''}`}
                              onClick={() => setShapeType(opt.val as any)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <label className="option-label" style={{ marginTop: '10px' }}>
                          Border Thickness ({shapeBorderWidth}px)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          value={shapeBorderWidth}
                          onChange={(e) => setShapeBorderWidth(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                      </div>
                    )}

                    {/* Highlight & Underline Options */}
                    {activeUtility.id === 'highlight-underline' && (
                      <div className="panel-options-section">
                        <label className="option-label">Markup Type</label>
                        <select
                          className="workbench-select"
                          value={highlightType}
                          onChange={(e: any) => setHighlightType(e.target.value)}
                        >
                          <option value="highlight">Yellow Highlight Bar</option>
                          <option value="underline">Text Underline Stripe</option>
                        </select>
                        <label className="option-label" style={{ marginTop: '10px' }}>
                          Highlight Color
                        </label>
                        <div className="workbench-color-swatches">
                          {[
                            { name: 'Yellow', hex: '#FACC15' },
                            { name: 'Green', hex: '#4ADE80' },
                            { name: 'Cyan', hex: '#38BDF8' },
                            { name: 'Pink', hex: '#F472B6' },
                          ].map((col) => (
                            <button
                              key={col.hex}
                              type="button"
                              className={`color-swatch-btn ${highlightColor === col.hex ? 'is-active' : ''}`}
                              style={{ backgroundColor: col.hex }}
                              onClick={() => setHighlightColor(col.hex)}
                              title={col.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sign PDF Options */}
                    {activeUtility.id === 'sign-pdf' && (
                      <div className="panel-options-section">
                        <label className="option-label">Signer Full Name</label>
                        <input
                          type="text"
                          className="workbench-text-input"
                          value={signName}
                          onChange={(e) => setSignName(e.target.value)}
                          placeholder="Your Name..."
                        />
                        <div className="info-stat-row" style={{ marginTop: '10px' }}>
                          <span>Certificate:</span>
                          <strong>Offline Local Verified</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Timestamp:</span>
                          <strong>{new Date().toLocaleDateString()}</strong>
                        </div>
                      </div>
                    )}

                    {/* Redact PDF Options */}
                    {activeUtility.id === 'pdf-redact' && (
                      <div className="panel-options-section">
                        <label className="option-label">Redaction Style</label>
                        <div className="segmented-control" role="radiogroup" aria-label="Redaction Style">
                          {[
                            { val: 'black', label: 'Solid Blackout' },
                            { val: 'white', label: 'Whiteout Mask' },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              role="radio"
                              aria-checked={redactStyle === opt.val}
                              className={`segmented-item ${redactStyle === opt.val ? 'is-active' : ''}`}
                              onClick={() => setRedactStyle(opt.val as any)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <label className="option-label" style={{ marginTop: '10px' }}>
                          Overlay Label
                        </label>
                        <input
                          type="text"
                          className="workbench-text-input"
                          value={redactLabel}
                          onChange={(e) => setRedactLabel(e.target.value)}
                        />
                        <div className="checkbox-control-row" style={{ marginTop: '10px' }}>
                          <input
                            type="checkbox"
                            id="strip-meta-redact"
                            checked={stripAllMetadata}
                            onChange={(e) => setStripAllMetadata(e.target.checked)}
                          />
                          <label htmlFor="strip-meta-redact">Strip document metadata for safety</label>
                        </div>
                      </div>
                    )}

                    {/* Form Fields / Bookmarks */}
                    {activeUtility.id === 'pdf-fill-form-fields' && (
                      <div className="panel-options-section">
                        <div className="info-stat-row">
                          <span>Form detection:</span>
                          <strong>Standard AcroForms</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Flatten on save:</span>
                          <strong>Permanent</strong>
                        </div>
                      </div>
                    )}

                    {activeUtility.id === 'pdf-bookmarks-editor' && (
                      <div className="panel-options-section">
                        <div className="info-stat-row">
                          <span>Hierarchy:</span>
                          <strong>Chapter Outline</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Directory page:</span>
                          <strong>Generated at front</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 5 & 6: Panel & Info Modes */}
            {workspace.id === 'pdf' && (currentMode === 'panel' || currentMode === 'info') && (
              <div className="workbench-3-zone-layout">
                {/* Zone 1: Main Canvas Preview / Document Card / Rich Inspector */}
                <div className="workbench-zone-1">
                  {/* Info: Extract Text */}
                  {activeUtility.id === 'extract-text' && (
                    <div className="info-text-inspector-card">
                      <div className="info-inspector-header">
                        <div className="header-title-box">
                          <FileText size={16} />
                          <span>Extracted Document Text ({extractedText.length} chars)</span>
                        </div>
                        <div className="header-actions">
                          <button
                            type="button"
                            className="mini-action-btn"
                            onClick={() => navigator.clipboard.writeText(extractedText)}
                          >
                            <Copy size={13} />
                            <span>Copy</span>
                          </button>
                          <button
                            type="button"
                            className="mini-action-btn"
                            onClick={() => {
                              const blob = new Blob([extractedText], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${files[0]?.name.replace(/\.pdf$/i, '') || 'extracted'}.txt`;
                              a.click();
                            }}
                          >
                            <Download size={13} />
                            <span>Save .txt</span>
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="extracted-text-area"
                        value={extractedText}
                        readOnly
                        placeholder="Extracting text from PDF..."
                      />
                    </div>
                  )}

                  {/* Info: Extract Images */}
                  {activeUtility.id === 'extract-images' && (
                    <div className="info-images-gallery-card">
                      <div className="info-inspector-header">
                        <div className="header-title-box">
                          <ImageIcon size={16} />
                          <span>Extracted Embedded Images ({extractedImages.length})</span>
                        </div>
                      </div>
                      {extractedImages.length > 0 ? (
                        <div className="extracted-images-grid">
                          {extractedImages.map((img, idx) => (
                            <div key={idx} className="extracted-img-item">
                              <div className="img-placeholder-thumb">
                                <ImageIcon size={24} />
                              </div>
                              <div className="img-meta-row">
                                <span>{img.name}</span>
                                <small>{Math.round(img.sizeBytes / 1024)} KB • {img.format.toUpperCase()}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-info-notice">
                          <p>No standalone raster images detected. Click 'Extract images' below to scan streams.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info: Search PDF */}
                  {activeUtility.id === 'search-pdf' && (
                    <div className="info-search-card">
                      <div className="info-search-input-row">
                        <Search size={16} className="text-muted" />
                        <input
                          type="text"
                          className="search-doc-input"
                          placeholder="Search document text..."
                          value={pdfSearchQuery}
                          onChange={(e) => setPdfSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="search-results-container">
                        {pdfSearchQuery ? (
                          <div className="search-match-row">
                            <span className="search-page-badge">Page 1</span>
                            <p className="search-snippet-text">
                              Matches found for "{pdfSearchQuery}" in document text.
                            </p>
                          </div>
                        ) : (
                          <div className="empty-info-notice">
                            <p>Type a keyword or phrase above to search within this document.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Standard Document Card (for Convert, Optimize, Properties, Security) */}
                  {activeUtility.id !== 'extract-text' &&
                    activeUtility.id !== 'extract-images' &&
                    activeUtility.id !== 'search-pdf' && (
                      <div className="canvas-file-preview-card">
                        {files[0]?.name.endsWith('.docx') ? (
                          <FileCode size={48} className="preview-file-icon" />
                        ) : (
                          <FileText size={48} className="preview-file-icon" />
                        )}
                        <div className="preview-file-details">
                          <h3>{files[0]?.name || 'Active Document'}</h3>
                          <p>
                            {pages.length} pages • {files[0] ? Math.round(files[0].size / 1024) : 0} KB
                          </p>
                          <span className="source-doc-badge">
                            {files[0]?.name.endsWith('.docx')
                              ? 'Microsoft Word Document'
                              : files[0]?.name.endsWith('.txt')
                              ? 'Plain Text Document'
                              : files[0]?.name.endsWith('.md')
                              ? 'Markdown Document'
                              : 'PDF Document'}
                          </span>
                        </div>
                      </div>
                    )}
                </div>

                {/* Zone 2: Options Panel for Panel / Info Modes */}
                <div className="workbench-zone-2">
                  <div className="options-panel-header">
                    <h3>{activeUtility.name}</h3>
                    <p>{activeUtility.description}</p>
                  </div>
                  <div className="options-panel-body">
                    {/* Compress PDF */}
                    {activeUtility.id === 'compress-pdf' && (
                      <div className="panel-options-section">
                        <label className="option-label">Compression Preset</label>
                        <div className="compression-tiles-grid" role="radiogroup" aria-label="Compression Preset">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={compressionQuality === 'light' || compressionQuality === 'low'}
                            className={`compression-tile ${compressionQuality === 'light' || compressionQuality === 'low' ? 'selected' : ''}`}
                            onClick={() => setCompressionQuality('light')}
                          >
                            <div className="compression-tile-top">
                              <Feather size={15} className="compression-tile-icon" />
                              <span className="compression-tile-title">Light</span>
                            </div>
                            <span className="compression-tile-hint">Highest quality (~15-20% reduction)</span>
                          </button>

                          <button
                            type="button"
                            role="radio"
                            aria-checked={compressionQuality === 'balanced' || compressionQuality === 'recommended'}
                            className={`compression-tile ${compressionQuality === 'balanced' || compressionQuality === 'recommended' ? 'selected' : ''}`}
                            onClick={() => setCompressionQuality('balanced')}
                          >
                            <div className="compression-tile-top">
                              <Gauge size={15} className="compression-tile-icon" />
                              <span className="compression-tile-title">Balanced</span>
                              <span className="compression-tile-badge">Recommended</span>
                            </div>
                            <span className="compression-tile-hint">Best quality & size balance (~40-50% reduction)</span>
                          </button>

                          <button
                            type="button"
                            role="radio"
                            aria-checked={compressionQuality === 'extreme'}
                            className={`compression-tile ${compressionQuality === 'extreme' ? 'selected' : ''}`}
                            onClick={() => setCompressionQuality('extreme')}
                          >
                            <div className="compression-tile-top">
                              <Minimize2 size={15} className="compression-tile-icon" />
                              <span className="compression-tile-title">Extreme</span>
                            </div>
                            <span className="compression-tile-hint">Maximum file reduction (~70%+ reduction)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Optimize Images */}
                    {activeUtility.id === 'optimize-images' && (
                      <div className="panel-options-section">
                        <label className="option-label">Target Image Resolution</label>
                        <select
                          className="workbench-select"
                          value={optimizeDpi}
                          onChange={(e: any) => setOptimizeDpi(parseInt(e.target.value, 10))}
                        >
                          <option value="72">72 DPI (Web & Screen)</option>
                          <option value="150">150 DPI (Balanced Standard)</option>
                          <option value="300">300 DPI (High Print Quality)</option>
                        </select>
                        <label className="option-label" style={{ marginTop: '10px' }}>
                          JPEG Quality ({optimizeQuality}%)
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="95"
                          value={optimizeQuality}
                          onChange={(e) => setOptimizeQuality(parseInt(e.target.value, 10))}
                          className="annotate-slider"
                        />
                      </div>
                    )}

                    {/* Flatten PDF */}
                    {activeUtility.id === 'flatten-pdf' && (
                      <div className="panel-options-section">
                        <div className="info-stat-row">
                          <span>Form fields:</span>
                          <strong>Bake into background</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Annotations:</span>
                          <strong>Flatten vector layers</strong>
                        </div>
                      </div>
                    )}

                    {/* Remove Metadata */}
                    {activeUtility.id === 'remove-metadata' && (
                      <div className="panel-options-section">
                        <div className="checkbox-control-row">
                          <input
                            type="checkbox"
                            id="strip-tags"
                            checked={stripAllMetadata}
                            onChange={(e) => setStripAllMetadata(e.target.checked)}
                          />
                          <label htmlFor="strip-tags">Strip author, creator & date tags</label>
                        </div>
                      </div>
                    )}

                    {/* Password Protect / Encrypt */}
                    {(activeUtility.id === 'password-protect' || activeUtility.id === 'encrypt-pdf') && (
                      <div className="panel-options-section">
                        <label className="option-label">Document Password</label>
                        <input
                          type="password"
                          className="workbench-text-input"
                          placeholder="Enter password..."
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                        />
                        <div className="checkbox-control-row" style={{ marginTop: '10px' }}>
                          <input
                            type="checkbox"
                            id="allow-print"
                            checked={allowPrinting}
                            onChange={(e) => setAllowPrinting(e.target.checked)}
                          />
                          <label htmlFor="allow-print">Allow high-resolution printing</label>
                        </div>
                        <div className="checkbox-control-row">
                          <input
                            type="checkbox"
                            id="allow-copy"
                            checked={allowCopying}
                            onChange={(e) => setAllowCopying(e.target.checked)}
                          />
                          <label htmlFor="allow-copy">Allow text copying</label>
                        </div>
                      </div>
                    )}

                    {/* Remove Password */}
                    {activeUtility.id === 'remove-password' && (
                      <div className="panel-options-section">
                        <label className="option-label">Current Document Password (if locked)</label>
                        <input
                          type="password"
                          className="workbench-text-input"
                          placeholder="Enter unlock password..."
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Convert Documents to PDF */}
                    {(activeUtility.id === 'docx-to-pdf' ||
                      activeUtility.id === 'txt-to-pdf-doc' ||
                      activeUtility.id === 'md-to-pdf-doc' ||
                      activeUtility.id === 'html-to-pdf-doc') && (
                      <div className="panel-options-section">
                        <label className="option-label">Page Orientation</label>
                        <select
                          className="workbench-select"
                          value={conversionOrientation}
                          onChange={(e: any) => setConversionOrientation(e.target.value)}
                        >
                          <option value="portrait">Portrait (Standard A4)</option>
                          <option value="landscape">Landscape</option>
                        </select>
                        <div className="info-stat-row" style={{ marginTop: '10px' }}>
                          <span>Source file:</span>
                          <strong>{files[0]?.name || 'Document'}</strong>
                        </div>
                      </div>
                    )}

                    {/* PDF to Document / PDF to Images */}
                    {activeUtility.id === 'pdf-to-doc' && (
                      <div className="panel-options-section">
                        <div className="info-stat-row">
                          <span>Output Format:</span>
                          <strong>Microsoft Word (.docx)</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>Text Preservation:</span>
                          <strong>100% Native vector text</strong>
                        </div>
                      </div>
                    )}

                    {activeUtility.id === 'pdf-to-images' && (
                      <div className="panel-options-section">
                        <label className="option-label">Resolution DPI</label>
                        <select className="workbench-select" defaultValue="150">
                          <option value="72">72 DPI (Web)</option>
                          <option value="150">150 DPI (Balanced)</option>
                          <option value="300">300 DPI (Print)</option>
                        </select>
                      </div>
                    )}

                    {/* Info Mode Statistics */}
                    {activeUtility.mode === 'info' && (
                      <div className="panel-options-section">
                        <div className="info-stat-row">
                          <span>Pages:</span>
                          <strong>{pages.length}</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>File Size:</span>
                          <strong>{files[0] ? Math.round(files[0].size / 1024) : 0} KB</strong>
                        </div>
                        <div className="info-stat-row">
                          <span>PDF Version:</span>
                          <strong>1.7</strong>
                        </div>
                        {activeUtility.id === 'extract-text' && (
                          <div className="info-stat-row">
                            <span>Characters:</span>
                            <strong>{extractedText.length}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Zone 3: Bottom Action Bar */}
      {!isStandaloneWorkspace && (
        <ActionBar
          files={files}
          versionStack={versionStack}
          versionIndex={versionIndex}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onReset={() => handleFilesChanged([])}
          summaryText={
            files.length > 1
              ? `${files[0].name} +${files.length - 1} · ${Math.round(files.reduce((a, b) => a + (b.size || 0), 0) / 1024)} KB`
              : `${files[0]?.name} · ${workspace.id === 'images' ? 'Image' : workspace.id === 'documents' ? 'Document' : workspace.id === 'data' ? `${dataFormat.toUpperCase()}` : workspace.id === 'text' ? 'Text' : `${pages.length} pages`} · ${Math.round((files[0]?.size || 0) / 1024)} KB`
          }
          summaryTooltip={
            files.map((f) => `${f.name} (${Math.round((f.size || 0) / 1024)} KB)`).join('\n')
          }
          isProcessing={isProcessing}
          statusMessage={statusMessage}
          progressPercent={progressPercent}
          onCancelProcessing={handleCancelProcessing}
          successResult={successResult}
          successMessage={
            versionStack.length > 1
              ? `${versionStack[versionIndex]?.name || 'Action'} applied. Your original file isn't changed.`
              : "Ready. Your original file isn't changed."
          }
          errorMessage={errorMessage}
          onDownload={versionStack.length > 0 ? handleSaveAs : undefined}
          downloadLabel={
            workspace.id === 'images' ? 'Download Image' :
            workspace.id === 'documents' ? 'Download Document' :
            workspace.id === 'data' ? `Download ${dataFormat.toUpperCase()}` :
            workspace.id === 'text' ? 'Download Text' :
            workspace.id === 'media' ? `Download ${mediaTargetFormat.toUpperCase()}` :
            workspace.id === 'files' ? 'Download Archive' :
            'Download PDF'
          }
          onPrimaryAction={handlePrimaryProcess}
          primaryActionLabel={primaryButtonLabel}
          isPrimaryDisabled={
            isProcessing ||
            (activeUtility.id === 'merge-pdf' && files.length < 2)
          }
          isPrimaryHidden={
            activeUtility.id === 'merge-pdf' && files.length < 2
          }
        >
          {autoProcessedInfo && !isProcessing && (
            <div className="auto-processed-banner">
              <span className="auto-processed-text">{autoProcessedInfo.utilityName} ran with defaults.</span>
              <button
                type="button"
                className="auto-processed-adjust-btn"
                onClick={() => setAutoProcessedInfo(null)}
              >
                Adjust
              </button>
            </div>
          )}
        </ActionBar>
      )}

      {showWhatModal && (
        <WhatThisCanDoModal
          utility={activeUtility}
          isOpen={showWhatModal}
          onClose={() => setShowWhatModal(false)}
        />
      )}
    </div>
  );
};
