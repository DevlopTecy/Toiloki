import React from 'react';
import { Clock, ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { UtilityDefinition } from '../../core/types/workspace';
import './SoonState.css';

interface SoonStateProps {
  utility: UtilityDefinition;
  onBack?: () => void;
}

export const SoonState: React.FC<SoonStateProps> = ({ utility, onBack }) => {
  const IconComponent = utility.icon || Clock;

  return (
    <div className="soon-state-container motion-fade-in" role="region" aria-label="Not available yet">
      <div className="soon-state-card">
        <div className="soon-icon-badge">
          <IconComponent size={28} className="soon-tool-icon" />
          <div className="soon-mini-indicator" title="In development">
            <Clock size={12} />
          </div>
        </div>

        <div className="soon-badge-row">
          <span className="soon-pill-badge">SOON</span>
          <span className="soon-status-text">In Active Development</span>
        </div>

        <h2 className="soon-title">Not available yet</h2>

        <p className="soon-description">
          <strong>{utility.name}</strong> is currently scheduled for an upcoming release. Its offline engine and interface are being developed to ensure high precision and reliability.
        </p>

        {utility.description && (
          <div className="soon-planned-scope">
            <span className="soon-scope-label">Planned Capability:</span>
            <span className="soon-scope-text">{utility.description}</span>
          </div>
        )}

        <div className="soon-meta-pills">
          {utility.template && (
            <div className="soon-meta-item">
              <span className="meta-key">Template</span>
              <span className="meta-val">{utility.template}</span>
            </div>
          )}
          {utility.acceptedFormats && utility.acceptedFormats.length > 0 && (
            <div className="soon-meta-item">
              <span className="meta-key">Formats</span>
              <span className="meta-val">{utility.acceptedFormats.join(', ')}</span>
            </div>
          )}
        </div>

        {onBack && (
          <button type="button" className="soon-back-btn" onClick={onBack}>
            <ArrowLeft size={14} />
            <span>Return to utilities</span>
          </button>
        )}
      </div>
    </div>
  );
};
