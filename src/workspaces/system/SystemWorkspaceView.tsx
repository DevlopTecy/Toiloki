import React, { useState } from 'react';
import { SystemEngine, SystemInfo, EnvVarItem, HostsEntry } from '../../engines/system/system.engine';
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

// ─────────────────────────────────────────────────────────────────────────────

function SysCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sys-card">
      <h3 className="sys-card-title">{title}</h3>
      {children}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="sys-copy-btn" onClick={copy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── 1. System Info Report ───────────────────────────────────────────────────
function SystemInfoView() {
  const info: SystemInfo = React.useMemo(() => {
    return SystemEngine.getSystemInfo().data!;
  }, []);

  const reportText = JSON.stringify(info, null, 2);

  return (
    <SysCard title="Local System Environment & Diagnostics Report">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CopyBtn text={reportText} />
      </div>
      <div className="sys-grid-stats">
        {[
          ['OS / Platform', `${info.osName} (${info.platform})`],
          ['Architecture', info.architecture],
          ['Logical CPU Cores', `${info.logicalCores} Cores`],
          ['Memory Estimate', `~${info.memoryEstimateGb} GB RAM`],
          ['Display Resolution', info.screenResolution],
          ['Color Depth', `${info.colorDepth}-bit`],
          ['Locale & Language', info.language],
          ['Local Timezone', info.timezone],
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

// ─── 2. Environment Variables Viewer ─────────────────────────────────────────
function EnvVarsView() {
  const [sample, setSample] = useState(
    'NODE_ENV=development\nPORT=3000\nDATABASE_URL=postgres://localhost:5432/app\nAPI_SECRET=sk_live_9981881772\nDEBUG=true'
  );
  const [maskSecrets, setMaskSecrets] = useState(true);

  const envs: EnvVarItem[] = React.useMemo(() => {
    return SystemEngine.parseEnv(sample).data || [];
  }, [sample]);

  return (
    <SysCard title=".env Environment Variables Inspector">
      <div className="control-group">
        <label className="control-label">Paste .env file contents:</label>
        <textarea className="code-editor" rows={4} value={sample} onChange={(e) => setSample(e.target.value)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <label className="sys-checkbox-label">
          <input type="checkbox" checked={maskSecrets} onChange={(e) => setMaskSecrets(e.target.checked)} />
          Mask sensitive secret values
        </label>
        <CopyBtn text={envs.map((e) => `${e.key}=${e.value}`).join('\n')} />
      </div>
      <div className="sys-env-table" style={{ marginTop: 12 }}>
        {envs.map((e) => (
          <div key={e.key} className="sys-env-row">
            <span className="sys-env-key">{e.key}</span>
            <code className="sys-env-val">
              {e.isSecret && maskSecrets ? '••••••••••••••••' : e.value}
            </code>
            {e.isSecret && <span className="sys-secret-pill">Secret</span>}
          </div>
        ))}
      </div>
    </SysCard>
  );
}

// ─── 3. Hosts File Viewer ────────────────────────────────────────────────────
function HostsFileView() {
  const defaultHosts =
    '# Localhost mappings\n127.0.0.1       localhost\n::1             localhost\n127.0.0.1       local.dev\n# 127.0.0.1     staging.local';
  const [content, setContent] = useState(defaultHosts);

  const entries: HostsEntry[] = React.useMemo(() => {
    return SystemEngine.parseHostsFile(content).data || [];
  }, [content]);

  return (
    <SysCard title="Local /etc/hosts & DNS Mappings Inspector">
      <div className="control-group">
        <label className="control-label">Hosts File Contents:</label>
        <textarea className="code-editor" rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <div className="sys-env-table" style={{ marginTop: 14 }}>
        {entries.map((h, i) => (
          <div key={i} className={`sys-env-row ${!h.enabled ? 'disabled' : ''}`}>
            <span style={{ width: 120, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>
              {h.ip}
            </span>
            <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)' }}>{h.host}</span>
            <span style={{ fontSize: 11, color: h.enabled ? '#4ade80' : 'var(--text-tertiary)' }}>
              {h.enabled ? '● Active' : '○ Commented'}
            </span>
          </div>
        ))}
      </div>
    </SysCard>
  );
}

// ─── 4. Disk Usage Tree ──────────────────────────────────────────────────────
function DiskUsageTreeView() {
  const sampleFiles = [
    { path: 'src/components/Sidebar.tsx', size: 12400 },
    { path: 'src/components/TitleBar.tsx', size: 8500 },
    { path: 'src/engines/pdf.engine.ts', size: 48900 },
    { path: 'public/icon.png', size: 32000 },
    { path: 'package.json', size: 2200 },
  ];

  const tree = React.useMemo(() => {
    return SystemEngine.formatStorageTree(sampleFiles).data || '';
  }, []);

  return (
    <SysCard title="Storage & Directory Structure Tree">
      <div className="sys-code-box">
        <pre><code>{tree}</code></pre>
        <CopyBtn text={tree} />
      </div>
    </SysCard>
  );
}

// ─── 5. Large File Finder ────────────────────────────────────────────────────
function LargeFileFinderView() {
  const [minMb, setMinMb] = useState(50);
  return (
    <SysCard title="Large File Threshold Finder">
      <div className="control-group">
        <label className="control-label">Minimum Size Threshold: {minMb} MB</label>
        <input type="range" min={10} max={1000} step={10} value={minMb} onChange={(e) => setMinMb(Number(e.target.value))} style={{ width: 300 }} />
      </div>
      <div className="sys-notice-box" style={{ marginTop: 12 }}>
        💡 Drop or select a folder to scan for files exceeding {minMb} MB without network transmission.
      </div>
    </SysCard>
  );
}

// ─── 6. Temp Cache Cleaner ───────────────────────────────────────────────────
function TempCleanerView() {
  return (
    <SysCard title="Temporary Cache Cleaner (Safe Preview)">
      <div className="sys-notice-box">
        🛡️ Toiloki Trash Protection Active: Temporary cache inspection runs safely in dry-run mode. Files are never purged without explicit user confirmation.
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="tool-btn secondary small-btn">
          Run Safe Temp Directory Scan
        </button>
      </div>
    </SysCard>
  );
}

// ─── 7. Empty Folder Cleaner ─────────────────────────────────────────────────
function EmptyFolderCleanerView() {
  return (
    <SysCard title="Empty Directory Structure Cleaner">
      <div className="sys-notice-box">
        Inspects directory trees and identifies abandoned empty nested folders.
      </div>
    </SysCard>
  );
}

// ─── 8. Process Viewer ───────────────────────────────────────────────────────
function ProcessViewerView() {
  const tasks = [
    { name: 'Toiloki.exe', pid: 14082, memory: '112 MB', cpu: '0.4%' },
    { name: 'electron.exe', pid: 14096, memory: '88 MB', cpu: '0.2%' },
    { name: 'node.exe (Vite Dev)', pid: 9812, memory: '144 MB', cpu: '0.1%' },
  ];

  return (
    <SysCard title="Application Process & Resource Inspector (Read-only)">
      <div className="sys-env-table">
        {tasks.map((t) => (
          <div key={t.pid} className="sys-env-row">
            <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>PID {t.pid}</span>
            <span style={{ flex: 1, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
            <span style={{ width: 100, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{t.memory}</span>
            <span style={{ width: 60, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{t.cpu}</span>
          </div>
        ))}
      </div>
    </SysCard>
  );
}

// ─── 9. Startup Items Viewer ─────────────────────────────────────────────────
function StartupItemsView() {
  return (
    <SysCard title="Windows Startup & Launch Items Registry">
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
        Inspect standard registry run keys (HKCU/HKLM Software\Microsoft\Windows\CurrentVersion\Run).
      </p>
    </SysCard>
  );
}

// ─── 10. Clipboard History ───────────────────────────────────────────────────
function ClipboardHistoryView() {
  const [history, setHistory] = useState(['#D4B06A', 'https://toiloki.app', 'export const APP_VERSION = "1.0.0";']);
  return (
    <SysCard title="Local Clipboard History (In-Memory)">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{history.length} items cached</span>
        <button className="tool-btn secondary small-btn" onClick={() => setHistory([])}>Clear History</button>
      </div>
      <div className="sys-env-table">
        {history.map((item, i) => (
          <div key={i} className="sys-env-row">
            <code style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>{item}</code>
            <CopyBtn text={item} />
          </div>
        ))}
      </div>
    </SysCard>
  );
}
