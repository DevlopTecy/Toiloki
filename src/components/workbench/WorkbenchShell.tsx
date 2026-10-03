import React, { useState, useEffect } from 'react';
import { WorkspaceDefinition, GroupDefinition, UtilityDefinition } from '../../core/types/workspace';
import { SettingsService } from '../../core/services/settings.service';
import { FileDropzone, SelectedFile } from '../file-system/FileDropzone';
import { ChevronDown, Undo, Redo, Info, Grid, Save, FolderOpen, Play, CheckCircle } from 'lucide-react';
import './WorkbenchShell.css';

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

  // File session model
  const [versionStack, setVersionStack] = useState<any[]>([]); // Original -> Result 1 -> ...
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [successResult, setSuccessResult] = useState(false);

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
  };

  const handleStartOver = () => {
    setFiles([]);
    setVersionStack([]);
    setHistoryIndex(-1);
    setSuccessResult(false);
  };

  const handleProcess = () => {
    setIsProcessing(true);
    setProgressPercent(0);
    const interval = setInterval(() => {
      setProgressPercent((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setSuccessResult(true);
          return 100;
        }
        return p + 20;
      });
    }, 200);
  };

  const needsFile = activeUtility.needsFile !== false;
  const showEmptyState = needsFile && files.length === 0;

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
                        className={`workbench-dropdown-item ${activeUtility.id === util.id ? 'is-selected' : ''}`}
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
          <button className="workbench-icon-btn" title="All actions">
            <Grid size={16} />
          </button>
          <button className="workbench-icon-btn" title="What this can do">
            <Info size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="workbench-main-area">
        {showEmptyState ? (
          <div className="workbench-empty-state">
            <div className="workbench-empty-dropzone-wrapper">
              <FileDropzone
                accept={['.pdf']}
                multiple={activeUtility.accepts === 'many'}
                files={files}
                onFilesChanged={setFiles}
                label={activeUtility.primaryLabel ? activeUtility.primaryLabel.replace('{n}', 'files') : `Drag files here for ${activeUtility.name}`}
              />
            </div>
          </div>
        ) : (
          <div className="workbench-3-zone-layout">
            {/* Zone 1: Main Workspace */}
            <div className="workbench-zone-1">
              <div className="workbench-canvas-placeholder">
                <div className="canvas-file-preview">
                  <div className="file-icon-placeholder" />
                  <span>{files[0]?.name || 'Current File'}</span>
                </div>
              </div>
            </div>

            {/* Zone 2: Options Panel */}
            <div className="workbench-zone-2">
              <div className="options-panel-header">
                <h3>{activeUtility.name}</h3>
                <p>{activeUtility.description}</p>
              </div>
              <div className="options-panel-body">
                {activeUtility.mode === 'panel' && (
                  <div className="placeholder-options">
                    <label>Mock Option 1</label>
                    <select className="workbench-select">
                      <option>Recommended</option>
                      <option>High Quality</option>
                    </select>
                  </div>
                )}
                {activeUtility.mode === 'info' && (
                  <div className="placeholder-options">
                    <div className="info-row">
                      <span>File Size:</span>
                      <strong>2.4 MB</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Zone 3: Bottom Action Bar */}
      <footer className="workbench-bottom-bar">
        <div className="bottom-bar-left">
          {files.length > 0 && (
            <>
              <button className="workbench-ghost-btn" title="Undo" disabled={historyIndex <= 0}>
                <Undo size={14} />
              </button>
              <button className="workbench-ghost-btn" title="Redo" disabled={historyIndex >= versionStack.length - 1}>
                <Redo size={14} />
              </button>
              <div className="version-chips">
                <span className="version-chip">Original</span>
                {successResult && (
                  <>
                    <span className="version-separator">›</span>
                    <span className="version-chip current-version">{activeUtility.name} applied</span>
                  </>
                )}
              </div>
              <button className="workbench-ghost-btn start-over-btn" onClick={handleStartOver}>
                Start over
              </button>
            </>
          )}
        </div>

        <div className="bottom-bar-right">
          {isProcessing ? (
            <div className="workbench-progress-strip">
              <div className="workbench-progress-track">
                <div className="workbench-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <button className="workbench-cancel-btn" onClick={() => setIsProcessing(false)}>Cancel</button>
            </div>
          ) : successResult ? (
            <div className="workbench-success-strip">
              <div className="toast-ready"><CheckCircle size={14}/> Ready</div>
              <button className="workbench-btn ghost"><FolderOpen size={14} /> Open folder</button>
              <button className="workbench-btn primary"><Save size={14} /> Save as</button>
            </div>
          ) : (
            <button
              className="workbench-btn primary"
              onClick={handleProcess}
              disabled={files.length === 0}
            >
              <Play size={14} />
              {activeUtility.primaryLabel ? activeUtility.primaryLabel.replace('{n}', files.length.toString()) : `Run ${activeUtility.name}`}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
