import React, { useState } from 'react';
import { Info, Download, ShieldCheck, Check, FileText } from 'lucide-react';
import { Button } from '../../../common/Button';

interface LibraryNotice {
  name: string;
  version: string;
  license: string;
  description: string;
}

const BUNDLED_LIBRARIES: LibraryNotice[] = [
  { name: 'pdf-lib', version: '1.17.1', license: 'MIT', description: 'Creation, merging, splitting, reordering, and acroforms (PDF workspace)' },
  { name: 'pdfjs-dist', version: '4.10.38', license: 'Apache-2.0', description: 'Mozilla PDF.js rendering engine for canvas previews & thumbnails' },
  { name: 'mathjs', version: '14.9.1', license: 'Apache-2.0', description: 'Symbolic expression parser & high-precision math (Calculator workspace)' },
  { name: 'exceljs', version: '4.4.0', license: 'MIT', description: 'XLSX spreadsheet parsing, workbook compilation, and cell formatting' },
  { name: 'mammoth', version: '1.13.0', license: 'BSD-2-Clause', description: 'DOCX to HTML / clean plain text converter without Word dependencies' },
  { name: 'adm-zip', version: '0.5.18', license: 'MIT', description: 'ZIP archive inspection with Zip-Slip path traversal prevention' },
  { name: 'jszip', version: '3.10.2', license: 'MIT', description: 'In-memory ZIP archive generation & OpenXML container assembly' },
  { name: 'diff', version: '7.0.0', license: 'BSD-3-Clause', description: 'Unified diff computation & character-level text comparison' },
  { name: 'fast-xml-parser', version: '5.11.2', license: 'MIT', description: 'High-performance XML validation, formatting, and JSON parsing' },
  { name: 'jsonpath-plus', version: '10.3.0', license: 'MIT', description: 'JSONPath query expression evaluator across structured JSON' },
  { name: 'jsqr', version: '1.4.0', license: 'Apache-2.0', description: 'Offline QR code barcode scanner and matrix decoder from images' },
  { name: 'qrcode', version: '1.5.4', license: 'MIT', description: 'Canvas and SVG 2D QR code generator (Developer workspace)' },
  { name: 'exifreader', version: '4.46.0', license: 'MPL-2.0', description: 'Extracts camera EXIF tags, GPS coordinates, and lens metadata' },
  { name: 'papaparse', version: '5.7.0', license: 'MIT', description: 'RFC 4180 compliant CSV parser and stream tokenizer' },
  { name: 'yaml', version: '2.9.1', license: 'ISC', description: 'YAML 1.2 parser and stringifier with AST preservation' },
  { name: 'pako', version: '3.0.2', license: 'MIT / Zlib', description: 'High-speed zlib/deflate compression and decompression' },
  { name: 'cronstrue', version: '3.27.0', license: 'MIT', description: 'Translates cron schedule expressions into natural language' },
  { name: 'lucide-react', version: '1.49.0', license: 'ISC', description: 'Geometric desktop icon set across workspaces' },
  { name: 'react', version: '18.3.1', license: 'MIT', description: 'Declarative component framework' },
  { name: 'react-dom', version: '18.3.1', license: 'MIT', description: 'DOM rendering backend for React UI' },
];

export const AboutSection: React.FC = () => {
  const [exportedDiagnostic, setExportedDiagnostic] = useState(false);

  const handleExportDiagnostics = () => {
    const diagnosticsData = {
      app: 'Toiloki',
      version: '1.0.0',
      buildDate: 'October 2026',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'win32',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080',
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      offlinePledge: 'Everything runs on this device. No telemetry.',
      networkTraffic: 'None (100% offline local utility)',
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(diagnosticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toiloki-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportedDiagnostic(true);
    setTimeout(() => setExportedDiagnostic(false), 4000);
  };

  return (
    <div className="settings-section">
      <div className="section-header-row">
        <div>
          <h2 className="settings-section-title">About Toiloki</h2>
          <p className="settings-section-desc">
            Local-first desktop utility suite designed for speed, privacy, and precision.
          </p>
        </div>
      </div>

      {/* ─── 1. Core Trust Notice ─── */}
      <div className="settings-shield-line" style={{ marginBottom: '24px' }}>
        <ShieldCheck size={16} />
        <span>Everything runs on this device. No telemetry, no accounts, no AI, no cloud dependencies.</span>
      </div>

      {/* ─── 2. Build Information ─── */}
      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Version</label>
          <span className="settings-helper">Desktop release package</span>
        </div>
        <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          v1.0.0
        </span>
      </div>

      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Build date</label>
          <span className="settings-helper">Production compilation timestamp</span>
        </div>
        <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          October 2026
        </span>
      </div>

      <div className="settings-row">
        <div className="settings-row-info">
          <label className="settings-label">Architecture & Runtime</label>
          <span className="settings-helper">Local Electron sandbox with strict context isolation & CSP</span>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Windows x64 (NSIS / Portable)
        </span>
      </div>

      {/* ─── 3. Help & Problem Reporting (Local Only) ─── */}
      <div className="settings-row" style={{ marginTop: '16px' }}>
        <div className="settings-row-info">
          <label className="settings-label">Report a problem</label>
          <span className="settings-helper">
            Create a local diagnostic file (app version, OS, runtime parameters; no file contents or personal data) to attach to an email manually.
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportDiagnostics}
        >
          {exportedDiagnostic ? (
            <>
              <Check size={13} style={{ marginRight: '6px', color: 'var(--success)' }} />
              Saved diagnostic file
            </>
          ) : (
            <>
              <Download size={13} style={{ marginRight: '6px' }} />
              Export diagnostics
            </>
          )}
        </Button>
      </div>

      {/* ─── 4. Electron & Chromium License Notice ─── */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <FileText size={15} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
            Electron & Chromium runtime notice
          </h3>
        </div>
        <div
          style={{
            padding: '12px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--text-2)',
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: '0 0 6px 0' }}>
            Toiloki bundles the <strong>Electron</strong> runtime (Copyright OpenJS Foundation and contributors, MIT License) and portions of <strong>The Chromium Authors</strong> (BSD-style license).
          </p>
          <p style={{ margin: 0 }}>
            Chromium media capabilities utilize a dynamically linked <code>ffmpeg.dll</code> shared library licensed under the <strong>GNU Lesser General Public License (LGPL 2.1)</strong>. Dynamic linking allows end users to substitute this binary in the application directory.
          </p>
        </div>
      </div>

      {/* ─── 5. Open-Source Bundled Libraries ─── */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <FileText size={15} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
            Bundled open-source libraries (20)
          </h3>
        </div>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          All processing is 100% offline. Each bundled library operates under a permissive open-source license:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {BUNDLED_LIBRARIES.map((lib) => (
            <div
              key={lib.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginRight: '8px' }}>
                  {lib.name}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginRight: '10px' }}>
                  v{lib.version}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {lib.description}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {lib.license}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
