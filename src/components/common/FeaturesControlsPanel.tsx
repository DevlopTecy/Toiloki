import React, { useEffect, useRef } from 'react';
import { FeatureDefinition } from '../../core/types/workspace';
import { Sliders, ToggleLeft, ToggleRight, Layers, ArrowRight, Download, Sparkles } from 'lucide-react';
import './FeaturesControlsPanel.css';

interface FeaturesControlsPanelProps {
  features?: FeatureDefinition[];
  activeFeatureId?: string | null;
  onFeatureSelect?: (featureId: string) => void;
}

export const FeaturesControlsPanel: React.FC<FeaturesControlsPanelProps> = ({
  features = [],
  activeFeatureId,
  onFeatureSelect,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Group features by kind
  const modes = features.filter((f) => f.kind === 'mode');
  const options = features.filter((f) => f.kind === 'option');
  const outputs = features.filter((f) => f.kind === 'output');
  const actions = features.filter((f) => f.kind === 'action');
  const batch = features.filter((f) => f.kind === 'batch');

  // Track active mode/option state locally for interactive feel
  const [selectedMode, setSelectedMode] = React.useState<string>(() => modes[0]?.id || '');
  const [toggledOptions, setToggledOptions] = React.useState<Record<string, boolean>>({});
  const [selectedOutput, setSelectedOutput] = React.useState<string>(() => outputs[0]?.id || '');

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
                          {isChecked ? (
                            <ToggleRight size={20} className="toggle-icon on" />
                          ) : (
                            <ToggleLeft size={20} className="toggle-icon off" />
                          )}
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
                    <Sparkles size={13} className="act-icon" />
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
