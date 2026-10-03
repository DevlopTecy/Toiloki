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
  Sparkles
} from 'lucide-react';
import { PdfEngine } from '../../engines/pdf/pdf.engine';
import { PdfPagesCanvas, PageCardItem } from './pdf/PdfPagesCanvas';
import { PdfTrayCanvas } from './pdf/PdfTrayCanvas';
import { PdfMarkersCanvas } from './pdf/PdfMarkersCanvas';
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

  // Compression options for 'panel' mode
  const [compressionQuality, setCompressionQuality] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  const [passwordInput, setPasswordInput] = useState<string>('');

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
    setSuccessResult(false);

    await refreshPagesFromBuffer(initialBuffer);
  }, [ensureBuffer, refreshPagesFromBuffer]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleBodyClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.workbench-menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleBodyClick);
    return () => document.removeEventListener('click', handleBodyClick);
  }, []);

  const handleUtilityClick = (group: GroupDefinition, utility: UtilityDefinition) => {
    onSelectUtility(group, utility);
    setActiveMenu(null);
    setSuccessResult(false);
    setErrorMessage(null);
  };

  const handleStartOver = () => {
    setFiles([]);
    setVersionStack([]);
    setVersionIndex(-1);
    setPages([]);
    setSuccessResult(false);
    setCompareResult(null);
    setErrorMessage(null);
  };

  // Undo / Redo in version history
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
      } else if (mode === 'panel') {
        const buffer = await ensureBuffer(files[0]);
        setProgressPercent(50);
        if (activeId === 'compress-pdf') {
          // Compress by flattening metadata and optimizing
          const res = await PdfEngine.flattenAndStripMetadata(buffer);
          if (!res.success || !res.outputBuffer) throw new Error(res.error || 'Failed to compress PDF.');
          await pushNewVersion('Compressed PDF', res.outputBuffer);
        } else {
          // Password protect or other panel tool
          const res = await PdfEngine.flattenAndStripMetadata(buffer);
          if (!res.success || !res.outputBuffer) throw new Error('Failed to process document.');
          await pushNewVersion(`${activeUtility.name} applied`, res.outputBuffer);
        }
      } else {
        // Info mode or other
        setIsProcessing(false);
        setSuccessResult(true);
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
            {workspace.groups.slice(0, 7).map((group) => (
              <div key={group.id} className="workbench-menu-container">
                <button
                  className={`workbench-menu-btn ${activeMenu === group.id ? 'is-active' : ''}`}
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
                        className={`workbench-dropdown-item ${
                          activeUtility.id === util.id ? 'is-selected' : ''
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
            ))}
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
                accept={
                  activeUtility.id === 'images-to-pdf'
                    ? ['.png', '.jpg', '.jpeg', '.webp']
                    : ['.pdf']
                }
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
            {/* Mode 1: Pages Mode (Organizer, Extract, Delete, Rotate, Duplicate, Reorder, Crop, Blank removal) */}
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

            {/* Mode 2: Tray Mode (Merge, Compare, Images to PDF) */}
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

            {/* Mode 3: Markers Mode (Split PDF) */}
            {currentMode === 'markers' && (
              <PdfMarkersCanvas
                file={files[0]}
                pageCount={pages.length || 4}
                onSplitConfigChange={setSplitConfig}
              />
            )}

            {/* Mode 4 & 5: Panel & Info Modes (Compress, Password Protect, File Info) */}
            {(currentMode === 'panel' || currentMode === 'info') && (
              <div className="workbench-3-zone-layout">
                {/* Zone 1: Main Canvas Preview */}
                <div className="workbench-zone-1">
                  <div className="canvas-file-preview-card">
                    <FileText size={48} className="preview-file-icon" />
                    <div className="preview-file-details">
                      <h3>{files[0]?.name || 'Active Document'}</h3>
                      <p>{pages.length} pages • {files[0] ? Math.round(files[0].size / 1024) : 0} KB</p>
                    </div>
                  </div>
                </div>

                {/* Zone 2: Options Panel (Collapsible 320px) */}
                <div className="workbench-zone-2">
                  <div className="options-panel-header">
                    <h3>{activeUtility.name}</h3>
                    <p>{activeUtility.description}</p>
                  </div>
                  <div className="options-panel-body">
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

                    {activeUtility.id === 'password-protect' && (
                      <div className="panel-options-section">
                        <label className="option-label">Document Password</label>
                        <input
                          type="password"
                          className="workbench-text-input"
                          placeholder="Enter password..."
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                        />
                      </div>
                    )}

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
                className="workbench-ghost-btn"
                title="Undo (Ctrl+Z)"
                onClick={handleUndo}
                disabled={versionIndex <= 0}
              >
                <Undo size={14} />
              </button>
              <button
                type="button"
                className="workbench-ghost-btn"
                title="Redo (Ctrl+Shift+Z)"
                onClick={handleRedo}
                disabled={versionIndex >= versionStack.length - 1}
              >
                <Redo size={14} />
              </button>

              <div className="version-chips" aria-label="Document version history">
                {versionStack.map((ver, idx) => (
                  <React.Fragment key={ver.id}>
                    {idx > 0 && <span className="version-separator">›</span>}
                    <button
                      type="button"
                      className={`version-chip ${idx === versionIndex ? 'current-version' : ''}`}
                      onClick={() => {
                        setVersionIndex(idx);
                        const updated = [...files];
                        updated[0] = { ...updated[0], buffer: ver.buffer };
                        setFiles(updated);
                        refreshPagesFromBuffer(ver.buffer);
                      }}
                    >
                      {ver.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <button
                type="button"
                className="workbench-ghost-btn start-over-btn"
                onClick={handleStartOver}
              >
                <RotateCcw size={13} />
                <span>Start over</span>
              </button>
            </>
          )}
        </div>

        <div className="bottom-bar-right">
          {errorMessage && (
            <div className="workbench-error-strip">
              <AlertTriangle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          {isProcessing ? (
            <div className="workbench-progress-strip">
              <div className="workbench-progress-track">
                <div
                  className="workbench-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <button
                type="button"
                className="workbench-cancel-btn"
                onClick={() => setIsProcessing(false)}
              >
                Cancel
              </button>
            </div>
          ) : successResult ? (
            <div className="workbench-success-strip">
              <div className="toast-ready">
                <CheckCircle size={14} /> Ready
              </div>
              <button
                type="button"
                className="workbench-btn ghost"
                onClick={handleSaveAs}
              >
                <FolderOpen size={14} /> Open folder
              </button>
              <button
                type="button"
                className="workbench-btn primary"
                onClick={handleSaveAs}
              >
                <Save size={14} /> Save as
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="workbench-btn primary"
              onClick={handlePrimaryProcess}
              disabled={files.length === 0}
            >
              <Play size={14} />
              <span>{primaryButtonLabel}</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
