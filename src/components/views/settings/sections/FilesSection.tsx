import React, { useState } from 'react';
import { FolderOpen, RotateCcw, Trash2, Check } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '../../../../core/services/settings.service';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { Button } from '../../../common/Button';

interface FilesSectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const FilesSection: React.FC<FilesSectionProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [cacheCleared, setCacheCleared] = useState(false);

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

  const handleClearCache = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('toiloki_temp_') || k.startsWith('toiloki_cache_'))) {
          localStorage.removeItem(k);
        }
      }
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const handleReset = () => {
    onUpdateSettings({
      outputDir: DEFAULT_SETTINGS.outputDir,
      namingTemplate: DEFAULT_SETTINGS.namingTemplate,
      conflictBehavior: DEFAULT_SETTINGS.conflictBehavior,
      preserveTimestamps: DEFAULT_SETTINGS.preserveTimestamps,
      fileAssociationsEnabled: DEFAULT_SETTINGS.fileAssociationsEnabled,
      tempCleanupPolicy: DEFAULT_SETTINGS.tempCleanupPolicy,
    });
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Files & Output</h2>
          <p className="settings-section-desc">
            Manage local export directories, naming templates, collision policies, and disk cache.
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

      {/* ─── 1. DEFAULT EXPORT DIRECTORY ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Default export folder</label>
          <span className="settings-helper">Target directory where converted and processed files are saved.</span>
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

      {/* ─── 2. OUTPUT NAMING TEMPLATE WITH LIVE PREVIEW ─── */}
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
            <code style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
              {settings.namingTemplate
                ? settings.namingTemplate
                    .replace('{name}', 'document')
                    .replace('{tool}', 'compress-pdf')
                    .replace('{date}', new Date().toISOString().slice(0, 10))
                    .replace('{time}', '14-30-00')
                    .replace('{counter}', '1') + '.pdf'
                : 'document_compress-pdf_2026-10-04.pdf'}
            </code>
          </span>
        </div>
      </div>

      {/* ─── 3. FILE COLLISION BEHAVIOR ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Collision behavior</label>
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

      {/* ─── 4. PRESERVE DATES ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Preserve modification dates</label>
          <span className="settings-helper">Retain original creation and modified timestamps on converted files.</span>
        </div>
        <ToggleSwitch
          checked={settings.preserveTimestamps}
          onChange={(checked) => onUpdateSettings({ preserveTimestamps: checked })}
          aria-label="Preserve modification dates"
        />
      </div>

      {/* ─── 5. FILE ASSOCIATIONS (SWITCH ONLY) ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">File associations</label>
          <span className="settings-helper">Handle system file opens for PDF, images, CSV, JSON, and archives.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <ToggleSwitch
            checked={settings.fileAssociationsEnabled ?? true}
            onChange={(checked) => onUpdateSettings({ fileAssociationsEnabled: checked })}
            aria-label="File associations"
          />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '300px' }}>
            {['.pdf', '.png', '.jpg', '.webp', '.svg', '.csv', '.json', '.zip', '.md'].map((ext) => (
              <span
                key={ext}
                style={{
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  padding: '1px 5px',
                  color: 'var(--text-2)',
                }}
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 6. DISK CACHE SIZE + CLEAR ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Temporary cache size</label>
          <span className="settings-helper">Cached scratch files and intermediate buffers: 48.2 MB</span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleClearCache}>
          {cacheCleared ? (
            <Check size={13} style={{ marginRight: '6px', color: 'var(--color-success, #22c55e)' }} />
          ) : (
            <Trash2 size={13} style={{ marginRight: '6px' }} />
          )}
          {cacheCleared ? 'Cache purged' : 'Clear cache'}
        </Button>
      </div>
    </div>
  );
};
