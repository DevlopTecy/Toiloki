import React, { useState, useRef } from 'react';
import {
  Plus, Upload, Download, Copy, Trash2, Edit2, Check, Sparkles, AlertCircle
} from 'lucide-react';
import { useTheme } from '../../../../core/theme/ThemeContext';
import { AppTheme } from '../../../../core/theme/theme.types';
import { ThemeEditorModal } from './ThemeEditorModal';
import { Button } from '../../../common/Button';

export const ThemesSection: React.FC = () => {
  const {
    allThemes,
    customThemes,
    activeTheme,
    previewTheme,
    resolvedMode,
    selectTheme,
    createTheme,
    saveCustomTheme,
    duplicateTheme,
    renameTheme,
    deleteTheme,
    exportTheme,
    importTheme,
  } = useTheme();

  const [editingTheme, setEditingTheme] = useState<AppTheme | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedThemeId = previewTheme ? previewTheme.id : activeTheme.id;

  const handleCreateTheme = () => {
    const created = createTheme(selectedThemeId);
    setEditingTheme(created);
    setIsEditorOpen(true);
  };

  const handleEditTheme = (theme: AppTheme) => {
    setEditingTheme(theme);
    setIsEditorOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importTheme(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">Themes & Presets</h2>
          <p className="settings-section-desc">
            Select a curated preset or create and export your own fully customized theme.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.toiloki-theme.json"
            style={{ display: 'none' }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={13} style={{ marginRight: '6px' }} />
            Import theme
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateTheme}
          >
            <Plus size={14} style={{ marginRight: '6px' }} />
            Create theme
          </Button>
        </div>
      </div>

      {/* ─── 3-COLUMN GALLERY OF THEME CARDS ─── */}
      <div style={{ marginTop: '8px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '14px' }}>
          BUILT-IN PRESETS
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          {allThemes.filter((t) => t.isPreset).map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            const tokens = theme.tokens[resolvedMode] || theme.tokens.dark;

            return (
              <div
                key={theme.id}
                className={`theme-card ${isSelected ? 'is-active' : ''}`}
                onClick={() => selectTheme(theme.id)}
                style={{
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface)',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {/* Mini Live Preview Window */}
                <div
                  style={{
                    height: '110px',
                    borderRadius: tokens.radiusSm,
                    backgroundColor: tokens.bg,
                    border: `1px solid ${tokens.border}`,
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: '55px 1fr',
                    padding: '6px',
                    gap: '6px',
                  }}
                >
                  {/* Mini Sidebar */}
                  <div
                    style={{
                      backgroundColor: tokens.sidebar,
                      borderRadius: tokens.radiusXs,
                      border: `1px solid ${tokens.border}`,
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ width: '80%', height: '4px', backgroundColor: tokens.text, borderRadius: '2px', opacity: 0.8 }} />
                    <div style={{ width: '100%', height: '8px', backgroundColor: tokens.accentSoft, borderRadius: '2px', borderLeft: `2px solid ${tokens.accent}` }} />
                    <div style={{ width: '70%', height: '4px', backgroundColor: tokens.text2, borderRadius: '2px', opacity: 0.5 }} />
                  </div>

                  {/* Mini Card & Button */}
                  <div
                    style={{
                      backgroundColor: tokens.surface,
                      borderRadius: tokens.radiusXs,
                      border: `1px solid ${tokens.border}`,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ width: '65%', height: '5px', backgroundColor: tokens.text, borderRadius: '2px', marginBottom: '3px' }} />
                      <div style={{ width: '90%', height: '3px', backgroundColor: tokens.text2, borderRadius: '2px', opacity: 0.6 }} />
                    </div>
                    <div
                      style={{
                        backgroundColor: tokens.accent,
                        color: tokens.onAccent,
                        borderRadius: tokens.radiusXs,
                        padding: '2px 6px',
                        fontSize: '9px',
                        fontWeight: 600,
                        width: 'fit-content',
                      }}
                    >
                      Action
                    </div>
                  </div>
                </div>

                {/* Card Title & Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    {theme.name}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontWeight: 600,
                      }}
                    >
                      <Check size={12} /> Active
                    </span>
                  )}
                </div>

                {/* Quick actions row */}
                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="settings-ghost-reset-btn"
                    style={{ fontSize: '11px', padding: '2px 6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateTheme(theme.id);
                    }}
                    title="Duplicate into custom theme"
                  >
                    <Copy size={11} /> Duplicate
                  </button>
                  <button
                    type="button"
                    className="settings-ghost-reset-btn"
                    style={{ fontSize: '11px', padding: '2px 6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      exportTheme(theme.id);
                    }}
                    title="Export to file"
                  >
                    <Download size={11} /> Export
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── MY THEMES (CUSTOM THEMES) ─── */}
      <div style={{ marginTop: '28px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '14px' }}>
          MY THEMES ({customThemes.length})
        </h3>

        {customThemes.length === 0 ? (
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              textAlign: 'center',
              color: 'var(--text-2)',
              fontSize: '12.5px',
            }}
          >
            No custom themes created yet. Click "Create theme" or duplicate an existing preset to begin customizing.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px',
            }}
          >
            {customThemes.map((theme) => {
              const isSelected = selectedThemeId === theme.id;
              const tokens = theme.tokens[resolvedMode] || theme.tokens.dark;

              return (
                <div
                  key={theme.id}
                  className={`theme-card ${isSelected ? 'is-active' : ''}`}
                  onClick={() => selectTheme(theme.id)}
                  style={{
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface)',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                  }}
                >
                  {/* Mini Preview */}
                  <div
                    style={{
                      height: '110px',
                      borderRadius: tokens.radiusSm,
                      backgroundColor: tokens.bg,
                      border: `1px solid ${tokens.border}`,
                      overflow: 'hidden',
                      display: 'grid',
                      gridTemplateColumns: '55px 1fr',
                      padding: '6px',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: tokens.sidebar,
                        borderRadius: tokens.radiusXs,
                        border: `1px solid ${tokens.border}`,
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ width: '80%', height: '4px', backgroundColor: tokens.text, borderRadius: '2px', opacity: 0.8 }} />
                      <div style={{ width: '100%', height: '8px', backgroundColor: tokens.accentSoft, borderRadius: '2px', borderLeft: `2px solid ${tokens.accent}` }} />
                    </div>

                    <div
                      style={{
                        backgroundColor: tokens.surface,
                        borderRadius: tokens.radiusXs,
                        border: `1px solid ${tokens.border}`,
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ width: '65%', height: '5px', backgroundColor: tokens.text, borderRadius: '2px', marginBottom: '3px' }} />
                        <div style={{ width: '90%', height: '3px', backgroundColor: tokens.text2, borderRadius: '2px', opacity: 0.6 }} />
                      </div>
                      <div
                        style={{
                          backgroundColor: tokens.accent,
                          color: tokens.onAccent,
                          borderRadius: tokens.radiusXs,
                          padding: '2px 6px',
                          fontSize: '9px',
                          fontWeight: 600,
                          width: 'fit-content',
                        }}
                      >
                        Action
                      </div>
                    </div>
                  </div>

                  {/* Title & Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {theme.name}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 5px',
                        borderRadius: '2px',
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        fontWeight: 600,
                      }}
                    >
                      Custom
                    </span>
                  </div>

                  {/* Actions for custom theme */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="settings-ghost-reset-btn"
                      style={{ fontSize: '11px', padding: '2px 6px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTheme(theme);
                      }}
                      title="Edit colors in Theme Editor"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      type="button"
                      className="settings-ghost-reset-btn"
                      style={{ fontSize: '11px', padding: '2px 6px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportTheme(theme.id);
                      }}
                      title="Export theme"
                    >
                      <Download size={11} /> Export
                    </button>
                    <button
                      type="button"
                      className="settings-ghost-reset-btn"
                      style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--color-danger)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete custom theme "${theme.name}"?`)) {
                          deleteTheme(theme.id);
                        }
                      }}
                      title="Delete custom theme"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Theme Editor Modal */}
      {editingTheme && (
        <ThemeEditorModal
          theme={editingTheme}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTheme(null);
          }}
          onSave={(saved) => {
            saveCustomTheme(saved);
            setIsEditorOpen(false);
            setEditingTheme(null);
          }}
        />
      )}
    </div>
  );
};
