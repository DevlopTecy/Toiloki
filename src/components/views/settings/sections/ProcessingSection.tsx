import React from 'react';
import { RotateCcw, Cpu } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '../../../../core/services/settings.service';

interface ProcessingSectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const ProcessingSection: React.FC<ProcessingSectionProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const handleReset = () => {
    onUpdateSettings({
      threads: DEFAULT_SETTINGS.threads,
      memoryLimit: DEFAULT_SETTINGS.memoryLimit,
      hardwareAccel: DEFAULT_SETTINGS.hardwareAccel,
    });
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Processing & Engine</h2>
          <p className="settings-section-desc">
            Configure local concurrency, memory buffer allocations, and GPU acceleration.
          </p>
        </div>
        <button
          type="button"
          className="settings-ghost-reset-btn"
          onClick={handleReset}
          title="Reset processing section"
        >
          <RotateCcw size={13} />
          <span>Reset section</span>
        </button>
      </div>

      {/* ─── 1. CONCURRENT WORKER THREADS ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Concurrent worker threads</label>
          <span className="settings-helper">Parallel Web Worker count for batch image and PDF tasks.</span>
        </div>
        <select
          className="settings-select"
          value={settings.threads}
          onChange={(e) => onUpdateSettings({ threads: e.target.value })}
        >
          <option value="2">2 Threads (Low CPU consumption)</option>
          <option value="4">4 Threads (Balanced throughput)</option>
          <option value="8">8 Threads (High performance)</option>
          <option value="16">16 Threads (Maximum CPU utilization)</option>
        </select>
      </div>

      {/* ─── 2. IN-MEMORY BUFFER ALLOCATION ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">In-memory buffer allocation</label>
          <span className="settings-helper">Maximum RAM headroom reserved for large raster conversions.</span>
        </div>
        <select
          className="settings-select"
          value={settings.memoryLimit}
          onChange={(e) => onUpdateSettings({ memoryLimit: e.target.value })}
        >
          <option value="512">512 MB (Conservative)</option>
          <option value="1024">1024 MB (1 GB Recommended)</option>
          <option value="2048">2048 MB (2 GB for large archives)</option>
          <option value="4096">4096 MB (4 GB Power User)</option>
        </select>
      </div>

      {/* ─── 3. HARDWARE ACCELERATION ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Hardware acceleration</label>
          <span className="settings-helper">Leverage dedicated GPU for WebGL filters, canvas scaling, and preview rendering.</span>
        </div>
        <label className="settings-switch">
          <input
            type="checkbox"
            checked={settings.hardwareAccel}
            onChange={(e) => onUpdateSettings({ hardwareAccel: e.target.checked })}
          />
          <span className="settings-switch-label">
            {settings.hardwareAccel ? 'GPU Acceleration Enabled' : 'Disabled (Software fallback)'}
          </span>
        </label>
      </div>
    </div>
  );
};
