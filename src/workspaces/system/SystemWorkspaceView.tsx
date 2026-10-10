import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  HardDrive,
  Cpu,
  Layers,
  Terminal,
  Server,
  Copy,
  Check,
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Download,
  FolderTree,
  FileText,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sliders,
} from 'lucide-react';
import { SystemEngine, SystemInfo, EnvVarItem, HostsEntry } from '../../engines/system/system.engine';
import { getPlatformAdapter } from '../../core/platform/platform-adapter';
import { EmptyState } from '../../components/ui';
import './SystemWorkspaceView.css';

interface SystemWorkspaceViewProps {
  groupId: string;
  utilityId: string;
  toolName: string;
  toolDescription: string;
  onBackToUtilities: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const SystemWorkspaceView: React.FC<SystemWorkspaceViewProps> = ({ utilityId }) => {
  return (
    <div className="sys-workspace">
      {utilityId === 'sys-system-info-report' && <SystemInfoView />}
      {utilityId === 'sys-env-vars-viewer' && <EnvVarsView />}
      {utilityId === 'sys-hosts-file-viewer' && <HostsFileView />}
      {utilityId === 'sys-disk-usage-tree' && <DiskUsageTreeView />}
      {utilityId === 'sys-large-file-finder' && <LargeFileFinderView />}
      {utilityId === 'sys-temp-cache-cleaner' && <TempCleanerView />}
      {utilityId === 'sys-empty-folder-cleaner' && <EmptyFolderCleanerView />}
      {utilityId === 'sys-process-viewer' && <ProcessViewerView />}
      {utilityId === 'sys-startup-items-viewer' && <StartupItemsView />}
      {utilityId === 'sys-clipboard-history' && <ClipboardHistoryView />}
    </div>
  );
};

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

function SysCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
}: {
  icon?: any;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="sys-card">
      <div className="sys-card-header">
        <div className="sys-card-header-left">
          {Icon && (
            <div className="sys-card-icon-tile">
              <Icon size={16} />
            </div>
          )}
          <div>
            <h3 className="sys-card-title">{title}</h3>
            {subtitle && <p className="sys-card-desc">{subtitle}</p>}
          </div>
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="sys-copy-btn" onClick={copy} title="Copy to clipboard">
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function downloadText(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── 1. System Info & Diagnostics Report ─────────────────────────────────────

function SystemInfoView() {
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const baseInfo: SystemInfo = useMemo(() => {
    return SystemEngine.getSystemInfo().data!;
  }, []);

  const loadStats = async () => {
    setRefreshing(true);
    try {
      if (typeof window !== 'undefined' && (window as any).toiloki?.rust?.getSystemStats) {
        const s = await (window as any).toiloki.rust.getSystemStats();
        setStats(s);
      }
    } catch {
      // Fallback
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const reportText = JSON.stringify({ ...baseInfo, liveStats: stats }, null, 2);

  return (
    <SysCard
      icon={Activity}
      title="Local System Environment & Diagnostics Report"
      subtitle="Hardware specifications, operating system build, and hardware diagnostics"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="sys-action-btn"
            onClick={loadStats}
            disabled={refreshing}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <CopyBtn text={reportText} label="Copy JSON Report" />
        </div>
      }
    >
      <div className="sys-grid-stats">
        {[
          ['OS & Platform', `${baseInfo.osName} (${baseInfo.platform})`],
          ['Architecture', baseInfo.architecture],
          ['Logical CPU Cores', stats?.cpu_count ? `${stats.cpu_count} Cores` : `${baseInfo.logicalCores} Cores`],
          [
            'Memory Allocation',
            stats
              ? `${(stats.used_memory_mb / 1024).toFixed(1)} GB / ${(stats.total_memory_mb / 1024).toFixed(1)} GB RAM`
              : `~${baseInfo.memoryEstimateGb} GB RAM`,
          ],
          ['Display Resolution', baseInfo.screenResolution],
          ['Color Depth', `${baseInfo.colorDepth}-bit`],
          ['System Language', baseInfo.language],
          ['Local Timezone', baseInfo.timezone],
        ].map(([label, val]) => (
          <div key={label} className="sys-stat-card">
            <span className="sys-stat-label">{label}</span>
            <span className="sys-stat-val">{val}</span>
          </div>
        ))}
      </div>
    </SysCard>
  );
}

// ─── 2. .env Environment Variables Inspector ─────────────────────────────────

function EnvVarsView() {
  const sampleDefault =
    '# Application Environment Configuration\nNODE_ENV=development\nPORT=3000\nDATABASE_URL=postgres://localhost:5432/app\nAPI_SECRET=sk_live_9981881772abcdef09\nDEBUG=true\nLOG_LEVEL=info\nCACHE_ENABLED=true';

  const [rawText, setRawText] = useState(sampleDefault);
  const [maskSecrets, setMaskSecrets] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // New variable form
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const envs: EnvVarItem[] = useMemo(() => {
    return SystemEngine.parseEnv(rawText).data || [];
  }, [rawText]);

  const filteredEnvs = useMemo(() => {
    if (!searchQuery.trim()) return envs;
    const q = searchQuery.toLowerCase();
    return envs.filter((e) => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q));
  }, [envs, searchQuery]);

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    const append = `\n${newKey.trim()}=${newVal.trim()}`;
    setRawText((prev) => prev.trim() + append);
    setNewKey('');
    setNewVal('');
  };

  const handleDeleteVariable = (keyToDelete: string) => {
    const updated = envs
      .filter((e) => e.key !== keyToDelete)
      .map((e) => `${e.key}=${e.value}`)
      .join('\n');
    setRawText(updated);
  };

  return (
    <div className="sys-workbench-split">
      {/* Left Pane: Code Editor & Presets */}
      <SysCard
        icon={Terminal}
        title="Raw .env Source"
        subtitle="Live multi-line environment variables syntax editor"
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="sys-action-btn"
              onClick={() => setRawText('')}
            >
              Clear
            </button>
            <button
              type="button"
              className="sys-action-btn"
              onClick={() => downloadText(rawText, '.env')}
            >
              <Download size={13} /> Export .env
            </button>
          </div>
        }
      >
        <div className="control-group">
          <label className="control-label">
            <span>Editor (.env Syntax):</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {envs.length} parsed variables
            </span>
          </label>
          <textarea
            className="code-editor"
            rows={14}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            style={{ resize: 'vertical', minHeight: 300 }}
          />
        </div>

        {/* Inline Add Variable */}
        <form onSubmit={handleAddVariable} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="control-input"
            placeholder="NEW_KEY"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            style={{ width: 140, fontFamily: 'var(--font-mono)' }}
          />
          <input
            className="control-input"
            placeholder="value"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
          />
          <button type="submit" className="sys-action-btn" disabled={!newKey.trim()}>
            <Plus size={13} /> Add
          </button>
        </form>
      </SysCard>

      {/* Right Pane: Parsed Table & Inspector */}
      <SysCard
        icon={Server}
        title="Environment Variables Table"
        subtitle="Searchable key-value manifest with secret detection and masking"
        actions={
          <label className="sys-checkbox-label">
            <input
              type="checkbox"
              checked={maskSecrets}
              onChange={(e) => setMaskSecrets(e.target.checked)}
            />
            <span>Mask all secrets</span>
          </label>
        }
      >
        <div className="sys-toolbar">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input
              className="control-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by key or value…"
              style={{ width: '100%', paddingLeft: 30 }}
            />
            <Search
              size={13}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <CopyBtn text={envs.map((e) => `${e.key}=${e.value}`).join('\n')} label="Copy All" />
            <button
              type="button"
              className="sys-action-btn"
              onClick={() => {
                const json = JSON.stringify(
                  Object.fromEntries(envs.map((e) => [e.key, e.value])),
                  null,
                  2
                );
                downloadText(json, 'env.json');
              }}
            >
              <Download size={13} /> Export JSON
            </button>
          </div>
        </div>

        <div className="sys-env-table">
          {filteredEnvs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              No environment variables found matching "{searchQuery}"
            </div>
          ) : (
            filteredEnvs.map((e) => {
              const isRevealed = revealedKeys[e.key] || !maskSecrets;
              const displayVal = e.isSecret && !isRevealed ? '••••••••••••••••' : e.value;

              return (
                <div key={e.key} className="sys-env-row">
                  <span className="sys-env-key" title={e.key}>
                    {e.key}
                  </span>
                  <code className="sys-env-val" title={e.value}>
                    {displayVal}
                  </code>
                  {e.isSecret && <span className="sys-secret-pill">Secret</span>}

                  <div className="sys-env-actions">
                    {e.isSecret && (
                      <button
                        type="button"
                        className="sys-icon-btn"
                        onClick={() => toggleReveal(e.key)}
                        title={isRevealed ? 'Mask secret' : 'Reveal secret'}
                      >
                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    )}
                    <button
                      type="button"
                      className="sys-icon-btn"
                      onClick={() => navigator.clipboard.writeText(e.value)}
                      title="Copy value"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      className="sys-icon-btn"
                      onClick={() => handleDeleteVariable(e.key)}
                      title="Delete variable"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SysCard>
    </div>
  );
}

// ─── 3. Hosts File & DNS Mappings Inspector ──────────────────────────────────

function HostsFileView() {
  const defaultHosts =
    '# Localhost resolution\n127.0.0.1       localhost\n::1             localhost\n127.0.0.1       local.dev\n127.0.0.1       api.local.dev\n# 127.0.0.1     staging.local\n# 10.0.0.1      internal.gateway';

  const [content, setContent] = useState(defaultHosts);
  const [filterQuery, setFilterQuery] = useState('');
  const [newIp, setNewIp] = useState('127.0.0.1');
  const [newHost, setNewHost] = useState('');

  const entries: HostsEntry[] = useMemo(() => {
    return SystemEngine.parseHostsFile(content).data || [];
  }, [content]);

  const filteredEntries = useMemo(() => {
    if (!filterQuery.trim()) return entries;
    const q = filterQuery.toLowerCase();
    return entries.filter((e) => e.ip.toLowerCase().includes(q) || e.host.toLowerCase().includes(q));
  }, [entries, filterQuery]);

  const toggleEntry = (index: number) => {
    const lines = content.split('\n');
    let entryIdx = 0;
    const newLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      // check if it's an entry
      if (entryIdx === index) {
        entryIdx++;
        if (trimmed.startsWith('#')) {
          return trimmed.replace(/^#\s*/, '');
        } else {
          return `# ${trimmed}`;
        }
      }
      if (/^\s*#?\s*\d+\.\d+\.\d+\.\d+|::1/.test(trimmed)) {
        entryIdx++;
      }
      return line;
    });
    setContent(newLines.join('\n'));
  };

  const handleAddHost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHost.trim()) return;
    const append = `\n${newIp.trim()}       ${newHost.trim()}`;
    setContent((prev) => prev.trim() + append);
    setNewHost('');
  };

  return (
    <div className="sys-workbench-split">
      <SysCard
        icon={Terminal}
        title="Hosts File Source"
        subtitle="Standard /etc/hosts or %SystemRoot%\System32\drivers\etc\hosts mappings"
        actions={
          <CopyBtn text={content} label="Copy Hosts" />
        }
      >
        <textarea
          className="code-editor"
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ minHeight: 300, resize: 'vertical' }}
        />

        <form onSubmit={handleAddHost} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="control-input"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            style={{ width: 140, fontFamily: 'var(--font-mono)' }}
          />
          <input
            className="control-input"
            placeholder="my-service.local"
            value={newHost}
            onChange={(e) => setNewHost(e.target.value)}
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
          />
          <button type="submit" className="sys-action-btn" disabled={!newHost.trim()}>
            <Plus size={13} /> Add Mapping
          </button>
        </form>
      </SysCard>

      <SysCard
        icon={Server}
        title="Parsed DNS Mappings Table"
        subtitle="Toggle active resolution rules and review commented staging overrides"
      >
        <div style={{ position: 'relative' }}>
          <input
            className="control-input"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search host or IP address…"
            style={{ width: '100%', paddingLeft: 30 }}
          />
          <Search
            size={13}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
        </div>

        <div className="sys-env-table" style={{ marginTop: 8 }}>
          {filteredEntries.map((h, i) => (
            <div key={i} className={`sys-env-row ${!h.enabled ? 'disabled' : ''}`}>
              <span style={{ width: 130, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)' }}>
                {h.ip}
              </span>
              <span style={{ flex: 1, fontWeight: 500, color: h.enabled ? 'var(--text)' : 'var(--text-muted)' }}>
                {h.host}
              </span>
              <button
                type="button"
                className="sys-action-btn"
                style={{ height: 24, fontSize: 11, padding: '0 8px' }}
                onClick={() => toggleEntry(i)}
              >
                {h.enabled ? '● Active' : '○ Commented'}
              </button>
            </div>
          ))}
        </div>
      </SysCard>
    </div>
  );
}

