import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  File,
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  Archive as ArchiveIcon,
  Code as CodeIcon,
  X,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import './FileDropzone.css';

export interface SelectedFile {
  name: string;
  size: number;
  path?: string;
  buffer?: Uint8Array;
  file?: globalThis.File;
  status?: 'ready' | 'invalid' | 'warning';
  warningMessage?: string;
}

interface FileDropzoneProps {
  accept?: string[]; // e.g. ['.pdf'], ['.png', '.jpg', '.webp'], ['.csv', '.json', '.xlsx']
  multiple?: boolean;
  label?: string;
  sublabel?: string;
  files: SelectedFile[];
  onFilesChanged: (files: SelectedFile[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
  compact?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept,
  multiple = false,
  label,
  sublabel,
  files,
  onFilesChanged,
  maxFiles,
  maxSizeMb,
  compact = false,
}) => {
  const [dragState, setDragState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [unsupportedWarning, setUnsupportedWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileExtension = (name: string): string => {
    const parts = name.split('.');
    return parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : '';
  };

  const isFileAccepted = (name: string): boolean => {
    if (!accept || accept.length === 0) return true;
    const ext = getFileExtension(name);
    return accept.some((a) => a.toLowerCase() === ext.toLowerCase() || a === '*');
  };

  const getAcceptedFormatString = (): string => {
    if (!accept || accept.length === 0) return 'All file formats supported';
    const cleanExts = accept.map((a) => a.replace('.', '').toLowerCase());

    if (cleanExts.includes('pdf')) return 'PDF files';
    if (cleanExts.includes('png') || cleanExts.includes('jpg')) return 'PNG, JPG, WebP image files';
    if (cleanExts.includes('csv') || cleanExts.includes('xlsx')) return 'CSV, JSON, Excel data files';
    if (cleanExts.includes('zip') || cleanExts.includes('tar')) return 'ZIP, TAR, 7Z archive files';
    if (cleanExts.includes('docx') || cleanExts.includes('txt') || cleanExts.includes('md')) {
      return 'DOCX, Markdown, and text documents';
    }
    return `${cleanExts.map((e) => e.toUpperCase()).join(', ')} files`;
  };

  const getFileIcon = (name: string) => {
    const ext = getFileExtension(name);
    if (['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.svg'].includes(ext)) {
      return <ImageIcon size={18} strokeWidth={1.75} className="file-row-icon" />;
    }
    if (['.pdf'].includes(ext)) {
      return <FileText size={18} strokeWidth={1.75} className="file-row-icon" />;
    }
    if (['.csv', '.xlsx', '.xls', '.tsv'].includes(ext)) {
      return <TableIcon size={18} strokeWidth={1.75} className="file-row-icon" />;
    }
    if (['.zip', '.tar', '.gz', '.7z', '.rar'].includes(ext)) {
      return <ArchiveIcon size={18} strokeWidth={1.75} className="file-row-icon" />;
    }
    if (['.json', '.xml', '.yaml', '.yml', '.js', '.ts', '.html', '.css', '.sql'].includes(ext)) {
      return <CodeIcon size={18} strokeWidth={1.75} className="file-row-icon" />;
    }
    return <File size={18} strokeWidth={1.75} className="file-row-icon" />;
  };

  const validateAndConvert = async (fileList: FileList | SelectedFile[]): Promise<SelectedFile[]> => {
    const items: SelectedFile[] = [];
    let rejectedCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const item = fileList[i];
      let name = '';
      let size = 0;
      let buffer: Uint8Array | undefined;
      let path: string | undefined;
      let originalFile: globalThis.File | undefined;

      if ('name' in item && 'size' in item && !('arrayBuffer' in item)) {
        name = item.name;
        size = item.size;
        buffer = item.buffer;
        path = item.path;
        originalFile = item.file;
      } else {
        const f = item as globalThis.File;
        name = f.name;
        size = f.size;
        buffer = new Uint8Array(await f.arrayBuffer());
        originalFile = f;
      }

      if (!isFileAccepted(name)) {
        rejectedCount++;
        continue;
      }

      const sizeExceeded = maxSizeMb ? size > maxSizeMb * 1024 * 1024 : false;
      const status: 'ready' | 'warning' = sizeExceeded ? 'warning' : 'ready';
      const warningMessage = sizeExceeded ? `Exceeds ${maxSizeMb} MB limit` : undefined;

      items.push({
        name,
        size,
        path,
        buffer,
        file: originalFile,
        status,
        warningMessage,
      });

      if (!multiple) break;
    }

    if (rejectedCount > 0) {
      setUnsupportedWarning(`${rejectedCount} file(s) ignored: Unsupported file type.`);
      setTimeout(() => setUnsupportedWarning(null), 3000);
    }

    return items;
  };

  const handleNativeBrowse = async () => {
    if (window.toiloki?.dialog) {
      const filters = accept
        ? [{ name: 'Supported Files', extensions: accept.map((e) => e.replace(/^\./, '')) }]
        : [{ name: 'All Files', extensions: ['*'] }];

      const res = await window.toiloki.dialog.openFile({
        title: 'Select Files for Processing',
        filters,
        properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      });

      if (!res.canceled && res.filePaths.length > 0) {
        const loaded: SelectedFile[] = [];
        for (const p of res.filePaths) {
          const stats = await window.toiloki.fs.getStats(p);
          const bufRes = await window.toiloki.fs.readFileBuffer(p);
          loaded.push({
            name: stats.name || p.split(/[\\/]/).pop() || 'file',
            size: stats.size || 0,
            path: p,
            buffer: bufRes.data,
            status: 'ready',
          });
          if (!multiple) break;
        }

        const validItems = await validateAndConvert(loaded);
        if (multiple) {
          const combined = [...files, ...validItems];
          onFilesChanged(maxFiles ? combined.slice(0, maxFiles) : combined);
        } else {
          onFilesChanged(validItems.slice(0, 1));
        }
        return;
      }
    }

    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragState === 'idle') {
      setDragState('valid');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragState('idle');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validItems = await validateAndConvert(e.dataTransfer.files);
      if (multiple) {
        const combined = [...files, ...validItems];
        onFilesChanged(maxFiles ? combined.slice(0, maxFiles) : combined);
      } else {
        onFilesChanged(validItems.slice(0, 1));
      }
    }
  };

  const [exitingIdx, setExitingIdx] = useState<number | null>(null);

  const removeFile = (index: number) => {
    setExitingIdx(index);
    setTimeout(() => {
      const updated = files.filter((_, i) => i !== index);
      onFilesChanged(updated);
      setExitingIdx(null);
    }, 160);
  };

  const clearAllFiles = () => {
    onFilesChanged([]);
  };

  return (
    <div className={`file-dropzone-wrapper ${compact ? 'is-compact' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept?.join(',')}
        style={{ display: 'none' }}
        onChange={async (e) => {
          if (e.target.files) {
            const validItems = await validateAndConvert(e.target.files);
            if (multiple) {
              const combined = [...files, ...validItems];
              onFilesChanged(maxFiles ? combined.slice(0, maxFiles) : combined);
            } else {
              onFilesChanged(validItems.slice(0, 1));
            }
          }
        }}
      />

      {/* ─── TEMPLATE A: Empty State Dropzone (Min-height 320px, 1px dashed border, 16px radius) ─── */}
      {files.length === 0 ? (
        <div
          className={`empty-dropzone-box ${dragState !== 'idle' ? `drag-${dragState}` : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragState('idle')}
          onDrop={handleDrop}
          onClick={handleNativeBrowse}
          role="button"
          tabIndex={0}
        >
          {/* 32px Outline Upload Icon (moves up 4px on drag-over) */}
          <UploadCloud size={32} strokeWidth={1.75} className="empty-upload-icon" />

          {/* "Drag files here" / "Release to add files" crossfade */}
          <h3 className="empty-dropzone-title">
            {dragState === 'valid' ? 'Release to add files' : 'Drag files here'}
          </h3>

          {/* Primary Button "Choose files" */}
          <button
            type="button"
            className="toiloki-btn toiloki-btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              handleNativeBrowse();
            }}
          >
            Choose files
          </button>

          {/* One Muted Line of Accepted Formats in Inter */}
          <p className="empty-dropzone-formats">{getAcceptedFormatString()}</p>
        </div>
      ) : (
        /* ─── TEMPLATE A: Files List View ─── */
        <div className="file-list-view">
          <div className="file-list-header">
            <span className="file-list-count">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </span>
            <div className="file-list-actions">
              {multiple && (
                <button
                  type="button"
                  className="toiloki-btn toiloki-btn-ghost toiloki-btn-compact"
                  onClick={handleNativeBrowse}
                  title="Add more files"
                >
                  <Plus size={13} />
                  <span>Add files</span>
                </button>
              )}
              <button
                type="button"
                className="toiloki-btn toiloki-btn-ghost toiloki-btn-compact"
                onClick={clearAllFiles}
                title="Remove all files"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* List of Files (staggered 30ms enter, 160ms exit collapse) */}
          <div className="file-list-table">
            {files.map((file, idx) => (
              <div
                key={file.name + idx}
                className={`file-list-row ${exitingIdx === idx ? 'is-exiting' : ''}`}
                style={{
                  animation: 'fileRowEnter var(--dur-base) var(--ease-out) forwards',
                  animationDelay: `${Math.min(idx, 7) * 30}ms`,
                }}
              >
                <div className="file-row-left">
                  {getFileIcon(file.name)}
                  <span className="file-row-name" title={file.name}>
                    {file.name}
                  </span>
                </div>

                <div className="file-row-right">
                  <span className="file-row-size">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    className="file-row-remove-btn"
                    onClick={() => removeFile(idx)}
                    title={`Remove ${file.name}`}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unsupportedWarning && (
        <div className="unsupported-warning-banner" role="alert">
          <AlertTriangle size={14} />
          <span>{unsupportedWarning}</span>
        </div>
      )}
    </div>
  );
};
