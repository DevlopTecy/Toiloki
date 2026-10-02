import React, { useState } from 'react';
import {
  AlertCircle,
  RefreshCw,
  FolderOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Copy,
  Check,
  HelpCircle,
  FileQuestion,
  Lock,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';
import './ErrorPanel.css';

export type ErrorCategory =
  | 'invalid_file'
  | 'unsupported_format'
  | 'permission_denied'
  | 'file_locked'
  | 'processing_failed'
  | 'output_conflict'
  | 'insufficient_storage'
  | 'unexpected_error';

interface ErrorPanelProps {
  category?: ErrorCategory;
  title?: string;
  whatHappened?: string;
  whyHappened?: string;
  suggestedAction?: string;
  message?: string; // backwards compatibility
  technicalDetails?: string;
  onRetry?: () => void;
  onChooseAnother?: () => void;
  onChangeLocation?: () => void;
  onBack?: () => void;
}

const CATEGORY_DEFAULTS: Record<
  ErrorCategory,
  {
    title: string;
    what: string;
    why: string;
    action: string;
    icon: React.ReactNode;
  }
> = {
  invalid_file: {
    title: 'Invalid File',
    what: 'The selected file could not be parsed or is corrupted.',
    why: 'The file header or internal structure does not match the expected specification.',
    action: 'Select an undamaged, valid source file.',
    icon: <FileQuestion size={18} />,
  },
  unsupported_format: {
    title: 'Unsupported Format',
    what: 'The file format or codec is not recognized by this tool.',
    why: 'The file extension or MIME container is not in the supported format matrix.',
    action: 'Convert the file to a supported format first or check supported extensions.',
    icon: <AlertTriangle size={18} />,
  },
  permission_denied: {
    title: 'Permission Denied',
    what: 'Toiloki cannot read or write to the target file path.',
    why: 'Operating system permissions restrict access to this file or folder.',
    action: 'Choose an accessible destination (e.g. Documents, Downloads) or check file permissions.',
    icon: <Lock size={18} />,
  },
  file_locked: {
    title: 'File Locked',
    what: 'The file is currently locked by another running program.',
    why: 'Another application (e.g. Adobe Acrobat, Excel) has an exclusive handle on this file.',
    action: 'Close any application currently using this file and retry.',
    icon: <Lock size={18} />,
  },
  processing_failed: {
    title: 'Processing Failed',
    what: 'An error occurred during local file transformation.',
    why: 'Memory allocation limits or an unexpected byte sequence interrupted execution.',
    action: 'Try with a smaller batch size or retry the operation.',
    icon: <AlertCircle size={18} />,
  },
  output_conflict: {
    title: 'Output Conflict',
    what: 'A file with the target name already exists at the output location.',
    why: 'Overwrite protection is enabled and an existing file shares the target filename.',
    action: 'Change the output filename or choose another save directory.',
    icon: <AlertTriangle size={18} />,
  },
  insufficient_storage: {
    title: 'Insufficient Storage',
    what: 'Not enough free disk space to complete the write operation.',
    why: 'The target drive or volume is running critically low on available storage.',
    action: 'Free up disk space on the target drive or select another drive volume.',
    icon: <HardDrive size={18} />,
  },
  unexpected_error: {
    title: 'Unexpected Error',
    what: 'An unforeseen error interrupted the operation.',
    why: 'Internal local engine caught an unhandled exception.',
    action: 'Retry the operation or restart the utility if problem persists.',
    icon: <HelpCircle size={18} />,
  },
};

export const ErrorPanel: React.FC<ErrorPanelProps> = ({
  category = 'unexpected_error',
  title,
  whatHappened,
  whyHappened,
  suggestedAction,
  message,
  technicalDetails,
  onRetry,
  onChooseAnother,
  onChangeLocation,
  onBack,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedTech, setCopiedTech] = useState(false);

  const defaults = CATEGORY_DEFAULTS[category] || CATEGORY_DEFAULTS.unexpected_error;

  const resolvedTitle = title || defaults.title;
  const resolvedWhat = whatHappened || message || defaults.what;
  const resolvedWhy = whyHappened || defaults.why;
  const resolvedAction = suggestedAction || defaults.action;

  const handleCopyTech = async () => {
    if (technicalDetails) {
      await navigator.clipboard.writeText(technicalDetails);
      setCopiedTech(true);
      setTimeout(() => setCopiedTech(false), 2000);
    }
  };

  return (
    <div className="error-panel-card" role="alert">
      <div className="error-panel-header">
        <div className="error-icon-box">{defaults.icon}</div>
        <div className="error-panel-titles">
          <div className="error-badge-row">
            <span className="error-category-badge">{resolvedTitle}</span>
          </div>
          <h4 className="error-title">{resolvedWhat}</h4>
        </div>
      </div>

      {/* Structured What / Why / Action */}
      <div className="error-structured-body">
        <div className="error-field">
          <span className="error-field-label">Why it may have happened:</span>
          <span className="error-field-value">{resolvedWhy}</span>
        </div>
        <div className="error-field">
          <span className="error-field-label">Suggested action:</span>
          <span className="error-field-value highlight">{resolvedAction}</span>
        </div>
      </div>

      {/* Optional Technical Details (Collapsed by default) */}
      {technicalDetails && (
        <div className="error-details-section">
          <button
            className="error-details-toggle"
            onClick={() => setShowDetails(!showDetails)}
            type="button"
            aria-expanded={showDetails}
          >
            <span>Technical details</span>
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showDetails && (
            <div className="error-tech-container">
              <pre className="error-tech-block">{technicalDetails}</pre>
              <button
                className="error-copy-btn"
                onClick={handleCopyTech}
                title="Copy technical details"
                type="button"
              >
                {copiedTech ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedTech ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Controls */}
      <div className="error-panel-actions">
        {onRetry && (
          <button className="tool-btn primary" onClick={onRetry} type="button">
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        )}
        {onChooseAnother && (
          <button className="tool-btn secondary" onClick={onChooseAnother} type="button">
            <FolderOpen size={13} />
            <span>Choose Another File</span>
          </button>
        )}
        {onChangeLocation && (
          <button className="tool-btn secondary" onClick={onChangeLocation} type="button">
            <MapPin size={13} />
            <span>Change Output Location</span>
          </button>
        )}
        {onBack && (
          <button className="tool-btn secondary" onClick={onBack} type="button">
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
        )}
      </div>
    </div>
  );
};
