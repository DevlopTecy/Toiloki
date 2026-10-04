const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function replaceInFile(relPath, transforms) {
  const fullPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;
  for (const t of transforms) {
    if (typeof t.from === 'string') {
      if (!content.includes(t.from)) {
        console.warn(`[WARN] String target not found in ${relPath}: ${t.from.substring(0, 45)}...`);
      } else {
        content = content.split(t.from).join(t.to);
      }
    } else if (t.from instanceof RegExp) {
      if (!t.from.test(content)) {
        console.warn(`[WARN] Regex target not matched in ${relPath}: ${t.from}`);
      } else {
        content = content.replace(t.from, t.to);
      }
    }
  }
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${relPath}`);
  } else {
    console.log(`No changes made: ${relPath}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SHOUTING UPPERCASE JSX STRINGS & LABELS
// ─────────────────────────────────────────────────────────────────────────────

// ThemesSection.tsx
replaceInFile('src/components/views/settings/sections/ThemesSection.tsx', [
  { from: 'BUILT-IN PRESETS', to: 'Built-in Presets' }
]);

// ButtonsSection.tsx
replaceInFile('src/components/views/settings/sections/ButtonsSection.tsx', [
  { from: 'CARD & BUTTON PICTURES', to: 'Card & Button Pictures' }
]);

// DataWorkspaceView.tsx
replaceInFile('src/workspaces/data/DataWorkspaceView.tsx', [
  { from: '<span className="editor-lang-badge">INPUT DATA PAYLOAD</span>', to: '<span className="editor-lang-badge">Input Data Payload</span>' }
]);

// DeveloperWorkspaceView.tsx
replaceInFile('src/workspaces/developer/DeveloperWorkspaceView.tsx', [
  { from: 'DECODED HEADER', to: 'Decoded Header' },
  { from: 'DECODED PAYLOAD', to: 'Decoded Payload' },
  { from: 'CONVERTED RESULT', to: 'Converted Result' },
  { from: '>HUMAN READABLE<', to: '>Human Readable<' },
  { from: '>SELECT TECHNOLOGIES<', to: '>Select Technologies<' }
]);

// SecurityWorkspaceView.tsx
replaceInFile('src/workspaces/security/SecurityWorkspaceView.tsx', [
  { from: '>ENTROPY<', to: '>Entropy<' },
  { from: '>CRACK TIME<', to: '>Crack Time<' },
  { from: '>SUGGESTIONS<', to: '>Suggestions<' }
]);

// NetworkWorkspaceView.tsx
replaceInFile('src/workspaces/network/NetworkWorkspaceView.tsx', [
  { from: '<span className="net-stat-label">MIME TYPE</span>', to: '<span className="net-stat-label">MIME Type</span>' },
  { from: '<span className="net-stat-label">EXTENSION</span>', to: '<span className="net-stat-label">Extension</span>' },
  { from: '<span className="net-stat-label">CATEGORY</span>', to: '<span className="net-stat-label">Category</span>' },
  { from: '<span className="net-stat-label">OUI PREFIX</span>', to: '<span className="net-stat-label">OUI Prefix</span>' },
  { from: '<span className="net-stat-label">TRANSMISSION TYPE</span>', to: '<span className="net-stat-label">Transmission Type</span>' }
]);

// ImageCanvas.tsx
replaceInFile('src/components/workbench/images/ImageCanvas.tsx', [
  { from: '<span className="split-badge before">BEFORE</span>', to: '<span className="split-badge before">Before</span>' },
  { from: '<span className="split-badge after">AFTER</span>', to: '<span className="split-badge after">After</span>' }
]);

// SoonState.tsx
replaceInFile('src/components/common/SoonState.tsx', [
  { from: '<span className="soon-pill-badge">SOON</span>', to: '<span className="soon-pill-badge">Soon</span>' }
]);

// TitleBar.tsx
replaceInFile('src/components/layout/TitleBar.tsx', [
  { from: '<span className="app-wordmark">TOILOKI</span>', to: '<span className="app-wordmark">Toiloki</span>' },
  { from: '<span className="app-suite-caption">LOCAL UTILITY SUITE</span>', to: '<span className="app-suite-caption">Local Utility Suite</span>' }
]);

// TitleBar.css
replaceInFile('src/components/layout/TitleBar.css', [
  { from: 'letter-spacing: 0.08em;', to: 'letter-spacing: 0.02em;' }
]);

// ─────────────────────────────────────────────────────────────────────────────
// 2. ORANGE DISCIPLINE: PASSWORD & COLOR CODE OUTPUTS + DROPZONE BUTTON
// ─────────────────────────────────────────────────────────────────────────────

// SecurityWorkspaceView.css: password outputs use primary text, not amber
replaceInFile('src/workspaces/security/SecurityWorkspaceView.css', [
  { from: 'color: var(--accent, #d4b06a);', to: 'color: var(--text-primary);' },
  { from: 'text-transform: uppercase;\r\n  letter-spacing: 0.06em;', to: 'text-transform: none;\r\n  letter-spacing: normal;' },
  { from: 'text-transform: uppercase;\n  letter-spacing: 0.06em;', to: 'text-transform: none;\n  letter-spacing: normal;' }
]);

// DesignWorkspaceView.css: color codes and ratio use primary text
replaceInFile('src/workspaces/design/DesignWorkspaceView.css', [
  { from: 'color: var(--accent, #d4b06a);', to: 'color: var(--text-primary);' },
  { from: 'text-transform: uppercase;\r\n  letter-spacing: 0.05em;', to: 'text-transform: none;\r\n  letter-spacing: normal;' },
  { from: 'text-transform: uppercase;\n  letter-spacing: 0.05em;', to: 'text-transform: none;\n  letter-spacing: normal;' }
]);

// CalculatorWorkspaceView.css: calculation results use primary text
replaceInFile('src/workspaces/calculator/CalculatorWorkspaceView.css', [
  { from: 'color: var(--accent-amber);', to: 'color: var(--text-primary);' }
]);

// DeveloperWorkspaceView.css: match chip text uses primary text
replaceInFile('src/workspaces/developer/DeveloperWorkspaceView.css', [
  { from: 'color: var(--accent-amber);', to: 'color: var(--text-primary);' }
]);

// FileDropzone.tsx: Choose files button is secondary
replaceInFile('src/components/file-system/FileDropzone.tsx', [
  { from: 'className="toiloki-btn toiloki-btn-primary"', to: 'className="toiloki-btn toiloki-btn-secondary"' }
]);

// ─────────────────────────────────────────────────────────────────────────────
// 3. TABLE HEADERS & LABELS: REMOVE SHOUTING UPPERCASE / MONO TRACKING
// ─────────────────────────────────────────────────────────────────────────────

// PdfWorkspaceView.css
replaceInFile('src/workspaces/pdf/PdfWorkspaceView.css', [
  {
    from: `.merge-list-title {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--font-mono);
}`,
    to: `.merge-list-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: none;
  letter-spacing: normal;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.thumbnails-title {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}`,
    to: `.thumbnails-title {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-tertiary);
  font-family: var(--font-sans);
}`
  },
  {
    from: `.compare-metric-label {
  font-size: 10px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  font-family: var(--font-mono);
}`,
    to: `.compare-metric-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: none;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.form-field-type {
  font-size: 9.5px;
  text-transform: uppercase;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}`,
    to: `.form-field-type {
  font-size: 10.5px;
  text-transform: none;
  color: var(--text-tertiary);
  font-family: var(--font-sans);
}`
  }
]);

// TextWorkspaceView.css
replaceInFile('src/workspaces/text/TextWorkspaceView.css', [
  {
    from: `.metric-lbl {
  font-size: 9.5px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--font-mono);
}`,
    to: `.metric-lbl {
  font-size: 10.5px;
  color: var(--text-tertiary);
  text-transform: none;
  letter-spacing: normal;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.pane-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}`,
    to: `.pane-title {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
  color: var(--text-tertiary);
  font-family: var(--font-sans);
}`
  },
  {
    from: `.diff-card-title {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin: 0;
}`,
    to: `.diff-card-title {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
  color: var(--text-tertiary);
  margin: 0;
}`
  }
]);

// SystemWorkspaceView.css
replaceInFile('src/workspaces/system/SystemWorkspaceView.css', [
  {
    from: `.sys-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}`,
    to: `.sys-stat-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-tertiary, #6b7280);
  text-transform: none;
  letter-spacing: normal;
}`
  },
  {
    from: `.sys-secret-pill {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;`,
    to: `.sys-secret-pill {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: none;`
  }
]);

// ImagesWorkspaceView.css
replaceInFile('src/workspaces/images/ImagesWorkspaceView.css', [
  {
    from: `.controls-panel-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle);
  margin: 0;
}`,
    to: `.controls-panel-title {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
  color: var(--text-tertiary);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle);
  margin: 0;
}`
  },
  {
    from: `.group-heading {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}`,
    to: `.group-heading {
  font-size: 11px;
  text-transform: none;
  font-weight: 600;
  letter-spacing: normal;
  color: var(--text-tertiary);
  font-family: var(--font-sans);
}`
  }
]);

// DocumentsWorkspaceView.css
replaceInFile('src/workspaces/documents/DocumentsWorkspaceView.css', [
  {
    from: `.diff-card-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}`,
    to: `.diff-card-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-tertiary);
  font-family: var(--font-sans);
}`
  }
]);

// DeveloperWorkspaceView.css
replaceInFile('src/workspaces/developer/DeveloperWorkspaceView.css', [
  {
    from: `.editor-tag {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  text-transform: uppercase;
  font-family: var(--font-mono);
}`,
    to: `.editor-tag {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: normal;
  color: var(--text-tertiary);
  text-transform: none;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.result-label-tag {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  text-transform: uppercase;
  font-family: var(--font-mono);
}`,
    to: `.result-label-tag {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: normal;
  color: var(--text-tertiary);
  text-transform: none;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.uuid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-raised);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--font-mono);
}`,
    to: `.uuid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-raised);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: none;
  letter-spacing: normal;
  font-family: var(--font-sans);
}`
  }
]);

// FilesWorkspaceView.css
replaceInFile('src/workspaces/files/FilesWorkspaceView.css', [
  {
    from: `.rename-preview-title {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin: 0;
}`,
    to: `.rename-preview-title {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
  color: var(--text-tertiary);
  margin: 0;
}`
  },
  {
    from: `.rename-header-row {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  background-color: var(--bg-input);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--font-mono);
  border-bottom: 1px solid var(--border-subtle);
}`,
    to: `.rename-header-row {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  background-color: var(--bg-input);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: none;
  letter-spacing: normal;
  font-family: var(--font-sans);
  border-bottom: 1px solid var(--border-subtle);
}`
  },
  {
    from: `.archive-header-row {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  background-color: var(--bg-input);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--font-mono);
  border-bottom: 1px solid var(--border-subtle);
}`,
    to: `.archive-header-row {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  background-color: var(--bg-input);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: none;
  letter-spacing: normal;
  font-family: var(--font-sans);
  border-bottom: 1px solid var(--border-subtle);
}`
  },
  { from: 'text-transform: uppercase;\r\n  background-color: rgba(74, 222, 128, 0.10);', to: 'text-transform: none;\r\n  background-color: rgba(74, 222, 128, 0.10);' },
  { from: 'text-transform: uppercase;\n  background-color: rgba(74, 222, 128, 0.10);', to: 'text-transform: none;\n  background-color: rgba(74, 222, 128, 0.10);' },
  { from: 'text-transform: uppercase;\r\n  background-color: rgba(248, 113, 113, 0.10);', to: 'text-transform: none;\r\n  background-color: rgba(248, 113, 113, 0.10);' },
  { from: 'text-transform: uppercase;\n  background-color: rgba(248, 113, 113, 0.10);', to: 'text-transform: none;\n  background-color: rgba(248, 113, 113, 0.10);' }
]);

// CalculatorWorkspaceView.css
replaceInFile('src/workspaces/calculator/CalculatorWorkspaceView.css', [
  {
    from: `.calc-card-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin: 0;
}`,
    to: `.calc-card-title {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
  color: var(--text-tertiary);
  margin: 0;
}`
  },
  {
    from: `.stat-pill-label {
  font-size: 9.5px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--font-mono);
}`,
    to: `.stat-pill-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: none;
  letter-spacing: normal;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.stat-title {
  font-size: 9.5px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  font-family: var(--font-mono);
}`,
    to: `.stat-title {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: none;
  font-family: var(--font-sans);
}`
  }
]);

// DataWorkspaceView.css
replaceInFile('src/workspaces/data/DataWorkspaceView.css', [
  {
    from: `.interactive-data-table th {
  height: 32px;
  padding: 0 12px;
  background: var(--bg-input);
  color: var(--text-tertiary);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--font-mono);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  cursor: pointer;
  user-select: none;
  z-index: 10;
}`,
    to: `.interactive-data-table th {
  height: 32px;
  padding: 0 12px;
  background: var(--bg-input);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  font-family: var(--font-sans);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  cursor: pointer;
  user-select: none;
  z-index: 10;
}`
  }
]);

// TrashView.css
replaceInFile('src/components/views/TrashView.css', [
  {
    from: `.trash-table th {
  background-color: var(--surface-raised);
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}`,
    to: `.trash-table th {
  background-color: var(--surface-raised);
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}`
  }
]);

// HistoryView.css
replaceInFile('src/components/views/HistoryView.css', [
  {
    from: `.history-table th {
  height: 32px;
  padding: 0 12px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--font-mono);
  background-color: var(--bg-input);
  border-bottom: 1px solid var(--border-subtle);
}`,
    to: `.history-table th {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: none;
  letter-spacing: normal;
  font-family: var(--font-sans);
  background-color: var(--bg-input);
  border-bottom: 1px solid var(--border-subtle);
}`
  }
]);

// BatchQueueTable.css
replaceInFile('src/components/file-system/BatchQueueTable.css', [
  {
    from: `.batch-table th {
  height: 32px;
  padding: 0 12px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--font-mono);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-input);
  position: sticky;
  top: 0;
  z-index: 2;
}`,
    to: `.batch-table th {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: none;
  letter-spacing: normal;
  font-family: var(--font-sans);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-input);
  position: sticky;
  top: 0;
  z-index: 2;
}`
  }
]);

// WorkbenchShell.css
replaceInFile('src/components/workbench/WorkbenchShell.css', [
  {
    from: `.modal-body h4 {
  margin: 16px 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}`,
    to: `.modal-body h4 {
  margin: 16px 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: none;
  letter-spacing: normal;
}`
  }
]);

// CommandPalette.css
replaceInFile('src/components/search/CommandPalette.css', [
  {
    from: `.feat-kind-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.08);
}`,
    to: `.feat-kind-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-sans);
  font-size: 10.5px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.08);
}`
  }
]);

// ResultViewer.css
replaceInFile('src/components/file-system/ResultViewer.css', [
  {
    from: `.meta-label {
  font-size: 9.5px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  font-family: var(--font-mono);
}`,
    to: `.meta-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: none;
  letter-spacing: normal;
  font-weight: 600;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.metric-tag {
  font-size: 9.5px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  font-family: var(--font-mono);
}`,
    to: `.metric-tag {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: none;
  letter-spacing: normal;
  font-weight: 600;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.saved-label {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 9.5px;
  letter-spacing: 0.05em;
  font-family: var(--font-mono);
}`,
    to: `.saved-label {
  font-weight: 600;
  text-transform: none;
  font-size: 11px;
  letter-spacing: normal;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.send-to-menu-header {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  padding: 4px 8px;
}`,
    to: `.send-to-menu-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-muted);
  padding: 4px 8px;
}`
  }
]);

// FeaturesControlsPanel.css
replaceInFile('src/components/common/FeaturesControlsPanel.css', [
  {
    from: `.feature-group-label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted, #8A8F98);
}`,
    to: `.feature-group-label {
  font-family: var(--font-sans);
  font-size: 11.5px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-muted, #8A8F98);
}`
  },
  {
    from: `.feat-mini-badge {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}`,
    to: `.feat-mini-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: none;
  letter-spacing: normal;
  flex-shrink: 0;
}`
  }
]);

// WhatThisCanDoModal.css
replaceInFile('src/components/common/WhatThisCanDoModal.css', [
  {
    from: `.what-tool-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent, #D4B06A);
}`,
    to: `.what-tool-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-sans);
  font-size: 11.5px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  color: var(--accent, #D4B06A);
}`
  },
  {
    from: `.feat-status-badge {
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}`,
    to: `.feat-status-badge {
  font-family: var(--font-sans);
  font-size: 10.5px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: none;
  letter-spacing: normal;
}`
  }
]);

// SmartPasteModal.css
replaceInFile('src/components/common/SmartPasteModal.css', [
  {
    from: `  letter-spacing: 0.04em;
  text-transform: uppercase;`,
    to: `  letter-spacing: normal;
  text-transform: none;`
  },
  {
    from: `.smart-paste-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}`,
    to: `.smart-paste-section-label {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-muted);
}`
  },
  {
    from: `  font-weight: 700;
  text-transform: uppercase;`,
    to: `  font-weight: 600;
  text-transform: none;`
  }
]);

// SoonState.css
replaceInFile('src/components/common/SoonState.css', [
  {
    from: `.soon-pill-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted, #94A3B8);
}`,
    to: `.soon-pill-badge {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted, #94A3B8);
}`
  },
  {
    from: `.soon-scope-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted, #8C95A0);
}`,
    to: `.soon-scope-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-muted, #8C95A0);
}`
  }
]);

// StatusBadge.css
replaceInFile('src/components/common/StatusBadge.css', [
  {
    from: `  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;`,
    to: `  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;`
  }
]);

// ToolListPanel.css
replaceInFile('src/components/layout/ToolListPanel.css', [
  {
    from: `  line-height: 1.35;
  letter-spacing: 0.02em;
  text-transform: uppercase;`,
    to: `  line-height: 1.35;
  letter-spacing: normal;
  text-transform: none;`
  }
]);

// FavoritesView.css
replaceInFile('src/components/views/FavoritesView.css', [
  {
    from: `.fav-workspace-pill {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  background-color: var(--bg-raised);
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--border-subtle);
}`,
    to: `.fav-workspace-pill {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  background-color: var(--bg-raised);
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  text-transform: none;
  letter-spacing: normal;
  border: 1px solid var(--border-subtle);
}`
  }
]);

// ProcessingView.css
replaceInFile('src/components/feedback/ProcessingView.css', [
  {
    from: `.processing-state-badge {
  font-size: 10px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  font-family: var(--font-mono);
}`,
    to: `.processing-state-badge {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
  font-family: var(--font-sans);
}`
  },
  {
    from: `.processing-file-row .file-label {
  color: var(--text-tertiary);
  flex-shrink: 0;
  text-transform: uppercase;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
}`,
    to: `.processing-file-row .file-label {
  color: var(--text-tertiary);
  flex-shrink: 0;
  text-transform: none;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: normal;
}`
  }
]);

// DropAnywhereOverlay.css
replaceInFile('src/components/common/DropAnywhereOverlay.css', [
  {
    from: `.drop-anywhere-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
  background-color: rgba(212, 176, 106, 0.12);
  border: 1px solid rgba(212, 176, 106, 0.3);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  font-family: var(--font-mono);
}`,
    to: `.drop-anywhere-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  color: var(--color-accent);
  background-color: rgba(212, 176, 106, 0.12);
  border: 1px solid rgba(212, 176, 106, 0.3);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  font-family: var(--font-sans);
}`
  }
]);

// ErrorPanel.css
replaceInFile('src/components/common/ErrorPanel.css', [
  {
    from: `.error-category-badge {
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-danger);
}`,
    to: `.error-category-badge {
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-sans);
  text-transform: none;
  letter-spacing: normal;
  color: var(--color-danger);
}`
  },
  {
    from: `.error-field-label {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 10px;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}`,
    to: `.error-field-label {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 11px;
  font-family: var(--font-sans);
  text-transform: none;
  letter-spacing: normal;
}`
  }
]);

// PdfTrayCanvas.css
replaceInFile('src/components/workbench/pdf/PdfTrayCanvas.css', [
  {
    from: `.compare-slot-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}`,
    to: `.compare-slot-tag {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: none;
  letter-spacing: normal;
}`
  }
]);

console.log('Phase 10 cleanup script finished.');