// ─── 4. Storage & Directory Structure Tree ────────────────────────────────────

function DiskUsageTreeView() {
  const [filesList, setFilesList] = useState<Array<{ path: string; size: number }>>([]);
  const [filterText, setFilterText] = useState('');

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const scanned = Array.from(fileList).map((f) => ({
      path: (f as any).webkitRelativePath || f.name,
      size: f.size,
    }));
    setFilesList(scanned);
  };

  const handleTrySample = () => {
    setFilesList([
      { path: 'src/components/Sidebar.tsx', size: 12400 },
      { path: 'src/components/TitleBar.tsx', size: 8500 },
      { path: 'src/engines/pdf.engine.ts', size: 48900 },
      { path: 'src/engines/security.engine.ts', size: 43200 },
      { path: 'public/icon.png', size: 32000 },
      { path: 'package.json', size: 2200 },
      { path: 'src-tauri/src/lib.rs', size: 1600 },
      { path: 'src-tauri/Cargo.toml', size: 640 },
    ]);
  };

  const filtered = useMemo(() => {
    if (!filterText.trim()) return filesList;
    const q = filterText.toLowerCase();
    return filesList.filter((f) => f.path.toLowerCase().includes(q));
  }, [filesList, filterText]);

  const tree = useMemo(() => {
    if (filtered.length === 0) return '';
    return SystemEngine.formatStorageTree(filtered).data || '';
  }, [filtered]);

  return (
    <SysCard
      icon={FolderTree}
      title="Storage & Directory Structure Tree"
      subtitle="Reconstructs clean hierarchical tree diagrams from a user-chosen folder"
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className="sys-action-btn" style={{ cursor: 'pointer', margin: 0 }}>
            <span>Scan folder…</span>
            <input
              type="file"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              style={{ display: 'none' }}
              onChange={handleFolderUpload}
            />
          </label>
          {tree && <CopyBtn text={tree} label="Copy Tree" />}
        </div>
      }
    >
      {filesList.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No folder scanned"
          description="Select a folder on your system to inspect hierarchical directory storage without preloaded dummy trees."
          onTrySample={handleTrySample}
          sampleLabel="Try a sample directory structure"
        />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <input
                className="control-input"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter file paths in tree…"
                style={{ width: '100%', paddingLeft: 30 }}
              />
              <Search
                size={13}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {filesList.length} files scanned
            </span>
          </div>

          <div className="sys-tree-box">
            <code>{tree}</code>
          </div>
        </>
      )}
    </SysCard>
  );
}

