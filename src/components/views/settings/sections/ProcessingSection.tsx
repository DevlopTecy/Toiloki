import React from 'react';
import { RotateCcw, ChevronDown, Check } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '../../../../core/services/settings.service';
import { ToggleSwitch } from '../components/ToggleSwitch';

interface ProcessingSectionProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const ProcessingSection: React.FC<ProcessingSectionProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const currentMode = settings.performanceMode || 'auto';

  const handleSelectMode = (mode: 'auto' | 'fast' | 'low-memory') => {
    if (mode === 'auto') {
      onUpdateSettings({
        performanceMode: 'auto',
        threads: '4',
        memoryLimit: '1024',
        hardwareAccel: true,
      });
    } else if (mode === 'fast') {
      onUpdateSettings({
        performanceMode: 'fast',
        threads: '8',
        memoryLimit: '4096',
        hardwareAccel: true,
      });
    } else if (mode === 'low-memory') {
      onUpdateSettings({
        performanceMode: 'low-memory',
        threads: '2',
        memoryLimit: '512',
        hardwareAccel: false,
      });
    }
  };

  const handleReset = () => {
    onUpdateSettings({
      performanceMode: DEFAULT_SETTINGS.performanceMode,
      threads: DEFAULT_SETTINGS.threads,
      memoryLimit: DEFAULT_SETTINGS.memoryLimit,
      hardwareAccel: DEFAULT_SETTINGS.hardwareAccel,
    });
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Performance</h2>
          <p className="settings-section-desc">
            Configure local concurrency throughput, memory buffer allocations, and GPU acceleration.
          </p>
        </div>
        <button
          type="button"
          className="settings-ghost-reset-btn"
          onClick={handleReset}
          title="Reset performance section"
        >
          <RotateCcw size={13} />
          <span>Reset section</span>
        </button>
      </div>

      {/* ─── 1. TOP-LEVEL CHOICE: AUTO / FAST / LOW MEMORY ─── */}
      <div className="settings-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '12px' }}>
        <div className="settings-row-info">
          <label className="settings-label">Performance profile</label>
          <span className="settings-helper">
            Choose your target operating profile based on available system resources and workload.
          </span>
        </div>

        <div className="perf-mode-grid">
          <button
            type="button"
            className={`perf-mode-card ${currentMode === 'auto' ? 'is-active' : ''}`}
            onClick={() => handleSelectMode('auto')}
          >
            <div className="perf-mode-title">
              <span>Auto</span>
              {currentMode === 'auto' && <Check size={14} color="var(--accent)" />}
            </div>
            <div className="perf-mode-desc">
              Balanced throughput. 4 worker threads and 1GB memory headroom. Recommended for general use.
            </div>
          </button>

          <button
            type="button"
            className={`perf-mode-card ${currentMode === 'fast' ? 'is-active' : ''}`}
            onClick={() => handleSelectMode('fast')}
          >
            <div className="perf-mode-title">
              <span>Fast</span>
              {currentMode === 'fast' && <Check size={14} color="var(--accent)" />}
            </div>
            <div className="perf-mode-desc">
              Maximum speed. 8 worker threads, 4GB RAM buffer, and hardware acceleration for bulk tasks.
            </div>
          </button>

          <button
            type="button"
            className={`perf-mode-card ${currentMode === 'low-memory' ? 'is-active' : ''}`}
            onClick={() => handleSelectMode('low-memory')}
          >
            <div className="perf-mode-title">
              <span>Low memory</span>
              {currentMode === 'low-memory' && <Check size={14} color="var(--accent)" />}
            </div>
            <div className="perf-mode-desc">
              Minimal footprint. 2 worker threads and 512MB RAM cap. Ideal for background runs or older hardware.
            </div>
          </button>
        </div>
      </div>

      {/* ─── 2. COLLAPSED ADVANCED PERFORMANCE ─── */}
      <details className="settings-accordion" style={{ marginTop: '8px' }}>
        <summary className="settings-accordion-summary">
          <span>Advanced performance</span>
          <ChevronDown size={14} color="var(--text-muted)" />
        </summary>
        <div className="settings-accordion-content">
          {/* Threads */}
          <div className="settings-row" style={{ paddingTop: 0 }}>
            <div className="settings-row-info">
              <label className="settings-label">Concurrent worker threads</label>
              <span className="settings-helper">Parallel Web Worker count for batch image and PDF tasks.</span>
            </div>
            <select
              className="settings-select"
              value={settings.threads}
              onChange={(e) => {
                onUpdateSettings({ threads: e.target.value, performanceMode: 'custom' });
              }}
            >
              <option value="2">2 Threads (Low CPU)</option>
              <option value="4">4 Threads (Balanced)</option>
              <option value="8">8 Threads (High Performance)</option>
              <option value="16">16 Threads (Maximum CPU)</option>
            </select>
          </div>

          {/* Buffer */}
          <div className="settings-row">
            <div className="settings-row-info">
              <label className="settings-label">In-memory buffer allocation</label>
              <span className="settings-helper">Maximum RAM headroom reserved for large raster conversions.</span>
            </div>
            <select
              className="settings-select"
              value={settings.memoryLimit}
              onChange={(e) => {
                onUpdateSettings({ memoryLimit: e.target.value, performanceMode: 'custom' });
              }}
            >
              <option value="512">512 MB (Conservative)</option>
              <option value="1024">1024 MB (1 GB Recommended)</option>
              <option value="2048">2048 MB (2 GB for large archives)</option>
              <option value="4096">4096 MB (4 GB Power User)</option>
            </select>
          </div>

          {/* GPU Hardware Acceleration */}
          <div className="settings-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div className="settings-row-info">
              <label className="settings-label">Hardware acceleration</label>
              <span className="settings-helper">Leverage dedicated GPU for WebGL filters, canvas scaling, and preview rendering.</span>
            </div>
            <ToggleSwitch
              checked={settings.hardwareAccel}
              onChange={(checked) => {
                onUpdateSettings({ hardwareAccel: checked, performanceMode: 'custom' });
              }}
              aria-label="Hardware acceleration"
            />
          </div>
        </div>
      </details>
    </div>
  );
};
