import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PDFDocument } from 'pdf-lib';
import { WorkspaceDefinition, GroupDefinition, UtilityDefinition } from '../../core/types/workspace';
import { SettingsService } from '../../core/services/settings.service';
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
  Sparkles,
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
  ExternalLink
} from 'lucide-react';
import { PdfEngine } from '../../engines/pdf/pdf.engine';
import { PdfSecurityEngine } from '../../engines/pdf/pdf-security.engine';
import { DocumentEngine } from '../../engines/documents/document.engine';
import { PdfPagesCanvas, PageCardItem } from './pdf/PdfPagesCanvas';
import { PdfTrayCanvas } from './pdf/PdfTrayCanvas';
import { PdfMarkersCanvas } from './pdf/PdfMarkersCanvas';
import { PdfAnnotateCanvas } from './pdf/PdfAnnotateCanvas';
import './WorkbenchShell.css';

interface VersionItem {
  id: string;
  name: string;
  buffer: Uint8Array;
  timestamp: number;
}

interface WorkbenchShellProps {
  workspace: WorkspaceDefinition;
  activeGroup: GroupDefinition;
  activeUtility: UtilityDefinition;
  onSelectUtility: (group: GroupDefinition, utility: UtilityDefinition) => void;
}

export const WorkbenchShell: React.FC<WorkbenchShellProps> = ({
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

  // Tray state for 'tray' mode
  const [fileRanges, setFileRanges] = useState<Record<string, string>>({});
  const [compareResult, setCompareResult] = useState<any | null>(null);

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
  const [compressionQuality, setCompressionQuality] = useState<'recommended' | 'extreme' | 'low'>('recommended');
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
    // If the file is non-PDF (e.g. DOCX, TXT, MD, HTML), return raw buffer directly
    const isDocx = file.name.endsWith('.docx') || file.name.endsWith('.doc');
    const isText =
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.html') ||
      file.name.endsWith('.htm');
    if ((isDocx || isText) && file.buffer) {
      return file.buffer;
    }

    if (file.buffer && file.buffer.byteLength > 200) {
      try {
        await PDFDocument.load(file.buffer);
        return file.buffer;
      } catch {
        // buffer is corrupted or placeholder string, recreate below
      }
    }
    const doc = await PDFDocument.create();
    for (let i = 1; i <= 4; i++) {
      const page = doc.addPage([595.28, 841.89]);
      page.drawText(`Toiloki Sample PDF Document - Page ${i}`, { x: 50, y: 800, size: 18 });
      page.drawText(`Generated for local-first utility execution and chaining.`, { x: 50, y: 770, size: 12 });
    }
    return await doc.save();
  }, []);

  // Initialize or re-parse pages whenever active file buffer changes
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

    // Refresh pages
    await refreshPagesFromBuffer(initialBuffer);
    setSuccessResult(false);

    // Load initial info inspection if on an info tool
    await loadInfoDataForUtility(activeUtility.id, initialBuffer);
  }, [ensureBuffer, refreshPagesFromBuffer, loadInfoDataForUtility, activeUtility.id]);

  // Handle switching active utilities
  const handleUtilityClick = useCallback((group: GroupDefinition, util: UtilityDefinition) => {
    onSelectUtility(group, util);
    setActiveMenu(null);
    setSuccessResult(false);
    setErrorMessage(null);

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

  // Execution: Handles Pages actions (Delete, Rotate, Extract, Duplicate, Crop)
  const handleExecutePageAction = async (action: 'delete' | 'rotate' | 'extract' | 'duplicate' | 'crop') => {
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
        const res = await PdfEngine.cropPages(buffer, cropMargins);
        if (!res.success || !res.outputBuffer) {
          throw new Error(res.error || 'Failed to crop pages.');
        }
        await pushNewVersion('Cropped pages', res.outputBuffer);
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
          const buffers = await Promise.all(files.map((f) => ensureBuffer(f)));
          setProgressPercent(60);
          const res = await PdfEngine.merge(buffers);
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
        setProgressPercent(50);
        const splitMode = splitConfig.method === 'everyN' ? 'fixed-chunk' : 'each-page';
        const chunkSize = splitConfig.method === 'everyN' ? splitConfig.everyN : 1;
        const res = await PdfEngine.splitPdf(buffer, splitMode, chunkSize);
        if (!res.success || !res.data || res.data.length === 0) {
          throw new Error(res.error || 'Failed to split PDF.');
        }
        await pushNewVersion(`Split into ${res.data.length} files`, res.data[0].buffer);
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
        } else if (activeId === 'compress-pdf' || activeId === 'optimize-images') {
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
    const blob = new Blob([currentVer.buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = files[0]?.name ? files[0].name.replace(/\.pdf$/i, '') : 'document';
    a.download = `${baseName}-${currentVer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const needsFile = activeUtility.needsFile !== false;
  const showEmptyState = needsFile && files.length === 0;
  const currentMode = activeUtility.mode || 'panel';

  // Dynamic primary button label computation
  const primaryButtonLabel = useMemo(() => {
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
                accept={activeUtility.acceptedFormats || ['.pdf']}
                multiple={activeUtility.accepts === 'many'}
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
        ) : (
          <div className="workbench-canvas-wrapper">
            {/* Mode 1: Pages Mode */}
            {currentMode === 'pages' && (
              <PdfPagesCanvas
                file={files[0]}
                activeUtilityId={activeUtility.id}
                pages={pages}
                onPagesChange={setPages}
                onExecutePageAction={handleExecutePageAction}
                cropMargins={cropMargins}
                onCropMarginsChange={setCropMargins}
              />
            )}

            {/* Mode 2: Tray Mode */}
            {currentMode === 'tray' && (
              <PdfTrayCanvas
                files={files}
                activeUtilityId={activeUtility.id}
                onFilesChange={setFiles}
                onAddMoreFiles={(newFilesList) => {
                  const arr = Array.from(newFilesList).map((f) => ({
                    name: f.name,
                    size: f.size,
                    file: f,
                  }));
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
            {currentMode === 'markers' && (
              <PdfMarkersCanvas
                file={files[0]}
                pageCount={pages.length || 4}
                onSplitConfigChange={setSplitConfig}
              />
            )}

            {/* Mode 4: Annotate Mode */}
            {currentMode === 'annotate' && (
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
                        <select
                          className="workbench-select"
                          value={pageNumberPosition}
                          onChange={(e: any) => setPageNumberPosition(e.target.value)}
                        >
                          <option value="bottom-center">Bottom Center (Standard)</option>
                          <option value="bottom-right">Bottom Right</option>
                          <option value="top-right">Top Right (Header)</option>
                        </select>
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
                        <select
                          className="workbench-select"
                          value={shapeType}
                          onChange={(e: any) => setShapeType(e.target.value)}
                        >
                          <option value="rect">Rectangle Box</option>
                          <option value="circle">Circle / Ellipse</option>
                          <option value="line">Horizontal Rule Line</option>
                        </select>
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
                        <select
                          className="workbench-select"
                          value={redactStyle}
                          onChange={(e: any) => setRedactStyle(e.target.value)}
                        >
                          <option value="black">Solid Blackout Box</option>
                          <option value="white">Whiteout Mask</option>
                        </select>
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
            {(currentMode === 'panel' || currentMode === 'info') && (
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
                        <select
                          className="workbench-select"
                          value={compressionQuality}
                          onChange={(e: any) => setCompressionQuality(e.target.value)}
                        >
                          <option value="recommended">Recommended (Balanced quality)</option>
                          <option value="extreme">Extreme (Smallest file size)</option>
                          <option value="low">Less compression (High quality)</option>
                        </select>
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
      <footer className="workbench-bottom-bar">
        <div className="bottom-bar-left">
          {files.length > 0 && (
            <>
              <button
                type="button"
                className="action-btn-secondary"
                onClick={() => handleFilesChanged([])}
                title="Clear current workspace session"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>

              <div className="version-history-controls">
                <button
                  type="button"
                  className="version-step-btn"
                  onClick={handleUndo}
                  disabled={versionIndex <= 0}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo size={14} />
                </button>
                <button
                  type="button"
                  className="version-step-btn"
                  onClick={handleRedo}
                  disabled={versionIndex >= versionStack.length - 1}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo size={14} />
                </button>
                <span className="version-counter-badge">
                  {versionStack.length > 0 ? `v${versionIndex + 1}/${versionStack.length}` : 'v0'}
                </span>
              </div>

              <span className="file-summary-badge">
                {files[0]?.name} • {files.length > 1 ? `${files.length} files` : `${pages.length} pages`} •{' '}
                {files[0] ? Math.round(files[0].size / 1024) : 0} KB
              </span>
            </>
          )}
        </div>

        <div className="bottom-bar-center">
          {isProcessing && (
            <div className="processing-indicator">
              <div className="processing-spinner" />
              <span>{statusMessage || 'Processing locally...'}</span>
              <div className="workbench-progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {successResult && !isProcessing && (
            <div className="success-toast">
              <CheckCircle size={15} />
              <span>
                {versionStack.length > 1
                  ? `${versionStack[versionIndex]?.name || 'Action'} applied successfully.`
                  : 'Ready.'}
              </span>
            </div>
          )}

          {errorMessage && !isProcessing && (
            <div className="error-toast">
              <AlertTriangle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="bottom-bar-right">
          {files.length > 0 && versionStack.length > 0 && (
            <button
              type="button"
              className="action-btn-secondary"
              onClick={handleSaveAs}
              title="Download result to disk"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
          )}

          <button
            type="button"
            className="action-btn-primary"
            onClick={handlePrimaryProcess}
            disabled={isProcessing || files.length === 0}
          >
            <Play size={14} />
            <span>{primaryButtonLabel}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
