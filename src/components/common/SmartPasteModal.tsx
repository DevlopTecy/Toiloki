import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Clipboard, Check } from 'lucide-react';
import { SmartPasteService, SmartPasteDetection, MatchingUtilitySuggestion } from '../../core/services/smart-paste.service';
import { PipeService } from '../../core/services/pipe.service';
import { WorkspaceId } from '../../core/types/workspace';
import './SmartPasteModal.css';

interface SmartPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUtility: (workspaceId: WorkspaceId, groupId: string, utilityId: string) => void;
  initialText?: string;
}

export const SmartPasteModal: React.FC<SmartPasteModalProps> = ({
  isOpen,
  onClose,
  onSelectUtility,
  initialText,
}) => {
  const [inputText, setInputText] = useState(initialText || '');
  const [detection, setDetection] = useState<SmartPasteDetection | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // If initial text is passed, use it immediately
    if (initialText) {
      setInputText(initialText);
      setDetection(SmartPasteService.detect(initialText));
      return;
    }

    // Try reading system clipboard automatically
    if (navigator.clipboard?.readText) {
      navigator.clipboard
        .readText()
        .then((clip) => {
          if (clip) {
            setInputText(clip);
            setDetection(SmartPasteService.detect(clip));
          } else {
            setDetection(SmartPasteService.detect(''));
          }
        })
        .catch(() => {
          setDetection(SmartPasteService.detect(''));
        });
    } else {
      setDetection(SmartPasteService.detect(''));
    }
  }, [isOpen, initialText]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    setDetection(SmartPasteService.detect(text));
  };

  const handleLaunchUtility = (util: MatchingUtilitySuggestion) => {
    if (inputText) {
      PipeService.pipeToUtility(util.utilityId, {
        text: inputText,
        format: detection?.formatId || 'text',
        sourceUtilityName: `Smart Paste (${detection?.badgeText || 'Text'})`,
      });
    }
    onSelectUtility(util.workspaceId, util.groupId, util.utilityId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="smart-paste-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Smart Paste Sniffer"
    >
      <div className="smart-paste-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="smart-paste-header">
          <div className="smart-paste-title-area">
            <Clipboard size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="smart-paste-title">Smart Paste</h3>
            {detection && detection.formatId !== 'unknown' && (
              <span className="smart-paste-format-badge">{detection.badgeText}</span>
            )}
          </div>
          <button
            type="button"
            className="smart-paste-close-btn"
            onClick={onClose}
            aria-label="Close Smart Paste modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="smart-paste-body">
          {/* Clipboard / Input Preview */}
          <div className="smart-paste-input-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="smart-paste-section-label">Detected Content</span>
              {detection && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {detection.formatTitle}
                </span>
              )}
            </div>

            <textarea
              className="smart-paste-preview-box"
              style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
              value={inputText}
              placeholder="Paste content here or press Ctrl+V..."
              onChange={(e) => handleTextChange(e.target.value)}
              autoFocus
            />
          </div>

          {/* Matching Utilities */}
          <div className="smart-paste-input-section">
            <div className="smart-paste-matches-header">
              <span className="smart-paste-section-label">Recommended Utilities</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {detection?.suggestedUtilities.length || 0} matches
              </span>
            </div>

            <div className="smart-paste-matches-list">
              {detection && detection.suggestedUtilities.length > 0 ? (
                detection.suggestedUtilities.map((util) => (
                  <button
                    key={`${util.workspaceId}-${util.utilityId}`}
                    type="button"
                    className={`smart-paste-utility-card ${util.isPrimary ? 'primary' : ''}`}
                    onClick={() => handleLaunchUtility(util)}
                  >
                    <div className="smart-paste-util-info">
                      <div className="smart-paste-util-name">
                        <span>{util.name}</span>
                        {util.isPrimary && (
                          <span className="smart-paste-primary-tag">Recommended</span>
                        )}
                      </div>
                      <div className="smart-paste-util-desc">{util.description}</div>
                    </div>
                    <div className="smart-paste-open-action">
                      <span>Open</span>
                      <ArrowRight size={13} />
                    </div>
                  </button>
                ))
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                  No specialized utility matched this format. Try pasting JSON, JWT, Cron, Color, Timestamp, CSV, or URL.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="smart-paste-footer">
          <span>100% offline & local content sniffing</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span>Press <span className="smart-paste-kbd">Esc</span> to dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
};
