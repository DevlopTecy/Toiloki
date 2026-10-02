import React from 'react';
import { FolderOpen, RotateCcw } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '../../../../core/services/settings.service';
import { Button } from '../../../common/Button';

interface FilesSectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const FilesSection: React.FC<FilesSectionProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const handleBrowse = async () => {
    const toiloki = (window as any).toiloki;
    if (toiloki?.dialog?.openFile) {
      try {
        const res = await toiloki.dialog.openFile({
          title: 'Select Export Directory',
          properties: ['openDirectory', 'createDirectory'],
        });
        if (!res.canceled && res.filePaths?.[0]) {
          onUpdateSettings({ outputDir: res.filePaths[0] });
        }
        return;
      } catch (err) {
        console.error('Electron folder dialog error:', err);
      }
    }

    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle?.name) {
          onUpdateSettings({ outputDir: `/${dirHandle.name}` });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Directory picker error:', err);
      }
    }
  };


  const handleReset = () => {
    onUpdateSettings({
      outputDir: DEFAULT_SETTINGS.outputDir,
      conflictBehavior: DEFAULT_SETTINGS.conflictBehavior,
      preserveTimestamps: DEFAULT_SETTINGS.preserveTimestamps,
    });
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Files & Storage</h2>
          <p className="settings-section-desc">
            Manage local export directories, naming collision policies, and file metadata preservation.
          </p>
        </div>
        <button
          type="button"
          className="settings-ghost-reset-btn"
          onClick={handleReset}
          title="Reset files section"
        >
          <RotateCcw size={13} />
          <span>Reset section</span>
        </button>
      </div>

      {/* ─── 1. DEFAULT OUTPUT FOLDER ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Default export directory</label>
          <span className="settings-helper">Target folder where converted and processed files are saved.</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', minWidth: '340px' }}>
          <input
            type="text"
            className="settings-input"
            value={settings.outputDir}
            onChange={(e) => onUpdateSettings({ outputDir: e.target.value })}
            style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
          />
          <Button variant="secondary" size="sm" onClick={handleBrowse}>
            <FolderOpen size={13} style={{ marginRight: '5px' }} />
            Browse...
          </Button>
        </div>
      </div>

      {/* ─── 2. NAMING CONFLICT BEHAVIOR ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">File collision behavior</label>
          <span className="settings-helper">Action to take when an output file with identical name already exists.</span>
        </div>
        <select
          className="settings-select"
          value={settings.conflictBehavior}
          onChange={(e) => onUpdateSettings({ conflictBehavior: e.target.value as any })}
        >
          <option value="auto-rename">Auto-rename (e.g. document (1).pdf)</option>
          <option value="overwrite">Overwrite existing file</option>
          <option value="prompt">Prompt for user confirmation</option>
        </select>
      </div>

      {/* ─── 3. PRESERVE TIMESTAMPS ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Preserve modification timestamps</label>
          <span className="settings-helper">Retain original creation and modified dates on converted files.</span>
        </div>
        <label className="settings-switch">
          <input
            type="checkbox"
            checked={settings.preserveTimestamps}
            onChange={(e) => onUpdateSettings({ preserveTimestamps: e.target.checked })}
          />
          <span className="settings-switch-label">
            {settings.preserveTimestamps ? 'Preserve dates' : 'Update to current time'}
          </span>
        </label>
      </div>
    </div>
  );
};
