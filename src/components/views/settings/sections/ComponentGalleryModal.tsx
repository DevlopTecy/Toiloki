import React, { useState } from 'react';
import {
  X, Check, AlertCircle, Info, AlertTriangle, FileText, Upload, RefreshCw
} from 'lucide-react';
import { Button } from '../../../common/Button';

interface ComponentGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComponentGalleryModal: React.FC<ComponentGalleryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [inputText, setInputText] = useState('Sample editable text value');
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [radioVal, setRadioVal] = useState('opt1');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '90vw',
          maxWidth: '1100px',
          height: '85vh',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalPanelEnter 180ms var(--ease-out)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              Component Gallery
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              — Verification catalogue of all shared UI design tokens and components
            </span>
          </div>
          <button type="button" className="dialog-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Gallery Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          {/* 1. BUTTONS */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              BUTTONS (PRIMARY / SECONDARY / GHOST)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <Button variant="primary" size="md">
                <Check size={14} style={{ marginRight: '6px' }} /> Primary Action
              </Button>
              <Button variant="secondary" size="md">
                <FileText size={14} style={{ marginRight: '6px' }} /> Secondary
              </Button>
              <Button variant="ghost" size="md">
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> Ghost Button
              </Button>
              <Button variant="primary" size="md" disabled>
                Disabled
              </Button>
              <Button variant="primary" size="md" isLoading>
                Loading
              </Button>
            </div>
          </div>

          {/* 2. FORM INPUTS & CONTROLS */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              FORM INPUTS & SELECTS
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="settings-label" style={{ marginBottom: '4px', display: 'block' }}>Text input</label>
                <input
                  type="text"
                  className="settings-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="settings-label" style={{ marginBottom: '4px', display: 'block' }}>Select dropdown</label>
                <select className="settings-select" style={{ width: '100%' }}>
                  <option>Option Alpha (Standard)</option>
                  <option>Option Beta (Selected)</option>
                  <option>Option Gamma</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginTop: '16px', alignItems: 'center' }}>
              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={checkboxVal}
                  onChange={(e) => setCheckboxVal(e.target.checked)}
                />
                <span className="settings-switch-label">Switch Toggle</span>
              </label>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="gallery-radio"
                    value="opt1"
                    checked={radioVal === 'opt1'}
                    onChange={() => setRadioVal('opt1')}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  Radio 1
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="gallery-radio"
                    value="opt2"
                    checked={radioVal === 'opt2'}
                    onChange={() => setRadioVal('opt2')}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  Radio 2
                </label>
              </div>
            </div>
          </div>

          {/* 3. NOTIFICATIONS & BANNERS */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              STATUS BANNERS & BADGES
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(74, 222, 128, 0.10)',
                  border: '1px solid rgba(74, 222, 128, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-success)',
                  fontSize: '12.5px',
                }}
              >
                <Check size={16} /> Operation completed successfully with zero defects.
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.10)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-danger)',
                  fontSize: '12.5px',
                }}
              >
                <AlertCircle size={16} /> Parsing failed: Input format does not match required JSON schema.
              </div>
            </div>
          </div>

          {/* 4. SKELETON LOADERS */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              SKELETON PLACEHOLDERS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="motion-skeleton" style={{ height: '16px', width: '45%', borderRadius: 'var(--radius-xs)' }} />
              <div className="motion-skeleton" style={{ height: '12px', width: '75%', borderRadius: 'var(--radius-xs)' }} />
              <div className="motion-skeleton" style={{ height: '12px', width: '60%', borderRadius: 'var(--radius-xs)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
