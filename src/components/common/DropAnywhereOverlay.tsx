import React, { useState } from 'react';
import { Upload, ArrowRight, ShieldCheck, FileCheck } from 'lucide-react';
import { WorkspaceId } from '../../core/types/workspace';
import './DropAnywhereOverlay.css';

export interface DropTargetUtility {
  workspaceId: WorkspaceId;
  groupId: string;
  utilityId: string;
  name: string;
  description: string;
  isPrimary?: boolean;
}

interface DropAnywhereOverlayProps {
  fileName?: string;
  fileExt?: string;
  onDropAccepted: (target: DropTargetUtility, file: File) => void;
  onCancel: () => void;
}

export const DropAnywhereOverlay: React.FC<DropAnywhereOverlayProps> = ({
  fileName = 'file',
  fileExt = '',
  onDropAccepted,
  onCancel,
}) => {
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  const cleanExt = (fileExt || fileName.split('.').pop() || '').toLowerCase().replace(/^\./, '');

  const getMatchingUtilities = (ext: string): DropTargetUtility[] => {
    switch (ext) {
      case 'pdf':
        return [
          {
            workspaceId: 'pdf',
            groupId: 'pdf-optimizer',
            utilityId: 'compress-pdf',
            name: 'Compress PDF',
            description: 'Reduce PDF footprint for web and email.',
            isPrimary: true,
          },
          {
            workspaceId: 'pdf',
            groupId: 'page-organizer',
            utilityId: 'merge-pdf',
            name: 'Merge PDF',
            description: 'Combine multiple PDF files into one.',
          },
          {
            workspaceId: 'pdf',
            groupId: 'page-organizer',
            utilityId: 'split-pdf',
            name: 'Split PDF',
            description: 'Extract pages or split into documents.',
          },
          {
            workspaceId: 'pdf',
            groupId: 'pdf-converter',
            utilityId: 'pdf-to-images',
            name: 'PDF to Images',
            description: 'Export pages as PNG or JPG.',
          },
          {
            workspaceId: 'pdf',
            groupId: 'pdf-security',
            utilityId: 'pdf-redact',
            name: 'Redact PDF',
            description: 'Permanently black out confidential text.',
          },
        ];

      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
      case 'svg':
      case 'gif':
        return [
          {
            workspaceId: 'images',
            groupId: 'img-optimizer',
            utilityId: 'compress-image',
            name: 'Compress Image',
            description: 'Reduce image file size with lossless or web quality.',
            isPrimary: true,
          },
          {
            workspaceId: 'images',
            groupId: 'img-editor',
            utilityId: 'img-resize',
            name: 'Resize Image',
            description: 'Scale dimensions by pixels, preset, or ratio.',
          },
          {
            workspaceId: 'images',
            groupId: 'img-editor',
            utilityId: 'img-crop-image',
            name: 'Crop Image',
            description: 'Crop to exact aspect ratio or custom area.',
          },
          {
            workspaceId: 'pdf',
            groupId: 'pdf-converter',
            utilityId: 'images-to-pdf',
            name: 'Images → PDF',
            description: 'Combine multiple photos into a single PDF.',
          },
          {
            workspaceId: 'design',
            groupId: 'design-color',
            utilityId: 'design-image-palette-extractor',
            name: 'Palette Extractor',
            description: 'Extract dominant color swatches and mood palette.',
          },
        ];

      case 'csv':
      case 'tsv':
      case 'xlsx':
      case 'xls':
        return [
          {
            workspaceId: 'data',
            groupId: 'data-tabular',
            utilityId: 'csv-viewer',
            name: 'CSV Table Viewer',
            description: 'Inspect, filter, and sort tabular records.',
            isPrimary: true,
          },
          {
            workspaceId: 'data',
            groupId: 'data-tabular',
            utilityId: 'data-pivot-groupby',
            name: 'Pivot & GroupBy Engine',
            description: 'Aggregate rows by categorical groups.',
          },
          {
            workspaceId: 'data',
            groupId: 'data-tabular',
            utilityId: 'data-sql-csv',
            name: 'SQL Query on CSV',
            description: 'Execute SQL queries against offline dataset.',
          },
        ];

      case 'json':
        return [
          {
            workspaceId: 'developer',
            groupId: 'dev-formatter',
            utilityId: 'format-json-code',
            name: 'JSON Formatter',
            description: 'Format, indent, and validate JSON data.',
            isPrimary: true,
          },
          {
            workspaceId: 'data',
            groupId: 'data-compare',
            utilityId: 'data-json-diff',
            name: 'JSON Diff',
            description: 'Structural delta comparison between JSON documents.',
          },
        ];

      case 'zip':
      case 'tar':
      case 'gz':
      case '7z':
        return [
          {
            workspaceId: 'files',
            groupId: 'files-archives',
            utilityId: 'inspect-zip-archive',
            name: 'Inspect Archive',
            description: 'List archive contents and tree without unpacking.',
            isPrimary: true,
          },
          {
            workspaceId: 'files',
            groupId: 'files-archives',
            utilityId: 'extract-zip-archive',
            name: 'Extract Archive',
            description: 'Unpack files with path structure preserved.',
          },
        ];

      case 'mp4':
      case 'mov':
      case 'webm':
      case 'mp3':
      case 'wav':
        return [
          {
            workspaceId: 'media',
            groupId: 'media-video',
            utilityId: 'video-converter',
            name: 'Video Converter',
            description: 'Transcode between MP4, WebM, and MKV containers.',
            isPrimary: true,
          },
          {
            workspaceId: 'media',
            groupId: 'media-audio',
            utilityId: 'audio-converter',
            name: 'Audio Converter',
            description: 'Convert between MP3, WAV, AAC, and FLAC.',
          },
        ];

      case 'docx':
      case 'rtf':
      case 'md':
      case 'txt':
        return [
          {
            workspaceId: 'documents',
            groupId: 'doc-converter',
            utilityId: 'docx-to-pdf',
            name: 'DOCX / Markdown → PDF',
            description: 'Render formatted documents into clean PDF pages.',
            isPrimary: true,
          },
          {
            workspaceId: 'documents',
            groupId: 'doc-editor',
            utilityId: 'doc-markdown-editor',
            name: 'Markdown Editor',
            description: 'Live split-view editor with preview canvas.',
          },
        ];

      default:
        return [
          {
            workspaceId: 'files',
            groupId: 'files-operations',
            utilityId: 'file-type-detection',
            name: 'File Type Detection',
            description: 'Identify true MIME type and magic byte signature.',
            isPrimary: true,
          },
          {
            workspaceId: 'files',
            groupId: 'files-operations',
            utilityId: 'batch-rename-files',
            name: 'Batch Rename',
            description: 'Rename files with prefix, suffix, and counter.',
          },
          {
            workspaceId: 'files',
            groupId: 'files-analyzer',
            utilityId: 'file-analyzer-full',
            name: 'File Hash & Analyzer',
            description: 'Compute MD5, SHA-1, SHA-256 integrity checksums.',
          },
        ];
    }
  };

  const matchingUtilities = getMatchingUtilities(cleanExt);
  const primaryUtility = matchingUtilities.find((u) => u.isPrimary) || matchingUtilities[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, specificTarget?: DropTargetUtility) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const chosen = specificTarget || primaryUtility;
      onDropAccepted(chosen, file);
    }
  };

  return (
    <div
      className="drop-anywhere-overlay"
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e)}
      onClick={onCancel}
    >
      <div
        className="drop-anywhere-frame"
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
      >
        <div className="drop-anywhere-badge">
          <Upload size={13} />
          <span>Drop Anywhere Sniffer</span>
        </div>

        <h2 className="drop-anywhere-title">Drop your file to open in Toiloki</h2>
        <p className="drop-anywhere-subtitle">
          Detected: <strong style={{ color: 'var(--text)' }}>{fileName}</strong> ({cleanExt.toUpperCase() || 'FILE'}). Drop anywhere for recommended tool or select a specific utility:
        </p>

        <div className="drop-anywhere-target-grid">
          {matchingUtilities.map((util) => (
            <div
              key={`${util.workspaceId}-${util.utilityId}`}
              className={`drop-anywhere-card ${util.isPrimary ? 'primary' : ''} ${hoveredTargetId === util.utilityId ? 'drag-over' : ''}`}
              onDragEnter={() => setHoveredTargetId(util.utilityId)}
              onDragLeave={() => setHoveredTargetId(null)}
              onDrop={(e) => handleDrop(e, util)}
              onClick={(e) => {
                // Also support regular click if mock or fallback
                e.stopPropagation();
              }}
            >
              <div className="drop-anywhere-card-header">
                <span className="drop-anywhere-card-title">{util.name}</span>
                {util.isPrimary && (
                  <span className="drop-anywhere-card-badge">Default</span>
                )}
              </div>
              <span className="drop-anywhere-card-desc">{util.description}</span>
            </div>
          ))}
        </div>

        <div className="drop-anywhere-footer">
          <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
          <span>Files stay strictly on your local machine. 100% offline & private.</span>
        </div>
      </div>
    </div>
  );
};