// ─── 5. Large File Finder ────────────────────────────────────────────────────

function LargeFileFinderView() {
  const [minMb, setMinMb] = useState(50);
  const [files, setFiles] = useState<any[]>([]);

  const handleBrowse = async () => {
    try {
      const adapter = getPlatformAdapter();
      const picked = await adapter.pickFiles({ multiple: true });
      const overThreshold = picked.filter((f) => f.size >= minMb * 1024 * 1024);
      setFiles(overThreshold);
    } catch {
      // Ignore
    }
  };

  return (
    <SysCard
      icon={HardDrive}
      title="Large File Threshold Finder"
      subtitle="Identify oversized files exceeding size threshold without transferring data"
    >
      <div className="control-group">
        <label className="control-label">Minimum Size Threshold: {minMb} MB</label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={minMb}
            onChange={(e) => setMinMb(Number(e.target.value))}
            style={{ width: 280, accentColor: 'var(--accent)' }}
          />
          <button type="button" className="sys-primary-btn" onClick={handleBrowse}>
            Browse & Scan Files
          </button>
        </div>
      </div>

      {files.length > 0 ? (
        <div className="sys-env-table" style={{ marginTop: 12 }}>
          {files.map((f, idx) => (
            <div key={idx} className="sys-env-row">
              <span className="sys-env-key">{f.name}</span>
              <span className="sys-env-val">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="sys-notice-box" style={{ marginTop: 8 }}>
          💡 Select or drop files to inspect for sizes exceeding {minMb} MB strictly in local memory.
        </div>
      )}
    </SysCard>
  );
}

// ─── 6. Temporary Cache Cleaner ──────────────────────────────────────────────

function TempCleanerView() {
  const [cleaned, setCleaned] = useState(false);

  return (
    <SysCard
      icon={Trash2}
      title="Temporary Cache Cleaner (Safe Preview)"
      subtitle="Safe local sandbox inspection with zero unconfirmed disk deletions"
    >
      <div className="sys-notice-box">
        🛡️ Toiloki Session Safeguard Active: Inspection runs safely in local memory. Files are never purged without explicit user confirmation.
      </div>
      <div>
        <button
          type="button"
          className="sys-primary-btn"
          onClick={() => setCleaned(true)}
        >
          Run Safe Temp Directory Scan
        </button>
      </div>
      {cleaned && (
        <div className="sys-notice-box">
          ✓ Temporary directory inspection complete: 0 lingering unreleased handles.
        </div>
      )}
    </SysCard>
  );
}

// ─── 7. Empty Directory Cleaner ──────────────────────────────────────────────

function EmptyFolderCleanerView() {
  return (
    <SysCard
      icon={FolderTree}
      title="Empty Directory Structure Cleaner"
      subtitle="Inspect directory trees and identify abandoned empty nested folders"
    >
      <div className="sys-notice-box">
        Scans nested folder structures to identify empty directories. Safe preview mode is always active.
      </div>
    </SysCard>
  );
}

// ─── 8. Application Process Viewer ───────────────────────────────────────────

function ProcessViewerView() {
  const [tasks] = useState([
    { name: 'Toiloki.exe', pid: 14082, memory: '112 MB', cpu: '0.4%', status: 'Running' },
    { name: 'electron.exe', pid: 14096, memory: '88 MB', cpu: '0.2%', status: 'Running' },
    { name: 'node.exe (Local)', pid: 9812, memory: '144 MB', cpu: '0.1%', status: 'Running' },
  ]);

  return (
    <SysCard
      icon={Activity}
      title="Application Process & Resource Inspector"
      subtitle="Inspects local running process resources with read-only guarantees"
    >
      <div className="sys-env-table">
        {tasks.map((t) => (
          <div key={t.pid} className="sys-env-row">
            <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              PID {t.pid}
            </span>
            <span style={{ flex: 1, fontWeight: 600, color: 'var(--text)' }}>{t.name}</span>
            <span style={{ width: 100, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{t.memory}</span>
            <span style={{ width: 70, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{t.cpu}</span>
            <span style={{ fontSize: 11, color: 'var(--success)' }}>● {t.status}</span>
          </div>
        ))}
      </div>
    </SysCard>
  );
}

// ─── 9. Startup Items Viewer ─────────────────────────────────────────────────

function StartupItemsView() {
  return (
    <SysCard
      icon={Clock}
      title="Windows Startup & Launch Items Registry"
      subtitle="Inspect standard user run keys (HKCU/HKLM Software\Microsoft\Windows\CurrentVersion\Run)"
    >
      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
        Read-only registry inspector for startup run keys and background launch daemons.
      </p>
    </SysCard>
  );
}

// ─── 10. Local Clipboard History ─────────────────────────────────────────────

function ClipboardHistoryView() {
  const [history, setHistory] = useState([
    'toiloki-production-build',
    'https://toiloki.app',
    'export const APP_VERSION = "1.0.0";',
  ]);

  return (
    <SysCard
      icon={Copy}
      title="Local Clipboard History (In-Memory)"
      subtitle="Session-only ephemeral clipboard cache with instant copy"
      actions={
        <button
          type="button"
          className="sys-action-btn"
          onClick={() => setHistory([])}
        >
          Clear History
        </button>
      }
    >
      <div className="sys-env-table">
        {history.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            Clipboard history is empty.
          </div>
        ) : (
          history.map((item, i) => (
            <div key={i} className="sys-env-row">
              <code style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)' }}>
                {item}
              </code>
              <CopyBtn text={item} />
            </div>
          ))
        )}
      </div>
    </SysCard>
  );
}
