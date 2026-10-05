import React from 'react';
import { UtilityDefinition, FeatureDefinition } from '../../core/types/workspace';
import { X, Zap, CheckCircle2, Clock, ArrowRight, Layers, Sliders, SlidersHorizontal, Download } from 'lucide-react';
import './WhatThisCanDoModal.css';

interface WhatThisCanDoModalProps {
  utility: UtilityDefinition;
  isOpen: boolean;
  onClose: () => void;
  onSelectFeature?: (featureId: string) => void;
}

export const WhatThisCanDoModal: React.FC<WhatThisCanDoModalProps> = ({
  utility,
  isOpen,
  onClose,
  onSelectFeature,
}) => {
  if (!isOpen) return null;

  const features = utility.features || [];
  const readyFeatures = features.filter((f) => f.status === 'ready');
  const soonFeatures = features.filter((f) => f.status === 'soon');

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'mode':
        return <SlidersHorizontal size={13} />;
      case 'action':
        return <Zap size={13} />;
      case 'output':
        return <Download size={13} />;
      case 'batch':
        return <Layers size={13} />;
      default:
        return <Sliders size={13} />;
    }
  };

  return (
    <div className="what-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="what-modal-card motion-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="what-modal-header">
          <div className="what-modal-title-col">
            <div className="what-tool-chip">
              <span>{utility.name}</span>
            </div>
            <h2 className="what-modal-heading">What this can do</h2>
            <p className="what-modal-subtitle">
              Overview of all active options, modes, actions, and scheduled enhancements.
            </p>
          </div>

          <button type="button" className="what-modal-close" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="what-modal-stats-bar">
          <div className="stat-pill ready-pill">
            <CheckCircle2 size={13} />
            <span>{readyFeatures.length} Ready Features</span>
          </div>
          {soonFeatures.length > 0 && (
            <div className="stat-pill soon-pill">
              <Clock size={13} />
              <span>{soonFeatures.length} In Development</span>
            </div>
          )}
        </div>

        {/* Beta Limitation Callout */}
        {utility.status === 'beta' && (
          <div className="what-beta-limitation-banner" role="note">
            <span className="what-beta-tag">Beta</span>
            <span className="what-beta-text">
              {(utility as any).limitation ||
                'Local engine in beta: fully functional for standard files; edge cases and high-complexity layouts are in active refinement.'}
            </span>
          </div>
        )}

        {/* Features List */}
        <div className="what-modal-body">
          {features.length === 0 ? (
            <div className="what-empty-state">
              <p>Standard core desktop execution. No sub-features configured.</p>
            </div>
          ) : (
            <div className="what-features-list">
              {features.map((feat) => {
                const isSoon = feat.status === 'soon';

                return (
                  <div
                    key={feat.id}
                    className={`what-feature-row ${isSoon ? 'is-soon' : 'is-ready'}`}
                    onClick={() => {
                      onSelectFeature?.(feat.id);
                      onClose();
                    }}
                  >
                    <div className="what-feature-left">
                      <div className="what-feature-kind-badge" title={`Kind: ${feat.kind}`}>
                        {getKindIcon(feat.kind)}
                        <span>{feat.kind}</span>
                      </div>

                      <div className="what-feature-text">
                        <div className="what-feature-name-row">
                          <span className="what-feature-name">{feat.name}</span>
                          {isSoon ? (
                            <span className="feat-status-badge feat-status-soon">Soon</span>
                          ) : (
                            <span className="feat-status-badge feat-status-ready">Ready</span>
                          )}
                        </div>
                        <p className="what-feature-desc">{feat.description}</p>
                        {feat.aliases && feat.aliases.length > 0 && (
                          <div className="what-feature-aliases">
                            <span className="aliases-label">Aliases:</span>
                            <span className="aliases-list">{feat.aliases.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="what-feature-right">
                      <button
                        type="button"
                        className="what-jump-btn"
                        title="Jump to this control"
                      >
                        <span>Configure</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="what-modal-footer">
          <span className="what-footer-tip">
            Click any feature to highlight and focus its control in the options panel.
          </span>
          <button type="button" className="toiloki-btn toiloki-btn-ghost toiloki-btn-compact" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
