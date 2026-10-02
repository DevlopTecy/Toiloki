import React from 'react';
import { Dialog } from './Dialog';
import { AlertCircle, FileX, RefreshCw, FolderOpen, ArrowRight } from 'lucide-react';

interface ConflictDialogProps {
  isOpen: boolean;
  fileName: string;
  onReplace: () => void;
  onCreateNewName: () => void;
  onChooseLocation: () => void;
  onCancel: () => void;
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({
  isOpen,
  fileName,
  onReplace,
  onCreateNewName,
  onChooseLocation,
  onCancel,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title="File Already Exists"
      icon={<AlertCircle size={18} color="var(--color-warning)" />}
      width="440px"
      footer={
        <button className="tool-btn secondary" onClick={onCancel} type="button">
          Cancel
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          A file named <strong style={{ color: 'var(--text-primary)' }}>"{fileName}"</strong> already
          exists in the destination directory. How would you like to proceed?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <button
            className="tool-btn secondary"
            style={{ justifyContent: 'flex-start', padding: '10px 12px', gap: '10px', width: '100%' }}
            onClick={onReplace}
            type="button"
          >
            <FileX size={15} color="var(--color-danger)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Replace Existing File</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overwrite the file with new output</div>
            </div>
          </button>

          <button
            className="tool-btn secondary"
            style={{ justifyContent: 'flex-start', padding: '10px 12px', gap: '10px', width: '100%' }}
            onClick={onCreateNewName}
            type="button"
          >
            <RefreshCw size={15} color="var(--accent-blue)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Create New Name</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-append sequential number (e.g. file (1).ext)</div>
            </div>
          </button>

          <button
            className="tool-btn secondary"
            style={{ justifyContent: 'flex-start', padding: '10px 12px', gap: '10px', width: '100%' }}
            onClick={onChooseLocation}
            type="button"
          >
            <FolderOpen size={15} color="var(--text-secondary)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Choose Another Location</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Browse to select a different save folder</div>
            </div>
          </button>
        </div>
      </div>
    </Dialog>
  );
};
