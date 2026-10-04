import React, { useEffect, useRef, useState } from 'react';
import { FeatureDefinition } from '../../core/types/workspace';
import { Sliders, Layers, ArrowRight, Download, Zap, Bookmark, Plus, Check, X } from 'lucide-react';
import { PresetsService, UtilityPreset } from '../../core/services/presets.service';
import { UtilityRegistry } from '../../core/registry/tool-registry';
import './FeaturesControlsPanel.css';

interface FeaturesControlsPanelProps {
  features?: FeatureDefinition[];
  activeFeatureId?: string | null;
  onFeatureSelect?: (featureId: string) => void;
  utilityId?: string;
}

export const FeaturesControlsPanel: React.FC<FeaturesControlsPanelProps> = ({
  features = [],
  activeFeatureId,
  onFeatureSelect,
  utilityId,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Group features by kind
  const modes = features.filter((f) => f.kind === 'mode');
  const options = features.filter((f) => f.kind === 'option');
  const outputs = features.filter((f) => f.kind === 'output');
  const actions = features.filter((f) => f.kind === 'action');
  const batch = features.filter((f) => f.kind === 'batch');

  // Load last saved options if available ("Continue where you left off")
  const savedOptions = utilityId ? UtilityRegistry.getLastOptions(utilityId) : null;

  // Track active mode/option state locally for interactive feel
  const [selectedMode, setSelectedMode] = useState<string>(() => {
    if (savedOptions?.selectedMode) return savedOptions.selectedMode;
    return modes[0]?.id || '';
  });
  const [toggledOptions, setToggledOptions] = useState<Record<string, boolean>>(() => {
    if (savedOptions?.toggledOptions) return savedOptions.toggledOptions;
    return {};
  });
  const [selectedOutput, setSelectedOutput] = useState<string>(() => {
    if (savedOptions?.selectedOutput) return savedOptions.selectedOutput;
    return outputs[0]?.id || '';
  });

  // Presets state
  const [presets, setPresets] = useState<UtilityPreset[]>(() => {
    return utilityId ? PresetsService.getPresetsForUtility(utilityId) : [];
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Refresh presets if utilityId changes
  useEffect(() => {
    if (utilityId) {
      setPresets(PresetsService.getPresetsForUtility(utilityId));
      const last = UtilityRegistry.getLastOptions(utilityId);
      if (last) {
        if (last.selectedMode) setSelectedMode(last.selectedMode);
        if (last.toggledOptions) setToggledOptions(last.toggledOptions);
        if (last.selectedOutput) setSelectedOutput(last.selectedOutput);
      }
    }
  }, [utilityId]);

  // Save last options whenever options change (never saves file contents)
  useEffect(() => {
    if (utilityId) {
      UtilityRegistry.saveLastOptions(utilityId, {
        selectedMode,
        toggledOptions,
        selectedOutput,
      });
    }
  }, [utilityId, selectedMode, toggledOptions, selectedOutput]);

  // Handle deep link / activeFeatureId scroll and highlight
  useEffect(() => {
    if (!activeFeatureId || !panelRef.current) return;
    const el = panelRef.current.querySelector(`[data-feature-id="${activeFeatureId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      el.classList.add('feature-highlight-pulse');
      const timer = setTimeout(() => {
        el.classList.remove('feature-highlight-pulse');
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [activeFeatureId]);

  const handleApplyPreset = (preset: UtilityPreset) => {
    setActivePresetId(preset.id);
    if (preset.values.selectedMode) setSelectedMode(preset.values.selectedMode);
    if (preset.values.targetCase) setSelectedMode(preset.values.targetCase);
    if (preset.values.selectedOutput) setSelectedOutput(preset.values.selectedOutput);
    if (preset.values.toggledOptions) {
      setToggledOptions(preset.values.toggledOptions);
    } else {
      // Map arbitrary key-value preset flags
      const flags: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(preset.values)) {
        if (typeof v === 'boolean') flags[k] = v;
      }
      setToggledOptions((prev) => ({ ...prev, ...flags }));
    }
  };

  const handleSaveCustomPreset = () => {
    if (!utilityId || !newPresetName.trim()) return;
    const created = PresetsService.saveCustomPreset({
      utilityId,
      name: newPresetName.trim(),
      description: 'User saved configuration',
      values: {
        selectedMode,
        toggledOptions,
        selectedOutput,
      },
    });
    setPresets(PresetsService.getPresetsForUtility(utilityId));
    setActivePresetId(created.id);
    setNewPresetName('');
    setIsAddingPreset(false);
  };

  if (!features || features.length === 0) return null;

  return (
    <div className="features-controls-panel" ref={panelRef} aria-label="Utility Options & Features">
      <div className="features-panel-header">
        <div className="features-panel-title-wrap">
          <Sliders size={13} className="features-panel-icon" />
          <span className="features-panel-title">Options & Capabilities</span>
        </div>
        <span className="features-count-tag">{features.length} features</span>
      </div>

      <div className="features-groups-flow">
        {/* Presets Chips Row */}
        {(presets.length > 0 || utilityId) && (
          <div className="feature-group-section preset-section">
            <div className="preset-section-header">
              <label className="feature-group-label">Presets</label>
              {!isAddingPreset && (
                <button
                  type="button"
                  className="preset-add-trigger-btn"
                  onClick={() => setIsAddingPreset(true)}
                  title="Save current configuration as a preset"
                >
                  <Plus size={11} />
                  <span>Save as preset</span>
                </button>
              )}
            </div>

            {/* Inline new preset name input */}
            {isAddingPreset && (
              <div className="preset-input-inline-form">
                <input
                  type="text"
                  className="preset-name-input"
                  placeholder="Preset name (e.g. Production Web)"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCustomPreset();
                    if (e.key === 'Escape') setIsAddingPreset(false);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="preset-save-confirm-btn"
                  onClick={handleSaveCustomPreset}
                  disabled={!newPresetName.trim()}
                >
                  <Check size={12} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  className="preset-cancel-btn"
                  onClick={() => {
                    setIsAddingPreset(false);
                    setNewPresetName('');
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="presets-chips-row">
              {presets.map((p) => {
                const isActive = activePresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`preset-chip-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleApplyPreset(p)}
                    title={p.description || p.name}
                  >
                    <Bookmark size={11} className="preset-chip-icon" />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. Modes (Segmented Control) */}
        {modes.length > 0 && (
          <div className="feature-group-section mode-section">
            <label className="feature-group-label">Mode</label>
            <div className="features-segmented-control" role="tablist">
              {modes.map((m) => {
                const isSelected = selectedMode === m.id || activeFeatureId === m.id;
                const isSoon = m.status === 'soon';

                return (
                  <button
                    key={m.id}
                    type="button"
                    data-feature-id={m.id}
                    className={`segmented-tab-btn ${isSelected ? 'active' : ''} ${isSoon ? 'is-soon' : ''}`}
                    onClick={() => {
                      if (!isSoon) setSelectedMode(m.id);
                      onFeatureSelect?.(m.id);
                    }}
                    title={m.description}
                  >
                    <span>{m.name}</span>
                    {isSoon && <span className="feat-mini-badge feat-soon">Soon</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Options (Fields & Toggles) */}
        {options.length > 0 && (
          <div className="feature-group-section option-section">
            <label className="feature-group-label">Configuration</label>
            <div className="features-options-list">
              {options.map((opt) => {
                const isChecked = Boolean(toggledOptions[opt.id]);
                const isSoon = opt.status === 'soon';
                const isTargeted = activeFeatureId === opt.id;

                return (
                  <div
                    key={opt.id}
                    data-feature-id={opt.id}
                    className={`feature-option-row ${isTargeted ? 'is-targeted' : ''} ${isSoon ? 'is-soon' : ''}`}
                    onClick={() => {
                      if (!isSoon) {
                        setToggledOptions((prev) => ({ ...prev, [opt.id]: !prev[opt.id] }));
                      }
                      onFeatureSelect?.(opt.id);
                    }}
                    title={opt.description}
                  >
                    <div className="feature-opt-info">
                      <span className="feature-opt-name">{opt.name}</span>
                      <span className="feature-opt-desc">{opt.description}</span>
                    </div>

                    <div className="feature-opt-toggle">
                      {isSoon ? (
                        <span className="feat-mini-badge feat-soon">Soon</span>
                      ) : (
                        <button
                          type="button"
                          className="opt-toggle-btn"
                          aria-checked={isChecked}
                          tabIndex={-1}
                        >
                          <span className={`toiloki-switch-track ${isChecked ? 'is-checked' : ''}`}>
                            <span className="toiloki-switch-thumb" />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Output Formats (Format Select) */}
        {outputs.length > 0 && (
          <div className="feature-group-section output-section">
            <label className="feature-group-label">Output Target</label>
            <div className="features-output-pills">
              {outputs.map((out) => {
                const isSelected = selectedOutput === out.id || activeFeatureId === out.id;
                const isSoon = out.status === 'soon';

                return (
                  <button
                    key={out.id}
                    type="button"
                    data-feature-id={out.id}
                    className={`output-pill-btn ${isSelected ? 'active' : ''} ${isSoon ? 'is-soon' : ''}`}
                    onClick={() => {
                      if (!isSoon) setSelectedOutput(out.id);
                      onFeatureSelect?.(out.id);
                    }}
                    title={out.description}
                  >
                    <Download size={12} className="out-icon" />
                    <span>{out.name}</span>
                    {isSoon && <span className="feat-mini-badge feat-soon">Soon</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Actions (Buttons) */}
        {actions.length > 0 && (
          <div className="feature-group-section action-section">
            <label className="feature-group-label">Actions</label>
            <div className="features-actions-grid">
              {actions.map((act) => {
                const isSoon = act.status === 'soon';
                const isTargeted = activeFeatureId === act.id;

                return (
                  <button
                    key={act.id}
                    type="button"
                    data-feature-id={act.id}
                    className={`feature-action-btn ${isTargeted ? 'is-targeted' : ''} ${isSoon ? 'is-soon' : ''}`}
                    onClick={() => {
                      onFeatureSelect?.(act.id);
                    }}
                    title={act.description}
                  >
                    <Zap size={13} className="act-icon" />
                    <span className="act-name">{act.name}</span>
                    {isSoon ? (
                      <span className="feat-mini-badge feat-soon">Soon</span>
                    ) : (
                      <ArrowRight size={12} className="act-arrow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Batch Controls */}
        {batch.length > 0 && (
          <div className="feature-group-section batch-section">
            <label className="feature-group-label">Batch Operations</label>
            <div className="features-batch-list">
              {batch.map((b) => {
                const isSoon = b.status === 'soon';
                const isTargeted = activeFeatureId === b.id;

                return (
                  <div
                    key={b.id}
                    data-feature-id={b.id}
                    className={`feature-batch-card ${isTargeted ? 'is-targeted' : ''} ${isSoon ? 'is-soon' : ''}`}
                    onClick={() => onFeatureSelect?.(b.id)}
                    title={b.description}
                  >
                    <div className="batch-card-left">
                      <Layers size={14} className="batch-icon" />
                      <div className="batch-card-text">
                        <span className="batch-name">{b.name}</span>
                        <span className="batch-desc">{b.description}</span>
                      </div>
                    </div>
                    {isSoon && <span className="feat-mini-badge feat-soon">Soon</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
