import React, { useState } from 'react';
import { X, Play, Link, Sliders, Trash2, Check, ArrowRight } from 'lucide-react';
import { PresetsService, UtilityChain, UtilityPreset } from '../../core/services/presets.service';
import { WorkspaceId } from '../../core/types/workspace';
import { Button } from './Button';
import './ChainsModal.css';

interface ChainsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchUtility: (workspaceId: WorkspaceId, groupId: string, utilityId: string) => void;
}

export const ChainsModal: React.FC<ChainsModalProps> = ({
  isOpen,
  onClose,
  onLaunchUtility,
}) => {
  const [activeTab, setActiveTab] = useState<'chains' | 'presets'>('chains');
  const [chains, setChains] = useState<UtilityChain[]>(() => PresetsService.getAllChains());
  const [selectedUtilityFilter, setSelectedUtilityFilter] = useState<string>('all');

  if (!isOpen) return null;

  const handleRunChain = (chain: UtilityChain) => {
    if (chain.steps.length === 0) return;
    const firstStep = chain.steps[0];
    onLaunchUtility(firstStep.workspaceId, firstStep.groupId, firstStep.utilityId);
    onClose();
  };

  return (
    <div
      className="chains-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Presets and Chains"
    >
      <div className="chains-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chains-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link size={16} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 650, color: 'var(--text)' }}>
              Presets & Execution Chains
            </h3>
          </div>
          <button
            type="button"
            className="smart-paste-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="chains-modal-tabs">
          <button
            type="button"
            className={`chains-tab-btn ${activeTab === 'chains' ? 'active' : ''}`}
            onClick={() => setActiveTab('chains')}
          >
            Execution Chains ({chains.length})
          </button>
          <button
            type="button"
            className={`chains-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            Utility Presets
          </button>
        </div>

        {/* Body */}
        <div className="chains-modal-body">
          {activeTab === 'chains' ? (
            chains.map((chain) => (
              <div key={chain.id} className="chain-item-card">
                <div className="chain-card-top">
                  <div>
                    <h4 className="chain-card-title">{chain.name}</h4>
                    <p className="chain-card-desc">{chain.description}</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => handleRunChain(chain)}>
                    <Play size={12} style={{ marginRight: '5px' }} />
                    Run Chain
                  </Button>
                </div>

                {/* Steps sequence */}
                <div className="chain-steps-flow">
                  {chain.steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <span className="chain-step-pill">
                        <strong>{idx + 1}.</strong> {step.utilityName}
                      </span>
                      {idx < chain.steps.length - 1 && (
                        <ArrowRight size={11} className="chain-step-arrow" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                Per-utility presets save common parameter configurations for one-click re-use.
              </p>
              {['format-json-code', 'img-resize', 'compress-image', 'compress-pdf', 'case-conversion'].map(
                (utilId) => {
                  const presets = PresetsService.getPresetsForUtility(utilId);
                  return (
                    <div
                      key={utilId}
                      style={{
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 650,
                          color: 'var(--color-accent)',
                          marginBottom: '6px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {utilId}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {presets.map((p) => (
                          <span
                            key={p.id}
                            style={{
                              fontSize: '11px',
                              backgroundColor: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '3px',
                              padding: '2px 8px',
                              color: 'var(--text)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>{p.name}</span>
                            {p.isBuiltin && (
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(Built-in)</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="chains-modal-footer">
          <span>Configured locally in browser & Electron storage</span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};
