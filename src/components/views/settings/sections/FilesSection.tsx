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

      {/* ─── 4. OUTPUT NAMING TEMPLATE ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Output naming template</label>
          <span className="settings-helper">
            Tokens: <code style={{ fontFamily: 'var(--font-mono)' }}>&#123;name&#125;</code>,{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>&#123;tool&#125;</code>,{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>&#123;date&#125;</code>,{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>&#123;time&#125;</code>,{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>&#123;counter&#125;</code>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '340px' }}>
          <input
            type="text"
            className="settings-input"
            value={settings.namingTemplate || '{name}_{tool}_{date}'}
            onChange={(e) => onUpdateSettings({ namingTemplate: e.target.value })}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Preview:{' '}
            <code style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
              {settings.namingTemplate
                ? settings.namingTemplate
                    .replace('{name}', 'document')
                    .replace('{tool}', 'compress-pdf')
                    .replace('{date}', new Date().toISOString().slice(0, 10))
                    .replace('{time}', '14-30-00')
                    .replace('{counter}', '1') + '.pdf'
                : 'document_compress-pdf_2026-10-03.pdf'}
            </code>
          </span>
        </div>
      </div>

      {/* ─── 5. FILE ASSOCIATIONS ("OPEN WITH TOILOKI") ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">"Open with Toiloki" File Associations</label>
          <span className="settings-helper">
            Handle system file opens for PDF, images, CSV, JSON, and archives directly into matching local utilities.
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings.fileAssociationsEnabled ?? true}
              onChange={(e) => onUpdateSettings({ fileAssociationsEnabled: e.target.checked })}
            />
            <span className="settings-switch-label">
              {settings.fileAssociationsEnabled ? 'Associations Enabled' : 'Disabled'}
            </span>
          </label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '340px' }}>
            {['.pdf', '.png', '.jpg', '.webp', '.svg', '.csv', '.json', '.zip', '.md'].map((ext) => (
              <span
                key={ext}
                style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  padding: '1px 5px',
                  color: 'var(--text-secondary)',
                }}
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

